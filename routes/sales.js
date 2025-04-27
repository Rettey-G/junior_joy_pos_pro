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
            if (product.SOH < item.quantity) {
              return res.status(400).json({ 
                message: `Not enough stock for ${product.name}. Available: ${product.SOH}` 
              });
            }
            
            // Update product stock
            product.SOH -= item.quantity;
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

// Update a sale
router.patch('/:id', auth, async (req, res) => {
  try {
    const saleId = req.params.id;
    const updateData = req.body;
    
    // Find the sale first to check if it exists
    const sale = await Sale.findById(saleId);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    // Update the sale with the new data
    const updatedSale = await Sale.findByIdAndUpdate(
      saleId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.json(updatedSale);
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a sale
router.delete('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    await Sale.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update sale status (refund or void)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Completed', 'Refunded', 'Voided'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    // If refunding or voiding, restore product quantities
    if ((status === 'Refunded' || status === 'Voided') && sale.status === 'Completed') {
      for (const item of sale.products) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            product.SOH += item.quantity;
            await product.save();
          }
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
    if (period === 'day' || period === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (period === 'week' || period === 'weekly') {
      // Get the first day of the week (Sunday)
      const day = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'month' || period === 'monthly') {
      // Get the first day of the month
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      // Get the last day of the month
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'year' || period === 'yearly') {
      // Get the first day of the year
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      // Get the last day of the year
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (period === 'custom') {
      // Use custom date range if provided
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required for custom period' });
      }
      
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      return res.status(400).json({ message: 'Invalid period' });
    }
    
    // Find sales within the date range
    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
      status: 'Completed' // Only include completed sales
    }).populate('cashier', 'name');
    
    // Calculate summary data
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Calculate product sales
    const productSales = [];
    const productMap = new Map();
    
    for (const sale of sales) {
      for (const item of sale.products) {
        const key = item.name;
        if (!productMap.has(key)) {
          productMap.set(key, {
            name: item.name,
            quantity: 0,
            revenue: 0
          });
        }
        
        const product = productMap.get(key);
        product.quantity += item.quantity;
        product.revenue += item.price * item.quantity;
      }
    }
    
    productMap.forEach(product => {
      productSales.push(product);
    });
    
    // Sort product sales by revenue (descending)
    productSales.sort((a, b) => b.revenue - a.revenue);
    
    // Calculate sales by date
    const salesByDate = new Map();
    const dateFormat = period === 'day' || period === 'daily' ? 'hour' : 
                    period === 'week' || period === 'weekly' ? 'day' : 
                    period === 'month' || period === 'monthly' ? 'day' : 'month';
    
    for (const sale of sales) {
      let key;
      const date = new Date(sale.createdAt);
      
      if (dateFormat === 'hour') {
        key = `${date.getHours()}:00`;
      } else if (dateFormat === 'day') {
        key = date.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      }
      
      if (!salesByDate.has(key)) {
        salesByDate.set(key, 0);
      }
      
      salesByDate.set(key, salesByDate.get(key) + sale.total);
    }
    
    const salesByDateArray = [];
    salesByDate.forEach((value, key) => {
      salesByDateArray.push({ date: key, sales: value });
    });
    
    // Calculate sales by cashier
    const salesByCashier = new Map();
    
    for (const sale of sales) {
      const cashierName = sale.cashier ? 
        (typeof sale.cashier === 'object' ? sale.cashier.name : sale.cashier) : 
        'Unknown';
      
      if (!salesByCashier.has(cashierName)) {
        salesByCashier.set(cashierName, 0);
      }
      
      salesByCashier.set(cashierName, salesByCashier.get(cashierName) + sale.total);
    }
    
    const salesByCashierArray = [];
    salesByCashier.forEach((value, key) => {
      salesByCashierArray.push({ name: key, sales: value });
    });
    
    // Sort by sales amount (descending)
    salesByCashierArray.sort((a, b) => b.sales - a.sales);
    
    // Prepare response data
    const reportData = {
      summary: {
        totalSales,
        totalRevenue,
        averageOrderValue
      },
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      sales: salesByDateArray,
      productSales: productSales.slice(0, 10), // Top 10 products
      salesByCashier: salesByCashierArray
    };
    
    res.json(reportData);
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
