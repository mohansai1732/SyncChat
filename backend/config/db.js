import mongoose from 'mongoose';

const connectDB = async () => {
  console.log('[DB] Connecting to MongoDB...');
  if (!process.env.MONGODB_URI) {
    console.error('[DB] ERROR: MONGODB_URI is not set in .env');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'chatapp',
    });
    console.log('[DB] MongoDB connected:', conn.connection.host, 'db:', conn.connection.name);
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
