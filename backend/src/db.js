import mongoose from 'mongoose';
import { seedDemoData } from './seed.js';
export async function connectDb() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/reloop_ai');
  if (process.env.SEED_DEMO_DATA === 'true') await seedDemoData();
}
