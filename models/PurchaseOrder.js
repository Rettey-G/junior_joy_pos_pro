const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PurchaseOrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const PurchaseOrderSchema = new Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  items: [PurchaseOrderItemSchema],
  status: {
    type: String,
    enum: ['draft', 'ordered', 'partially_received', 'received', 'cancelled'],
    default: 'draft'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  receivedDate: {
    type: Date
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
PurchaseOrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate PO number automatically if not provided
PurchaseOrderSchema.pre('save', function(next) {
  if (!this.isNew) {
    return next();
  }
  
  if (!this.poNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    
    this.poNumber = `PO-${year}${month}${day}-${random}`;
  }
  
  next();
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
