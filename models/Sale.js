const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
      // Not strictly required here as name/price/quantity are stored
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  gst: {
    type: Number,
    default: 0
  },
  serviceCharge: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    default: 0
  },
  paymentMethod: {
    type: String,
    default: 'Cash'
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  change: {
    type: Number,
    default: 0
  },
  customer: {
    // Can be a string name or ObjectId ref
    type: mongoose.Schema.Types.Mixed,
    default: 'Walk-in Customer'
  },
  cashier: {
    // Store cashier name or ID
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Refunded', 'Voided'],
    default: 'Completed'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', SaleSchema);
