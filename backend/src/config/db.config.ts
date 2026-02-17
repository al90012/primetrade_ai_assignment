import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.DATABASE_URL || "mongodb://localhost:27017/task_dashboard",
    );
    // MongoDB Connected
  } catch (error: any) {
    process.exit(1);
  }
};

export default connectDB;
