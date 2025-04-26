const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// Create a new sale
router.post('/', auth, async (req, res) => {
  try {
    const { 
      billNumber, 
      products, 
      subtotal,
      gst,
      serviceCharge,
      discount,
      total,
      paymentMethod, 
      amountPaid,
      change,
      customer, 
      cashier,
      status,
      notes 
    } = req.body;
    
    // Validate required fields
    if (!billNumber || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Bill number and products are required' });
    }
    
    // Check if bill number already exists
    const existingBill = await Sale.findOne({ billNumber });
    if (existingBill) {
      return res.status(400).json({ message: 'Bill number already exists' });
    }
    
    // Process each product in the sale
    const saleProducts = [];
    
    for (const item of products) {
      // Add to sale products array
      saleProducts.push({
        product: item.product,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      });
      
      // Update product stock if product ID is provided
      if (item.product) {
        try {
          const product = await Product.findById(item.product);
          if (product) {
            // Check if enough stock
            if (product.stock < item.quantity) {
              return res.status(400).json({ 
                message: `Not enough stock for ${product.name}. Available: ${product.stock}` 
              });
            }
            
            // Update product stock
            product.stock -= item.quantity;
            await product.save();
          }
        } catch (err) {
          console.error(`Error updating product ${item.product}: ${err.message}`);
          // Continue with sale even if product update fails
        }
      }
    }
    
    // Create the sale
    const sale = new Sale({
      billNumber,
      products: saleProducts,
      subtotal: Number(subtotal) || 0,
      gst: Number(gst) || 0,
      serviceCharge: Number(serviceCharge) || 0,
      discount: Number(discount) || 0,
      total: Number(total) || 0,
      paymentMethod: paymentMethod || 'Cash',
      amountPaid: Number(amountPaid) || 0,
      change: Number(change) || 0,
      cashier: cashier || req.user.name || req.user.id,
      customer: customer || 'Walk-in Customer',
      status: status || 'Completed',
      notes: notes || ''
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
    if (period === 'day') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (period === 'week') {
      // Get the first day of the week (Sunday)
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      // Get the first day of the month
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      // Get the last day of the month
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'year') {
      // Get the first day of the year
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      // Get the last day of the year
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (period === 'custom' && startDate && endDate) {
      try {
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } catch (err) {
        return res.status(400).json({ message: 'Invalid date format for custom period' });
      }
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
