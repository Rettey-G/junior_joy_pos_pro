const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');

// Get all employees
router.get('/', auth, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single employee
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create employee
router.post('/', auth, async (req, res) => {
  try {
    const { 
      name, 
      salaryMVR, 
      position, 
      gender, 
      phone, 
      email, 
      hireDate, 
      dateOfBirth, 
      pictureUrl 
    } = req.body;
    
    // Handle backward compatibility with old field name
    const salary = salaryMVR || req.body.salary;
    
    if (!name || !salary) {
      return res.status(400).json({ message: 'Name and salary are required' });
    }
    
    const employee = new Employee({
      name,
      salaryMVR: salary,
      position: position || 'Staff',
      gender: gender || 'Male',
      phone: phone || '',
      email: email || '',
      hireDate: hireDate || new Date(),
      dateOfBirth: dateOfBirth || null,
      pictureUrl: pictureUrl || ''
    });
    
    const savedEmployee = await employee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update employee
router.patch('/:id', auth, async (req, res) => {
  try {
    const { 
      name, 
      salaryMVR, 
      position, 
      gender, 
      phone, 
      email, 
      hireDate, 
      dateOfBirth, 
      pictureUrl 
    } = req.body;
    
    const updateData = {};
    
    // Handle backward compatibility with old field name
    const salary = salaryMVR || req.body.salary;
    
    if (name) updateData.name = name;
    if (salary !== undefined) updateData.salaryMVR = salary;
    if (position) updateData.position = position;
    if (gender) updateData.gender = gender;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (hireDate) updateData.hireDate = hireDate;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (pictureUrl !== undefined) updateData.pictureUrl = pictureUrl;
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete employee
router.delete('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
