const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const Supplier = require('../models/Supplier');

// @route   GET api/purchase-orders
// @desc    Get all purchase orders with pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Filter by status if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Filter by supplier if provided
    if (req.query.supplier) {
      filter.supplier = req.query.supplier;
    }
    
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      filter.orderDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await PurchaseOrder.countDocuments(filter);
    
    res.json({
      purchaseOrders,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/purchase-orders/:id
// @desc    Get purchase order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'name contactPerson email phone')
      .populate('createdBy', 'name')
      .populate('items.product', 'name code');
    
    if (!purchaseOrder) {
      return res.status(404).json({ msg: 'Purchase order not found' });
    }
    
    res.json(purchaseOrder);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Purchase order not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/purchase-orders
// @desc    Create a purchase order
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      poNumber,
      supplier,
      items,
      status,
      orderDate,
      expectedDeliveryDate,
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      notes
    } = req.body;
    
    if (!supplier || !items || items.length === 0) {
      return res.status(400).json({ msg: 'Supplier and at least one item are required' });
    }
    
    // Validate supplier exists
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(400).json({ msg: 'Invalid supplier' });
    }
    
    // Validate all products exist
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ msg: `Product with ID ${item.product} not found` });
      }
    }
    
    // Create new purchase order
    const newPurchaseOrder = new PurchaseOrder({
      poNumber,
      supplier,
      items,
      status: status || 'draft',
      orderDate: orderDate || Date.now(),
      expectedDeliveryDate,
      subtotal,
      tax: tax || 0,
      shippingCost: shippingCost || 0,
      discount: discount || 0,
      total,
      notes,
      createdBy: req.user.id
    });
    
    const purchaseOrder = await newPurchaseOrder.save();
    
    res.json(purchaseOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/purchase-orders/:id
// @desc    Update a purchase order
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      poNumber,
      supplier,
      items,
      status,
      orderDate,
      expectedDeliveryDate,
      subtotal,
      tax,
      shippingCost,
      discount,
      total,
      notes
    } = req.body;
    
    // Find purchase order by ID
    let purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ msg: 'Purchase order not found' });
    }
    
    // Only allow updates if PO is in draft or ordered status
    if (purchaseOrder.status !== 'draft' && purchaseOrder.status !== 'ordered') {
      return res.status(400).json({ 
        msg: 'Cannot update purchase order that has been received or cancelled' 
      });
    }
    
    // Update purchase order fields
    if (poNumber) purchaseOrder.poNumber = poNumber;
    if (supplier) purchaseOrder.supplier = supplier;
    if (items) purchaseOrder.items = items;
    if (status) purchaseOrder.status = status;
    if (orderDate) purchaseOrder.orderDate = orderDate;
    if (expectedDeliveryDate) purchaseOrder.expectedDeliveryDate = expectedDeliveryDate;
    if (subtotal !== undefined) purchaseOrder.subtotal = subtotal;
    if (tax !== undefined) purchaseOrder.tax = tax;
    if (shippingCost !== undefined) purchaseOrder.shippingCost = shippingCost;
    if (discount !== undefined) purchaseOrder.discount = discount;
    if (total !== undefined) purchaseOrder.total = total;
    if (notes) purchaseOrder.notes = notes;
    
    await purchaseOrder.save();
    
    res.json(purchaseOrder);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Purchase order not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/purchase-orders/:id
// @desc    Delete a purchase order
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ msg: 'Purchase order not found' });
    }
    
    // Only allow deletion if PO is in draft status
    if (purchaseOrder.status !== 'draft') {
      return res.status(400).json({ 
        msg: 'Cannot delete purchase order that has been ordered, received or cancelled' 
      });
    }
    
    await purchaseOrder.remove();
    
    res.json({ msg: 'Purchase order removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Purchase order not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/purchase-orders/:id/receive
// @desc    Receive items from a purchase order
// @access  Private
router.put('/:id/receive', auth, async (req, res) => {
  try {
    const { receivedItems, notes } = req.body;
    
    if (!receivedItems || !Array.isArray(receivedItems) || receivedItems.length === 0) {
      return res.status(400).json({ msg: 'Received items are required' });
    }
    
    // Find purchase order by ID
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ msg: 'Purchase order not found' });
    }
    
    // Only allow receiving if PO is in ordered or partially_received status
    if (purchaseOrder.status !== 'ordered' && purchaseOrder.status !== 'partially_received') {
      return res.status(400).json({ 
        msg: 'Cannot receive items for a purchase order that is not in ordered or partially received status' 
      });
    }
    
    // Process each received item
    const transactions = [];
    let allItemsReceived = true;
    
    for (const receivedItem of receivedItems) {
      const { productId, quantity } = receivedItem;
      
      // Find the item in the purchase order
      const poItem = purchaseOrder.items.find(item => 
        item.product.toString() === productId
      );
      
      if (!poItem) {
        return res.status(400).json({ 
          msg: `Product with ID ${productId} is not in this purchase order` 
        });
      }
      
      // Update received quantity
      const newReceivedQty = poItem.receivedQuantity + quantity;
      
      if (newReceivedQty > poItem.quantity) {
        return res.status(400).json({ 
          msg: `Cannot receive more than ordered quantity for product ${productId}` 
        });
      }
      
      poItem.receivedQuantity = newReceivedQty;
      
      // Check if all items are fully received
      if (poItem.receivedQuantity < poItem.quantity) {
        allItemsReceived = false;
      }
      
      // Update product inventory
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({ msg: `Product with ID ${productId} not found` });
      }
      
      const previousQuantity = product.SOH;
      const newQuantity = previousQuantity + quantity;
      
      product.SOH = newQuantity;
      
      // If cost price is different, update it
      if (poItem.costPrice !== product.costPrice) {
        product.costPrice = poItem.costPrice;
      }
      
      await product.save();
      
      // Create inventory transaction
      const transaction = new InventoryTransaction({
        product: productId,
        type: 'purchase',
        quantity,
        previousQuantity,
        newQuantity,
        reference: `PO-${purchaseOrder.poNumber}`,
        referenceId: purchaseOrder._id,
        notes,
        costPrice: poItem.costPrice,
        createdBy: req.user.id
      });
      
      await transaction.save();
      transactions.push(transaction);
    }
    
    // Update purchase order status
    if (allItemsReceived) {
      purchaseOrder.status = 'received';
      purchaseOrder.receivedDate = Date.now();
    } else {
      purchaseOrder.status = 'partially_received';
    }
    
    await purchaseOrder.save();
    
    res.json({
      purchaseOrder,
      transactions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/purchase-orders/:id/cancel
// @desc    Cancel a purchase order
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Find purchase order by ID
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ msg: 'Purchase order not found' });
    }
    
    // Only allow cancellation if PO is in draft or ordered status
    if (purchaseOrder.status !== 'draft' && purchaseOrder.status !== 'ordered') {
      return res.status(400).json({ 
        msg: 'Cannot cancel purchase order that has been received' 
      });
    }
    
    // Update purchase order status
    purchaseOrder.status = 'cancelled';
    if (reason) {
      purchaseOrder.notes = purchaseOrder.notes 
        ? `${purchaseOrder.notes}\n\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;
    }
    
    await purchaseOrder.save();
    
    res.json(purchaseOrder);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Purchase order not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
