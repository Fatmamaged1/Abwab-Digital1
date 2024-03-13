const express = require('express');
const path = require('path');
const multer = require('multer');
const employeeModel = require('../models/employeeModel');

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
router.route("/:id").get(async (req, res, next) => {
  const employeeId = req.params.id;

  // Validate the employee ID format
  if (!/^[0-9a-fA-F]{24}$/.test(employeeId)) {
    return res.status(400).json({
      status: "error",
      errors: [{
        type: 'field',
        value: employeeId,
        msg: 'Invalid employee ID format',
        path: 'id',
        location: 'params'
      }],
    });
  }

  try {
    // Fetch the employee based on the ID
    const employee = await employeeModel.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        status: "error",
        errors: [{
          type: 'field',
          value: employeeId,
          msg: 'Employee not found',
          path: 'id',
          location: 'params'
        }],
      });
    }

    res.status(200).json({
      status: "success",
      data: employee,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{
        type: 'field',
        value: employeeId,
        msg: `Error fetching employee: ${error.message}`,
        path: 'id',
        location: 'params'
      }],
    });
  }
})

.put(updateEmployeeValidator, updateEmployee)
.delete(deleteEmployeeValidator, deleteEmployee);

// Get All Employees
router.route("/").get(async (req, res, next) => {
  try {
    const employees = await employeeModel.find();
    res.status(200).json({
      status: "success",
      data: employees,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      errors: [{ field: "general", message: error.message }],
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


// Delete an employee by ID
router.delete('/:id', deleteEmployeeValidator, async (req, res) => {
  const employeeId = req.params.id;

  try {
    // Validate the employee ID format
    if (!/^[0-9a-fA-F]{24}$/.test(employeeId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid employee ID format',
      });
    }

    // Delete the employee
    const deletedEmployee = await deleteEmployee(employeeId);

    // Check if the employee was not found
    if (!deletedEmployee) {
      return res.status(404).json({
        status: 'error',
        message: 'Employee not found',
      });
    }

    // Send success message as a response
    res.json({
      status: 'success',
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    // Handle other errors
    res.status(500).json({
      status: 'error',
      error: {
        statusCode: 500,
        message: error.message,
      },
    });
  }
});


module.exports = router;
