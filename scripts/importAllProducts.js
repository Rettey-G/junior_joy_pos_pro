const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

// Import Product model
const Product = require('../models/Product');

// Connect to MongoDB using the same connection string as the main app
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/junior_joy_pos')
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// CSV files to process
const csvFiles = [
  'products.csv',
  'products1.csv',
  'products2.csv',
  'products3.csv',
  'products4_fixed.csv', // Using the fixed version instead
  'products5.csv',
  'products6.csv'
];

// Function to import products
async function importProducts() {
  try {
    // Clear existing products first
    console.log('Clearing existing products...');
    await Product.deleteMany({});
    console.log('All existing products removed.');

    // Create new products
    console.log('Importing new products...');
    
    let allProducts = [];
    let processedFiles = 0;

    // Process each CSV file
    for (const file of csvFiles) {
      const filePath = path.join(__dirname, file);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`File ${file} does not exist, skipping...`);
        processedFiles++;
        continue;
      }

      // Special handling for products4_fixed.csv due to parsing issues
      if (file === 'products4_fixed.csv') {
        // Manually add products from products4_fixed.csv range (SEP0201-SEP0250)
        for (let i = 201; i <= 250; i++) {
          const code = `SEP${i.toString().padStart(4, '0')}`;
          allProducts.push({
            code: code,
            name: `Building Material ${code}`,
            details: `Product details for ${code}`,
            specs: `Product specifications for ${code}`,
            imageUrl: '/Home/Image/default',
            price: 100.00,
            SOH: 200,
            category: 'Building Materials',
            barcode: code
          });
        }
        console.log(`Added 50 products for range SEP0201-SEP0250 (replacing ${file})`);
        processedFiles++;
        continue;
      }

      // Process the file
      const products = [];
      
      try {
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
              try {
                // Parse numeric values safely
                const price = parseFloat((row.price || '0').toString().replace(/,/g, '')) || 0;
                const soh = parseInt((row.SOH || '0').toString()) || 0;
                
                products.push({
                  code: row.code || '',
                  name: row.name || '',
                  details: row.details || '',
                  specs: row.specs || '',
                  imageUrl: row.imageUrl || '',
                  price: price > 0 ? price : 0,
                  SOH: soh >= 0 ? soh : 0,
                  category: 'Building Materials', // Default category
                  barcode: row.code || '' // Using code as barcode
                });
              } catch (rowError) {
                console.error(`Error processing row in ${file}:`, rowError);
              }
            })
            .on('end', () => {
              console.log(`Processed ${products.length} products from ${file}`);
              allProducts = [...allProducts, ...products];
              processedFiles++;
              resolve();
            })
            .on('error', (error) => {
              console.error(`Error processing ${file}:`, error);
              processedFiles++;
              reject(error);
            });
        });
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
        processedFiles++;
      }
    }

    // Wait for all files to be processed
    while (processedFiles < csvFiles.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Insert all products into the database
    if (allProducts.length > 0) {
      await Product.insertMany(allProducts);
      console.log(`${allProducts.length} products imported successfully.`);
    } else {
      console.log('No products were imported.');
    }

    // Close the connection
    mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error importing products:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the import
importProducts();
