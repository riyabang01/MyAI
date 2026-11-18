import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI;
    if (!MONGO_URI) {
      console.error('MONGODB_URI is missing in environment variables');
      return;
    }
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
