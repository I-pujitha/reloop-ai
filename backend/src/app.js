import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User, Analysis, Action, PointsTransaction, RecyclingCentre, Reward } from './models.js';
import { analyseImage } from './services/ollama.js';

const app = express();
app.use(helmet());
const frontendOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean),
]);
app.use(cors({origin(origin,callback){callback(null,!origin||frontendOrigins.has(origin));}}));
app.use(express.json({limit:'100kb'}));
app.use('/api/auth', rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:true,legacyHeaders:false}));
app.use('/api/analyze', rateLimit({windowMs:60*1000,limit:8,standardHeaders:true,legacyHeaders:false}));
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:Number(process.env.MAX_UPLOAD_MB||5)*1024*1024,files:1},fileFilter(_req,file,cb){const ok=['image/jpeg','image/png','image/webp'].includes(file.mimetype); cb(ok?null:new Error('Unsupported image type. Upload JPG, PNG, or WebP.'),ok);}});
const fail = (res,status,error) => res.status(status).json({error});
const tokenFor = user => jwt.sign({sub:user.id,role:user.role},process.env.JWT_SECRET || 'dev-only-secret-change-this-before-running', {expiresIn:process.env.JWT_EXPIRES_IN||'2h'});
async function auth(req,res,next){try{const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))return fail(res,401,'Please log in.');const p=jwt.verify(h.slice(7),process.env.JWT_SECRET||'dev-only-secret-change-this-before-running');const user=await User.findById(p.sub);if(!user)return fail(res,401,'Session user no longer exists.');req.user=user;next();}catch{return fail(res,401,'Session expired or invalid. Please log in again.');}}
function admin(req,res,next){if(req.user.role!=='admin')return fail(res,403,'Admin access required.');next();}
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'reloop-ai-api',database:mongoose.connection.readyState===1?'connected':'disconnected',ai:'Ollama configured; live status checked on analysis'}));

app.post('/api/auth/signup',async(req,res,next)=>{try{const input=z.object({name:z.string().trim().min(2).max(80),email:z.string().email().max(254),password:z.string().min(8).max(72)}).safeParse(req.body);if(!input.success)return fail(res,400,input.error.issues[0].message);const email=input.data.email.toLowerCase();if(await User.exists({email}))return fail(res,409,'An account with this email already exists.');const user=await User.create({name:input.data.name,email,passwordHash:await bcrypt.hash(input.data.password,12)});res.status(201).json({token:tokenFor(user),user:{id:user.id,name:user.name,email:user.email,points:user.points,role:user.role}});}catch(e){next(e);}});
app.post('/api/auth/login',async(req,res,next)=>{try{const input=z.object({email:z.string().email(),password:z.string().min(1).max(72)}).safeParse(req.body);if(!input.success)return fail(res,400,'Enter a valid email and password.');const user=await User.findOne({email:input.data.email.toLowerCase()});if(!user||!(await bcrypt.compare(input.data.password,user.passwordHash)))return fail(res,401,'Email or password is incorrect.');res.json({token:tokenFor(user),user:{id:user.id,name:user.name,email:user.email,points:user.points,role:user.role}});}catch(e){next(e);}});

