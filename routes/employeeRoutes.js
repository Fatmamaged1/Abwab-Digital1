const express = require('express');
const path = require('path');
const multer = require('multer');


const router = express.Router();
const {
  createEmployeeValidator,
  updateEmployeeValidator,
  deleteEmployeeValidator,
} = require('../validator/employeeValidator');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../services/employeeServices');

// Set up multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/employee/'));
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profileImage-' + uniqueSuffix + fileExtension);
  },
});

const upload = multer({ storage });

// Other routes...

// Error handling middleware
router.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    status: 'error',
    errors: [{ field: 'general', message: error.message }],
  });
});

// Create an employee with profile image upload
router.post('/', upload.single("profileImage"), async (req, res, next) => {
  try {
    // Extract profile image filename from the multer upload
    req.body.profileImage = req.file ? req.file.filename : undefined;
    next();
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
}, createEmployee, createEmployeeValidator);



// Get all technologies
router.get('/', async (req, res) => {
  try {
    const Employees = await getEmployees();
    res.json(Employees);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      errors: [{ field: 'general', message: error.message }],
    });
  }
});

// Get a specific employee by ID
router.get('/:id', getEmployee ,async (req, res) => {
  try {
    const  getEmployee = await getEmployee(req.params.id);
    if (!getEmployee) {
      res.status(404).json({ status: 'error', message: 'Employee not found' });
      return;
    }
    res.json(getEmployee);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      errors: [{ field: 'general', message: error.message }],
    });
  }
});

// Update a Employee by ID
router.put('/:id',updateEmployeeValidator, async (req, res) => {
  try {
    const updatedEmployee = await updateEmployee(req.params.id, req.body);
    if (!updatedEmployee) {
      res.status(404).json({ status: 'error', message: 'Employee not found' });
      return;
    }
    res.json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ status: 'error', error: { statusCode: 400, message: error.message } });
  }
});

// Delete a technology by ID
router.delete('/:id',deleteEmployeeValidator, async (req, res) => {
  try {
    const deletedEmployee = await deleteEmployee(req.params.id);
    if (!deletedEmployee) {
      res.status(404).json({ status: 'error', message: 'Employee not found' });
      return;
    }
    res.json({ status: 'success', message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: { statusCode: 500, message: error.message } });
  }
});

module.exports = router;
