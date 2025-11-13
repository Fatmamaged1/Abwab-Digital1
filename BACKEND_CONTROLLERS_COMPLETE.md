# 🎮 Backend Controllers - Complete Implementation Guide

## Status: Controllers Implementation

I've created sample controllers for:
1. ✅ **projectRequirementController.js** - Full CRUD + AI analysis
2. ✅ **brdController.js** - Full CRUD + versioning + AI epic generation
3. ✅ **sprintVelocityController.js** - Full CRUD + AI predictions

---

## 🚀 Standardized Controller Pattern

All controllers follow this pattern:

```javascript
// Standard CRUD Operations
- getAllItems()          // GET /api/module/items (with pagination, filters, search)
- getItemById()          // GET /api/module/items/:id
- createItem()           // POST /api/module/items
- updateItem()           // PUT /api/module/items/:id
- deleteItem()           // DELETE /api/module/items/:id (soft delete)

// AI-Enhanced Operations
- analyzeItem()          // POST /api/module/items/:id/analyze
- generateSuggestions()  // POST /api/module/items/:id/generate

// Statistics & Analytics
- getStats()             // GET /api/module/items/stats
- getTrends()            // GET /api/module/items/trends

// Bulk Operations
- bulkImport()           // POST /api/module/items/bulk-import
- bulkUpdate()           // PUT /api/module/items/bulk-update
- bulkDelete()           // DELETE /api/module/items/bulk-delete

// Export Operations
- exportToPDF()          // GET /api/module/items/:id/export/pdf
- exportToExcel()        // GET /api/module/items/:id/export/excel
```

---

## 📋 Remaining Controllers to Create

### Project Management (2 remaining)
- [ ] projectGanttController.js
- [ ] projectKPIController.js

### Software Department (3 remaining)
- [ ] codeReviewController.js
- [ ] bugTrackerController.js
- [ ] technicalDebtController.js

### Marketing Department (3)
- [ ] campaignController.js
- [ ] contentCalendarController.js
- [ ] aiContentGeneratorController.js

### Sales Department (2)
- [ ] leadScoringController.js
- [ ] proposalGeneratorController.js

### Accounting (2)
- [ ] projectBillingController.js
- [ ] cashFlowForecastController.js

### HR Department (3)
- [ ] capacityPlannerController.js
- [ ] performanceReviewController.js
- [ ] payrollAutomationController.js

### CEO Dashboard (3)
- [ ] executiveKPIController.js
- [ ] predictiveAnalyticsController.js
- [ ] earlyWarningController.js

**Total Remaining**: 18 controllers

---

## 🔧 Quick Controller Generator

All controllers will include:

### 1. **Error Handling**
```javascript
try {
  // Operation
} catch (error) {
  res.status(500).json({
    success: false,
    message: 'Error message',
    error: error.message,
  });
}
```

### 2. **Pagination**
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const items = await Model.find(query)
  .limit(limit)
  .skip(skip);

const count = await Model.countDocuments(query);

res.json({
  success: true,
  data: items,
  pagination: {
    currentPage: page,
    totalPages: Math.ceil(count / limit),
    totalItems: count,
    itemsPerPage: limit,
  },
});
```

### 3. **Search & Filters**
```javascript
const query = {};

// Filters
if (req.query.status) query.status = req.query.status;
if (req.query.type) query.type = req.query.type;

// Search
if (req.query.search) {
  query.$or = [
    { 'title.en': { $regex: req.query.search, $options: 'i' } },
    { 'title.ar': { $regex: req.query.search, $options: 'i' } },
  ];
}

// Date range
if (req.query.startDate && req.query.endDate) {
  query.createdAt = {
    $gte: new Date(req.query.startDate),
    $lte: new Date(req.query.endDate),
  };
}
```

### 4. **AI Integration**
```javascript
const aiService = new AIService();

exports.analyzeWithAI = async (req, res) => {
  try {
    const item = await Model.findById(req.params.id);

    const aiResult = await aiService.analyzeItem(item);

    item.aiAnalysis = aiResult;
    await item.save();

    res.json({
      success: true,
      data: aiResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
```

### 5. **Soft Delete**
```javascript
exports.deleteItem = async (req, res) => {
  try {
    const item = await Model.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    item.isDeleted = true;
    item.deletedAt = new Date();
    item.deletedBy = req.user._id;
    await item.save();

    res.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
```

---

## 🛣️ Routes Structure

Each module will have routes like:

```javascript
// routes/agile/projectRequirementRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../../controllers/agile/projectRequirementController');
const { protect, authorize } = require('../../middleware/auth');

// Public routes (none for ERP)

// Protected routes
router.use(protect); // All routes require authentication

router
  .route('/')
  .get(controller.getAllRequirements)
  .post(authorize('project-manager', 'admin'), controller.createRequirement);

router
  .route('/stats')
  .get(controller.getRequirementsStats);

router
  .route('/bulk-import')
  .post(authorize('project-manager', 'admin'), controller.bulkImportRequirements);

router
  .route('/:id')
  .get(controller.getRequirementById)
  .put(authorize('project-manager', 'admin'), controller.updateRequirement)
  .delete(authorize('admin'), controller.deleteRequirement);

router
  .route('/:id/approve')
  .post(authorize('project-manager', 'admin'), controller.approveRequirement);

router
  .route('/:id/analyze')
  .post(controller.analyzeRequirement);

router
  .route('/:id/test-cases')
  .post(controller.addTestCase);

router
  .route('/:id/dependencies')
  .get(controller.getRequirementDependencies);

module.exports = router;
```

---

## 🔐 Middleware Required

### 1. **Authentication Middleware** (`middleware/auth.js`)
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
```

### 2. **Validation Middleware** (`middleware/validation.js`)
```javascript
const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};
```

### 3. **Error Handler** (`middleware/errorHandler.js`)
```javascript
exports.errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map((val) => val.message);
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};
```

---

## 📦 Next Steps

1. **Create Remaining Controllers** (18 controllers)
2. **Create Routes** (21 route files)
3. **Create Middleware** (auth, validation, error handling)
4. **Create Validators** (express-validator schemas)
5. **Test All Endpoints** (Postman collection)

---

## ⏱️ Estimated Time

- **Controllers**: 2-3 days (following the pattern)
- **Routes**: 1 day
- **Middleware**: 1 day
- **Testing**: 2 days

**Total**: ~1 week for complete backend

---

## 💡 Pro Tips

1. **Use Transaction** for operations that modify multiple documents
2. **Add Rate Limiting** to prevent abuse
3. **Implement Caching** (Redis) for frequently accessed data
4. **Add Request Logging** for audit trail
5. **Use Compression** middleware for responses
6. **Implement API Versioning** (/api/v1/)

---

Would you like me to:
1. Continue creating all 18 remaining controllers?
2. Create the routes and middleware first?
3. Create a complete API testing suite (Postman collection)?

Let me know and I'll proceed!

---

© 2025 Abwab Digital
