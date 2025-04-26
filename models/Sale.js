const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      name: String,
      price: Number,
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],
  subtotal: {
    type: Number,
    required: true
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
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Bank Transfer'],
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
  cashier: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  customer: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Refunded', 'Voided'],
    default: 'Completed'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', SaleSchema);
