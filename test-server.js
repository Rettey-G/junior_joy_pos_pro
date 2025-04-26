// Simple test server to verify deployment
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Add detailed logging
console.log('Starting test server...');
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

// Simple test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Junior Joy POS API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MongoDB connection with detailed logging
const connectDB = async () => {
  console.log('Attempting to connect to MongoDB...');
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set!');
      return;
    }
    
    console.log('Connecting to MongoDB with URI:', 
      process.env.MONGODB_URI.substring(0, 20) + '...[REDACTED]');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  // Try to connect to MongoDB
  connectDB();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
