const mongoose = require('mongoose');
require('dotenv').config();
const config = require('./config');

const connectDB = async () => {
  try {
    // Use MongoDB URI from config.js
    const mongoURI = config.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('MongoDB URI is not defined in config.js');
      process.exit(1);
    }
    
    console.log('Connecting to MongoDB database...');
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
