// Script to import additional products from the image
const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB URI from command line or environment variable
const mongoURI = process.argv[2];

if (!mongoURI) {
  console.error('MongoDB URI is required. Please provide it as a command line argument');
  console.log('Usage: node import-additional-products.js "mongodb+srv://username:password@cluster.mongodb.net/database"');
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

// Additional products data from the image
const additionalProducts = [
  {
    code: "SEP0100",
    name: "VG GUTTER R2 PIPE CONNECTOR PVC",
    details: "VG GUTTER R2 ELBOW 90DEG PVC",
    specs: "VG GUTTER R2 PIPE CONNECTOR PVC",
    imageUrl: "/Home/Image/17401",
    price: 37.80,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0101",
    name: "VG GUTTER R2 PIPE CONNECTOR PVC",
    details: "VG GUTTER EZY ELBOW 90DEG PVC",
    specs: "VG GUTTER R2 PIPE CONNECTOR PVC",
    imageUrl: "/Home/Image/17401",
    price: 37.80,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0102",
    name: "VG GUTTER EZY PIPE CONNECTOR PVC",
    details: "VG GUTTER R2 RAIN GUTTER",
    specs: "VG GUTTER EZY PIPE CONNECTOR PVC",
    imageUrl: "/Home/Image/17403",
    price: 43.20,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0103",
    name: "VG GUTTER EZY ROUND PIPE PVC",
    details: "VG GUTTER R2 INVISIBLE HANGER BRACKET PVC",
    specs: "VG GUTTER EZY ROUND PIPE PVC",
    imageUrl: "/Home/Image/17405",
    price: 275.4,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0104",
    name: "VG GUTTER EZY ROUND PIPE PVC",
    details: "VG GUTTER R2 RAIN GUTTER",
    specs: "VG GUTTER EZY ROUND PIPE PVC",
    imageUrl: "/Home/Image/17405",
    price: 275.4,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0105",
    name: "VG GUTTER R2 ROUND PIPE PVC",
    details: "VG GUTTER R2 INVISIBLE HANGER BRACKET PVC",
    specs: "VG GUTTER R2 ROUND PIPE PVC",
    imageUrl: "/Home/Image/17407",
    price: 259.2,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0106",
    name: "VG GUTTER R2 ROUND PIPE PVC",
    details: "VG GUTTER R2 RAIN GUTTER",
    specs: "VG GUTTER R2 ROUND PIPE PVC",
    imageUrl: "/Home/Image/17407",
    price: 259.2,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0107",
    name: "VG GUTTER R2 ROUND PIPE PVC",
    details: "VG GUTTER EZY ELBOW 90DEG PVC",
    specs: "VG GUTTER R2 ROUND PIPE PVC",
    imageUrl: "/Home/Image/17407",
    price: 259.2,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0108",
    name: "VG GUTTER R2 ROUND PIPE PVC",
    details: "VG GUTTER R2 RAIN GUTTER",
    specs: "VG GUTTER R2 ROUND PIPE PVC",
    imageUrl: "/Home/Image/17407",
    price: 259.2,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0109",
    name: "VG GUTTER EZY INSIDE CORNER 135DEG PVC",
    details: "VG GUTTER EZY CONNECTOR PVC",
    specs: "VG GUTTER EZY INSIDE CORNER 135DEG PVC",
    imageUrl: "/Home/Image/17409",
    price: 172.8,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0110",
    name: "VG GUTTER EZY INSIDE CORNER 135DEG PVC",
    details: "VG GUTTER EZY DOWNSPOUT OUTLET PVC",
    specs: "VG GUTTER EZY INSIDE CORNER 135DEG PVC",
    imageUrl: "/Home/Image/17409",
    price: 172.8,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0111",
    name: "VG GUTTER EZY INSIDE CORNER 135DEG PVC",
    details: "VG GUTTER EZY CONNECTOR PVC",
    specs: "VG GUTTER EZY INSIDE CORNER 135DEG PVC",
    imageUrl: "/Home/Image/17409",
    price: 172.8,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0112",
    name: "VG GUTTER EZY INSIDE CORNER 135DEG PVC",
    details: "VG GUTTER EZY ALUMINIUM MESH",
    specs: "VG GUTTER EZY INSIDE CORNER 135DEG PVC",
    imageUrl: "/Home/Image/17409",
    price: 172.8,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0113",
    name: "VG GUTTER EZY OUTSIDE CORNER 135DEG PVC",
    details: "VG GUTTER EZY STANDARD BRACKET PVC",
    specs: "VG GUTTER EZY OUTSIDE CORNER 135DEG PVC",
    imageUrl: "/Home/Image/17403",
    price: 172.8,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0114",
    name: "VG GUTTER EZY OUTSIDE CORNER 135DEG PVC",
    details: "VG GUTTER EZY ALUMINIUM MESH",
    specs: "VG GUTTER EZY OUTSIDE CORNER 135DEG PVC",
    imageUrl: "/Home/Image/17403",
    price: 172.8,
    SOH: 100,
    category: "Gutters"
  },
  {
    code: "SEP0115",
    name: "VG GUTTER EZY OUTSIDE CORNER 135DEG PVC",
    details: "VG GUTTER EZY STANDARD BRACKET PVC",
    specs: "VG GUTTER EZY OUTSIDE CORNER 135DEG PVC",
    imageUrl: "/Home/Image/17403",
    price: 172.8,
    SOH: 100,
    category: "Gutters"
  }
];

// Function to import additional products
const importAdditionalProducts = async () => {
  try {
    // Insert products
    const result = await Product.insertMany(additionalProducts);
    console.log(`${result.length} additional products imported successfully`);
    
    // Update all existing products to have SOH = 100
    const updateResult = await Product.updateMany({}, { SOH: 100 });
    console.log(`Updated SOH to 100 for ${updateResult.modifiedCount} existing products`);
    
    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error('Error importing additional products:', error);
    mongoose.disconnect();
  }
};

// Run the import
importAdditionalProducts();
