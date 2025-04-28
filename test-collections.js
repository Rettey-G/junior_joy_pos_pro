const mongoose = require('mongoose');

// Connection string with proper credentials
const mongoURI = 'mongodb+srv://Rettey:Adhu1447@cluster0.hriuovn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Define schemas based on your models
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  costPrice: Number,
  category: String,
  SOH: Number,
  // Other fields can be added as needed
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
  cashier: mongoose.Schema.Types.Mixed,
  status: String,
  // Other fields can be added as needed
});

const testCollections = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully!');
    
    // Create models
    const Product = mongoose.model('Product', ProductSchema, 'products');
    const Sale = mongoose.model('Sale', SaleSchema, 'sales');
    
    // Test products collection
    console.log('\n===== TESTING PRODUCTS COLLECTION =====');
    const productCount = await Product.countDocuments();
    console.log(`Total products in database: ${productCount}`);
    
    if (productCount > 0) {
      const sampleProducts = await Product.find().limit(5);
      console.log('Sample products:');
      sampleProducts.forEach(product => {
        console.log(`- ${product.name} | Price: ${product.price} | Stock: ${product.SOH}`);
      });
    }
    
    // Test sales/bills collection
    console.log('\n===== TESTING SALES COLLECTION =====');
    const salesCount = await Sale.countDocuments();
    console.log(`Total sales/bills in database: ${salesCount}`);
    
    if (salesCount > 0) {
      const sampleSales = await Sale.find().limit(5);
      console.log('Sample sales:');
      sampleSales.forEach(sale => {
        console.log(`- Bill #${sale.billNumber} | Customer: ${typeof sale.customer === 'object' ? sale.customer.name : sale.customer} | Total: ${sale.total}`);
      });
    }
    
    console.log('\nDatabase test completed successfully!');
  } catch (err) {
    console.error('Error during database test:', err.message);
  } finally {
    // Close the connection when done
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the test
testCollections(); 