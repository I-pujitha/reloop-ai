import { RecyclingCentre, Reward } from './models.js';
export async function seedDemoData() {
  if (!(await Reward.exists({}))) await Reward.insertMany([
    {name:'Green Starter Coupon',description:'Illustrative 10% coupon concept. Not redeemable with a real retailer.',cost:50,partner:'ReLoop Demo',simulated:true},
    {name:'Eco Champion Badge',description:'A simulated in-app achievement.',cost:100,partner:'ReLoop',simulated:true},
    {name:'Community Impact Voucher',description:'Sample reward for prototype demonstration only.',cost:150,partner:'ReLoop Demo',simulated:true}
  ]);
  if (!(await RecyclingCentre.exists({}))) await RecyclingCentre.insertMany([
    {name:'Sample Collection Point A',address:'Demonstration address — verify locally before visiting',city:'Kakinada',pincode:'533001',acceptedMaterials:['PET bottles','HDPE containers'],phone:'Not provided',source:'Prototype sample data — not independently verified',isSample:true},
    {name:'Sample Collection Point B',address:'Demonstration address — verify locally before visiting',city:'Yanam',pincode:'533464',acceptedMaterials:['Clean rigid plastic'],phone:'Not provided',source:'Prototype sample data — not independently verified',isSample:true}
  ]);
}
