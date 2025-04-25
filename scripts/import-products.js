const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB URI from command line or environment variable
const mongoURI = process.argv[2] || process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('MongoDB URI is required. Please provide it as a command line argument or set MONGODB_URI in .env file');
  console.log('Usage: node import-products.js "mongodb+srv://username:password@cluster.mongodb.net/database"');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define Product Schema (same as in your models/Product.js)
const ProductSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    trim: true
  },
  specs: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  SOH: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Product = mongoose.model('Product', ProductSchema);

// Load product data from all files
const productsData1 = require('./product-data.js');
const productsData2 = require('./product-data-2.js');
const productsData3 = require('./product-data-3.js');

// Combine all product data
const productsData = [...productsData1, ...productsData2, ...productsData3];

// Function to import products
const importProducts = async () => {
  try {
    // Clear existing products (optional)
    // Uncomment the next line if you want to remove all existing products first
    // await Product.deleteMany({});
    
    // Insert products
    const result = await Product.insertMany(productsData);
    console.log(`${result.length} products imported successfully`);
    
    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error('Error importing products:', error);
    mongoose.disconnect();
  }
};

// Run the import
importProducts();
