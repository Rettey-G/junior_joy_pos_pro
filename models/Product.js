const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    trim: true
  },
  specs: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  SOH: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);
