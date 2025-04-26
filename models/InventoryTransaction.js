const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InventoryTransactionSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['purchase', 'sale', 'adjustment', 'return', 'transfer_in', 'transfer_out'],
    trim: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousQuantity: {
    type: Number,
    required: true
  },
  newQuantity: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  reference: {
    type: String,
    trim: true
  },
  referenceId: {
    type: Schema.Types.ObjectId,
    // This can reference various collections (sales, purchase orders, etc.)
  },
  notes: {
    type: String,
    trim: true
  },
  costPrice: {
    type: Number,
    min: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Add index for faster queries
InventoryTransactionSchema.index({ product: 1, date: -1 });
InventoryTransactionSchema.index({ type: 1 });
InventoryTransactionSchema.index({ date: -1 });

module.exports = mongoose.model('InventoryTransaction', InventoryTransactionSchema);
