// Script to update all products to the new structure
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB URI from command line or environment variable
const mongoURI = process.argv[2];

if (!mongoURI) {
  console.error('MongoDB URI is required. Please provide it as a command line argument');
  console.log('Usage: node update-products.js "mongodb+srv://username:password@cluster.mongodb.net/database"');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define Product Schema
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

// Function to update all products
const updateProducts = async () => {
  try {
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to update`);
    
    // Update each product
    let updatedCount = 0;
    
    for (const product of products) {
      // Transform fields
      const updateData = {
        details: product.description || '',
        specs: product.name || '',
        SOH: product.stock || 0
      };
      
      // Remove old fields
      if (product.description !== undefined) {
        product.description = undefined;
      }
      
      if (product.stock !== undefined) {
        product.stock = undefined;
      }
      
      // Update the product
      await Product.updateOne({ _id: product._id }, { $set: updateData, $unset: { description: "", stock: "" } });
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} products`);
    
    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error('Error updating products:', error);
    mongoose.disconnect();
  }
};

// Run the update
updateProducts();
