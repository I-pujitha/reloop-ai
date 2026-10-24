import 'dotenv/config';
import { connectDb } from './db.js';
import app from './app.js';

const port = Number(process.env.PORT || 4000);
try {
  await connectDb();
  app.listen(port, () => console.log(`ReLoop API listening on http://localhost:${port}`));
} catch (error) {
  console.error('Database connection failed. Check MONGODB_URI and ensure MongoDB is running.', error.message);
  process.exit(1);
}
