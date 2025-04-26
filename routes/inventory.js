const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');

// @route   GET api/inventory/transactions
// @desc    Get all inventory transactions with pagination
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Filter by product if provided
    if (req.query.product) {
      filter.product = req.query.product;
    }
    
    // Filter by transaction type if provided
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const transactions = await InventoryTransaction.find(filter)
      .populate('product', 'name code')
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await InventoryTransaction.countDocuments(filter);
    
    res.json({
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/inventory/transactions/:id
// @desc    Get inventory transaction by ID
// @access  Private
router.get('/transactions/:id', auth, async (req, res) => {
  try {
    const transaction = await InventoryTransaction.findById(req.params.id)
      .populate('product', 'name code price costPrice')
      .populate('createdBy', 'name');
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/inventory/adjust
// @desc    Adjust inventory quantity
// @access  Private
router.post('/adjust', auth, async (req, res) => {
  try {
    const { productId, quantity, notes } = req.body;
    
    if (!productId || quantity === undefined) {
      return res.status(400).json({ msg: 'Product ID and quantity are required' });
    }
    
    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    
    const previousQuantity = product.SOH;
    const newQuantity = previousQuantity + quantity;
    
    if (newQuantity < 0) {
      return res.status(400).json({ msg: 'Adjustment would result in negative inventory' });
    }
    
    // Update product quantity
    product.SOH = newQuantity;
    await product.save();
    
    // Create inventory transaction record
    const transaction = new InventoryTransaction({
      product: productId,
      type: quantity >= 0 ? 'adjustment' : 'adjustment',
      quantity,
      previousQuantity,
      newQuantity,
      notes,
      createdBy: req.user.id
    });
    
    await transaction.save();
    
    res.json({
      transaction,
      product
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/inventory/low-stock
// @desc    Get products with low stock
// @access  Private
router.get('/low-stock', auth, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    
    const products = await Product.find({
      SOH: { $lte: threshold, $gt: 0 }
    }).sort({ SOH: 1 });
    
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/inventory/out-of-stock
// @desc    Get products that are out of stock
// @access  Private
router.get('/out-of-stock', auth, async (req, res) => {
  try {
    const products = await Product.find({ SOH: 0 });
    
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/inventory/value
// @desc    Get total inventory value
// @access  Private
router.get('/value', auth, async (req, res) => {
  try {
    const products = await Product.find();
    
    let totalValue = 0;
    let totalCost = 0;
    let potentialProfit = 0;
    
    products.forEach(product => {
      const stockValue = product.SOH * product.price;
      const costValue = product.SOH * (product.costPrice || 0);
      
      totalValue += stockValue;
      totalCost += costValue;
    });
    
    potentialProfit = totalValue - totalCost;
    
    res.json({
      totalValue,
      totalCost,
      potentialProfit,
      productCount: products.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
