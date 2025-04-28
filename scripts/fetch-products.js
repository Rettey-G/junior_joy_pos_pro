const { MongoClient } = require('mongodb');
const config = require('../config');

async function fetchProducts() {
  const client = new MongoClient(config.MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB successfully');

    const db = client.db('pos-database');
    const products = await db.collection('products').find({}).toArray();
    
    console.log('\n=== PRODUCTS ===');
    console.log(`Total products: ${products.length}`);
    products.forEach(product => {
      console.log(`\nProduct: ${product.description}`);
      console.log(`Code: ${product.code}`);
      console.log(`Price: ${product.price}`);
      console.log(`Category: ${product.category}`);
      console.log(`Stock: ${product.stock}`);
      console.log(`SOH: ${product.SOH}`);
      console.log('------------------------');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fetchProducts(); 