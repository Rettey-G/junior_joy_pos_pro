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
    required: true
  },
  salaryUSD: {
    type: Number,
    default: function() {
      // Default conversion rate (MVR to USD)
      return this.salaryMVR / 15.42; // Approximate conversion rate
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
