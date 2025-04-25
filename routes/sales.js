const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// Create a new sale
router.post('/', auth, async (req, res) => {
  try {
    const { products, paymentMethod, customer, notes } = req.body;
    
    // Calculate total and update product quantities
    let total = 0;
    const saleProducts = [];
    
    // Process each product in the sale
    for (const item of products) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.product} not found` });
      }
      
      // Check if enough stock
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Not enough stock for ${product.name}. Available: ${product.stock}` 
        });
      }
      
      // Calculate subtotal
      const subtotal = product.price * item.quantity;
      total += subtotal;
      
      // Add to sale products array
      saleProducts.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal
      });
      
      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }
    
    // Create the sale
    const sale = new Sale({
      products: saleProducts,
      total,
      paymentMethod: paymentMethod || 'cash',
      cashier: req.user.id,
      customer,
      notes
    });
    
    await sale.save();
    
    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all sales (with pagination)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const sales = await Sale.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('cashier', 'name username');
    
    const total = await Sale.countDocuments();
    
    res.json({
      sales,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single sale
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier', 'name username')
      .populate('products.product');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update sale status (refund or void)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['completed', 'refunded', 'voided'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    // If refunding or voiding, restore product quantities
    if ((status === 'refunded' || status === 'voided') && sale.status === 'completed') {
      for (const item of sale.products) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }
    
    sale.status = status;
    await sale.save();
    
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sales reports (daily, weekly, monthly)
router.get('/reports/:period', auth, async (req, res) => {
  try {
    const { period } = req.params;
    const { startDate, endDate } = req.query;
    
    let start, end;
    const now = new Date();
    
    // Set date range based on period
    if (period === 'daily') {
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
    } else if (period === 'weekly') {
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      return res.status(400).json({ message: 'Invalid period or missing dates for custom period' });
    }
    
    // Get sales within date range
    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    });
    
    // Calculate totals
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Get product sales breakdown
    const productMap = {};
    sales.forEach(sale => {
      sale.products.forEach(item => {
        if (productMap[item.name]) {
          productMap[item.name].quantity += item.quantity;
          productMap[item.name].revenue += item.subtotal;
        } else {
          productMap[item.name] = {
            quantity: item.quantity,
            revenue: item.subtotal
          };
        }
      });
    });
    
    const productSales = Object.keys(productMap).map(name => ({
      name,
      quantity: productMap[name].quantity,
      revenue: productMap[name].revenue
    })).sort((a, b) => b.revenue - a.revenue);
    
    res.json({
      period,
      dateRange: { start, end },
      summary: {
        totalSales,
        totalRevenue,
        averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0
      },
      productSales,
      sales: sales // Include the actual sales data for the frontend
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
