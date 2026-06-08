import mongoose from 'mongoose';

const connectDB = async () => {
  console.log('[DB] Connecting to MongoDB...');
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in .env');
  }

  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'chatapp',
  });

  console.log('[DB] MongoDB connected:', conn.connection.host, 'db:', conn.connection.name);
};

export default connectDB;
