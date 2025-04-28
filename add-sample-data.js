const mongoose = require('mongoose');

// Connection string with proper credentials
const mongoURI = 'mongodb+srv://Rettey:Adhu1447@cluster0.hriuovn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Define schemas based on your models
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  costPrice: Number,
  category: String,
  SOH: Number, // Stock on Hand
  code: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const SaleSchema = new mongoose.Schema({
  billNumber: String,
  products: Array,
  subtotal: Number,
  gst: Number,
  serviceCharge: Number,
  discount: Number,
  total: Number,
  customer: mongoose.Schema.Types.Mixed,
  cashier: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

// Sample products data
const productsData = [
  {
    name: 'PVC PIPE 110MM CLASS D',
    price: 45.99,
    costPrice: 32.50,
    category: 'PVC',
    SOH: 100,
    code: 'PVC-001',
    description: 'High-quality PVC pipe for plumbing and drainage systems'
  },
  {
    name: 'PVC ELBOW 90DEG 110MM',
    price: 12.75,
    costPrice: 8.50,
    category: 'PVC',
    SOH: 80,
    code: 'PVC-002',
    description: '90-degree elbow joint for PVC pipes'
  },
  {
    name: 'PVC TEE JOINT 110MM',
    price: 15.50,
    costPrice: 10.25,
    category: 'PVC',
    SOH: 65,
    code: 'PVC-003',
    description: 'T-junction connector for PVC pipes'
  },
  {
    name: 'CEMENT PORTLAND 50KG',
    price: 22.99,
    costPrice: 17.50,
    category: 'Building Materials',
    SOH: 45,
    code: 'BM-001',
    description: 'General purpose Portland cement bag'
  },
  {
    name: 'PAINT INTERIOR MATTE WHITE 4L',
    price: 35.75,
    costPrice: 24.99,
    category: 'Paint',
    SOH: 30,
    code: 'PT-001',
    description: 'Interior matte white paint, water-based'
  }
];

// Sample sales data
const salesData = [
  {
    billNumber: 'INV-001',
    products: [
      {
        name: 'PVC PIPE 110MM CLASS D',
        quantity: 2,
        price: 45.99
      },
      {
        name: 'PVC ELBOW 90DEG 110MM',
        quantity: 4, 
        price: 12.75
      }
    ],
    subtotal: 142.98,
    gst: 22.88,
    serviceCharge: 14.30,
    discount: 0,
    total: 180.16,
    customer: { name: 'John Construction Ltd' },
    cashier: 'Admin User',
    status: 'Completed',
    createdAt: new Date('2025-04-25')
  },
  {
    billNumber: 'INV-002',
    products: [
      {
        name: 'CEMENT PORTLAND 50KG',
        quantity: 3,
        price: 22.99
      },
      {
        name: 'PAINT INTERIOR MATTE WHITE 4L',
        quantity: 1,
        price: 35.75
      }
    ],
    subtotal: 104.72,
    gst: 16.76,
    serviceCharge: 10.47,
    discount: 5.00,
    total: 126.95,
    customer: { name: 'Home Renovations Co.' },
    cashier: 'Admin User',
    status: 'Completed',
    createdAt: new Date('2025-04-26')
  }
];

const addSampleData = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully!');
    
    // Create models
    const Product = mongoose.model('Product', ProductSchema, 'products');
    const Sale = mongoose.model('Sale', SaleSchema, 'sales');
    
    // Add products
    console.log('\nAdding sample products...');
    const productResult = await Product.insertMany(productsData);
    console.log(`${productResult.length} products added successfully!`);
    
    // Add sales
    console.log('\nAdding sample sales...');
    const salesResult = await Sale.insertMany(salesData);
    console.log(`${salesResult.length} sales added successfully!`);
    
    console.log('\nSample data added successfully!');
  } catch (err) {
    console.error('Error adding sample data:', err.message);
  } finally {
    // Close the connection when done
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the function
addSampleData(); 