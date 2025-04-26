const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  pictureUrl: {
    type: String,
    default: ''
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  dateOfBirth: {
    type: Date
  },
  salaryMVR: {
    type: Number,
    required: true,
    default: 0
  },
  salaryUSD: {
    type: Number,
    default: function() {
      // Default conversion rate from MVR to USD (1 MVR ≈ 0.065 USD)
      return this.salaryMVR ? Math.round(this.salaryMVR * 0.065 * 100) / 100 : 0;
    }
  },
  position: {
    type: String,
    enum: ['Manager', 'Supervisor', 'Cashier', 'Staff', 'Admin'],
    default: 'Staff'
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Employee', EmployeeSchema);
