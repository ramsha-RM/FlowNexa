import mongoose from "mongoose";

let isConnected = false;
let connectionPromise = null;

mongoose.connection.on("connected", () => {
  isConnected = true;
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  connectionPromise = null;
});

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    const conn = await connectionPromise;
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    isConnected = false;
    connectionPromise = null;
    return null;
  }
};

export const getDBStatus = () => ({
  connected: isConnected,
  host: mongoose.connection.host || null,
});

export default connectDB;
