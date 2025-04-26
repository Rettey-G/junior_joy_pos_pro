const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Supplier = require('../models/Supplier');

// @route   GET api/suppliers
// @desc    Get all suppliers with pagination
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
    
    // Filter by search term if provided
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { contactPerson: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    const suppliers = await Supplier.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Supplier.countDocuments(filter);
    
    res.json({
      suppliers,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/suppliers/:id
// @desc    Get supplier by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ msg: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Supplier not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/suppliers
// @desc    Create a supplier
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      taxId,
      paymentTerms,
      notes,
      status
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ msg: 'Supplier name is required' });
    }
    
    // Create new supplier
    const newSupplier = new Supplier({
      name,
      contactPerson,
      email,
      phone,
      address,
      taxId,
      paymentTerms,
      notes,
      status: status || 'active'
    });
    
    const supplier = await newSupplier.save();
    
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/suppliers/:id
// @desc    Update a supplier
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      taxId,
      paymentTerms,
      notes,
      status
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ msg: 'Supplier name is required' });
    }
    
    // Find supplier by ID
    let supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ msg: 'Supplier not found' });
    }
    
    // Update supplier fields
    supplier.name = name;
    supplier.contactPerson = contactPerson;
    supplier.email = email;
    supplier.phone = phone;
    supplier.address = address;
    supplier.taxId = taxId;
    supplier.paymentTerms = paymentTerms;
    supplier.notes = notes;
    if (status) supplier.status = status;
    
    await supplier.save();
    
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Supplier not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/suppliers/:id
// @desc    Delete a supplier
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ msg: 'Supplier not found' });
    }
    
    await supplier.remove();
    
    res.json({ msg: 'Supplier removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Supplier not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
