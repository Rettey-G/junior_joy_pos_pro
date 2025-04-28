const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Import all models
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');

async function fetchDatabaseData() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../database-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Fetch data from each collection
    const collections = {
      users: await User.find({}),
      products: await Product.find({}),
      sales: await Sale.find({}),
      customers: await Customer.find({}),
      employees: await Employee.find({}),
      inventory: await Inventory.find({}),
      suppliers: await Supplier.find({}),
      purchaseOrders: await PurchaseOrder.find({})
    };

    // Save each collection to a separate JSON file
    for (const [collectionName, data] of Object.entries(collections)) {
      const filePath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Saved ${data.length} ${collectionName} to ${filePath}`);
    }

    console.log('Database backup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fetchDatabaseData(); 