// Script to update all products to have SOH = 100
const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB URI from command line or environment variable
const mongoURI = process.argv[2];

if (!mongoURI) {
  console.error('MongoDB URI is required. Please provide it as a command line argument');
  console.log('Usage: node update-soh.js "mongodb+srv://username:password@cluster.mongodb.net/database"');
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
  code: String,
  name: String,
  details: String,
  specs: String,
  imageUrl: String,
  price: Number,
  SOH: Number,
  category: String,
  barcode: String,
  createdAt: Date
});

const Product = mongoose.model('Product', ProductSchema);

// Function to update all products to have SOH = 100
const updateSOH = async () => {
  try {
    // Update all products to have SOH = 100
    const updateResult = await Product.updateMany({}, { SOH: 100 });
    console.log(`Updated SOH to 100 for ${updateResult.modifiedCount} products`);
    
    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error('Error updating products:', error);
    mongoose.disconnect();
  }
};

// Run the update
updateSOH();