app.get('/api/dashboard',auth,async(req,res,next)=>{try{const [count,weight,actions,recent,user]=await Promise.all([Analysis.countDocuments({user:req.user.id}),Analysis.aggregate([{$match:{user:req.user._id}},{$group:{_id:null,total:{$sum:0.15}}}]),Action.countDocuments({user:req.user.id}),Analysis.find({user:req.user.id}).sort({createdAt:-1}).limit(5).lean(),User.findById(req.user.id).select('points')]);res.json({submissions:count,estimatedKg:Number((weight[0]?.total||0).toFixed(2)),actionsRecorded:actions,points:user.points,recent});}catch(e){next(e);}});
app.post('/api/analyze',auth,(req,res,next)=>upload.single('image')(req,res,async err=>{if(err)return fail(res,400,err.message);try{if(!req.file)return fail(res,400,'Choose an image first.');const result=await analyseImage(req.file.buffer,req.file.mimetype);const analysis=await Analysis.create({user:req.user.id,originalName:req.file.originalname.slice(0,180),...result});res.status(201).json({analysis});}catch(e){next(e);}}));
app.get('/api/analyses',auth,async(req,res,next)=>{try{res.json(await Analysis.find({user:req.user.id}).sort({createdAt:-1}).limit(100).lean());}catch(e){next(e);}});
app.post('/api/actions',auth,async(req,res,next)=>{try{const input=z.object({analysisId:z.string().refine(v=>mongoose.isValidObjectId(v),'Invalid analysis ID'),notes:z.string().max(500).optional()}).safeParse(req.body);if(!input.success)return fail(res,400,input.error.issues[0].message);const analysis=await Analysis.findOne({_id:input.data.analysisId,user:req.user.id});if(!analysis)return fail(res,404,'Analysis not found.');if(await Action.exists({user:req.user.id,analysis:analysis.id}))return fail(res,409,'You already recorded an action for this analysis.');const action=await Action.create({user:req.user.id,analysis:analysis.id,notes:input.data.notes,status:'user-reported',pointsAwarded:10});await User.updateOne({_id:req.user.id},{$inc:{points:10}});await PointsTransaction.create({user:req.user.id,kind:'earned',points:10,description:'Recycling action recorded (user-reported)',action:action.id});res.status(201).json({action,pointsAwarded:10,message:'Action recorded. This is user-reported, not independently verified.'});}catch(e){if(e.code===11000)return fail(res,409,'You already recorded an action for this analysis.');next(e);}});
app.get('/api/actions',auth,async(req,res,next)=>{try{res.json(await Action.find({user:req.user.id}).populate('analysis','itemCategory recommendedAction').sort({createdAt:-1}).lean());}catch(e){next(e);}});
app.get('/api/recycling-centres',auth,async(req,res,next)=>{try{
  if(req.query.pincode!==undefined){
    const parsed=z.string().regex(/^\d{6}$/,'Enter a valid six-digit Indian PIN code.').safeParse(req.query.pincode);
    if(!parsed.success)return fail(res,400,parsed.error.issues[0].message);
    const pincode=parsed.data;
    let lookup;
    try{
      const response=await fetch(`https://api.postalpincode.in/pincode/${pincode}`,{signal:AbortSignal.timeout(10000)});
      if(!response.ok)return fail(res,502,'PIN-code lookup is temporarily unavailable. Please try again.');
      lookup=await response.json();
    }catch(error){
      console.error('PIN-code lookup failed:',error);
      return fail(res,502,'Could not look up this PIN code. Please try again.');
    }
    const result=Array.isArray(lookup)?lookup[0]:null;
    const office=result?.Status==='Success'&&Array.isArray(result.PostOffice)
      ?result.PostOffice.find(office=>office&&typeof office.Division==='string'&&typeof office.State==='string'&&typeof office.Country==='string')
      :null;
    if(!office)return fail(res,404,'No location was found for this PIN code.');
    const location={pincode,city:office.Division.trim(),state:office.State.trim(),country:office.Country.trim()};
    const centres=await RecyclingCentre.find({isSample:false,$or:[{pincode},{city:location.city}]}).limit(50).lean();
    return res.json({location,centres});
  }
  const query=String(req.query.query||'').trim().slice(0,80);
  const filter=query
    ?{isSample:false,$or:[{city:{$regex:query,$options:'i'}},{pincode:{$regex:query,$options:'i'}},{address:{$regex:query,$options:'i'}}]}
    :{isSample:false};
  res.json(await RecyclingCentre.find(filter).limit(50).lean());
}catch(e){next(e);}});
app.get('/api/rewards',auth,async(_req,res,next)=>{try{res.json(await Reward.find().sort({cost:1}).lean());}catch(e){next(e);}});
app.post('/api/rewards/:id/redeem',auth,async(req,res,next)=>{try{const reward=await Reward.findById(req.params.id);if(!reward)return fail(res,404,'Reward not found.');const user=await User.findById(req.user.id);if(user.points<reward.cost)return fail(res,400,'Not enough eco-points.');user.points-=reward.cost;await user.save();await PointsTransaction.create({user:user.id,kind:'redeemed',points:-reward.cost,description:`Simulated reward redemption: ${reward.name}`,rewardId:reward.id});res.json({message:'Simulated redemption complete. This is not a real partner coupon.',points:user.points,reward});}catch(e){next(e);}});
app.get('/api/profile',auth,async(req,res,next)=>{try{const user=await User.findById(req.user.id).select('name email points role createdAt');const transactions=await PointsTransaction.find({user:req.user.id}).sort({createdAt:-1}).limit(50).lean();res.json({user,transactions});}catch(e){next(e);}});
app.patch('/api/admin/actions/:id/verify',auth,admin,async(req,res,next)=>{try{const action=await Action.findByIdAndUpdate(req.params.id,{status:'verified',verifiedBy:req.user.id,verifiedAt:new Date()},{new:true});if(!action)return fail(res,404,'Action not found.');res.json({action});}catch(e){next(e);}});
app.use((err,_req,res,_next)=>{console.error(err);if(err?.name==='ValidationError')return fail(res,400,'Submitted data is invalid.');if(err?.name==='CastError')return fail(res,400,'Invalid identifier.');res.status(500).json({error:err.message||'Unexpected server error.'});});
export default app;
