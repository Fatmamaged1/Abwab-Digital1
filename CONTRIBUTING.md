# Contributing to Abwab Digital API

Thank you for your interest in contributing to the Abwab Digital API! This document provides guidelines for contributing to this project.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Commit Guidelines](#commit-guidelines)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **MongoDB**: Version 4.4 or higher
- **Redis**: (Optional) For caching and session management
- **Git**: For version control

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/abwab-digital-api.git
   cd abwab-digital-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```

   Fill in your `.env` file with the required values:
   ```env
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/abwab-digital
   JWT_SECRET_KEY=your-secret-key
   # ... other variables
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running locally
   mongod
   ```

5. **Create Admin User**
   ```bash
   node createUser.js
   ```

6. **Start Development Server**
   ```bash
   npm start
   ```

   The server will start on:
   - HTTPS: `https://localhost:4000`
   - HTTP: `https://localhost:8080` (redirects to HTTPS)

## 🛠️ Development Workflow

### Branch Structure

- **`main`**: Production-ready code
- **`develop`**: Development branch for integration
- **`feature/*`**: New features (e.g., `feature/user-authentication`)
- **`bugfix/*`**: Bug fixes (e.g., `bugfix/email-validation`)
- **`hotfix/*`**: Critical production fixes

### Creating a Feature Branch

1. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the code standards

3. Test your changes thoroughly

4. Commit your changes (see [Commit Guidelines](#commit-guidelines))

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request to `develop`

## 📝 Code Standards

### JavaScript/Node.js Standards

#### Naming Conventions
- **Variables**: camelCase (`userName`, `blogPost`)
- **Constants**: UPPER_CASE (`MAX_FILE_SIZE`, `DEFAULT_PORT`)
- **Classes**: PascalCase (`UserModel`, `BlogService`)
- **Files**: kebab-case (`user-model.js`, `blog-service.js`)
- **Routes**: camelCase (`userRoutes`, `blogRoutes`)

#### Code Style
- Use **ES6+** features (async/await, arrow functions, destructuring)
- **Semicolons**: Required at the end of statements
- **Quotes**: Single quotes for strings, double quotes for JSON
- **Indentation**: 2 spaces (no tabs)
- **Line length**: Maximum 100 characters

#### File Structure
```
├── models/
│   └── UserModel.js          # Capitalized, descriptive name
├── routes/
│   └── userRoutes.js         # camelCase, descriptive name
├── controllers/
│   └── userController.js     # camelCase, matches route
├── services/
│   └── userService.js        # camelCase, business logic
├── middleware/
│   └── authMiddleware.js     # camelCase, descriptive
└── utils/
    └── apiResponse.js        # camelCase, utility functions
```

### API Standards

#### Response Format
All API responses must follow this format:

```javascript
// Success Response
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}

// Error Response
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### HTTP Status Codes
- **200**: Success
- **201**: Created successfully
- **400**: Bad request / Validation error
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not found
- **500**: Internal server error

#### Route Structure
```javascript
// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);

module.exports = router;
```

### Database Standards

#### Model Structure
```javascript
// models/UserModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Pre-save middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
```

#### Query Standards
```javascript
// Use async/await
exports.getUsers = async (req, res) => {
  try {
    // Use query builders
    const users = await User.find({})
      .select('name email createdAt') // Select specific fields
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(10); // Limit results

    res.status(200).json({
      status: 'success',
      data: { users }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
```

### Error Handling
```javascript
// Use try-catch in all async functions
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: { user }
    });
  } catch (error) {
    // Handle different types of errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
```

### Validation
```javascript
// middleware/validationMiddleware.js
const Joi = require('joi');

exports.validateUser = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }))
    });
  }

  next();
};
```

## 🏗️ Project Structure Guidelines

### Adding New Features

1. **Create Model** (if needed)
   ```bash
   # Create in models/
   touch models/NewFeatureModel.js
   ```

2. **Create Service Layer**
   ```bash
   # Create in services/
   touch services/newFeatureService.js
   ```

3. **Create Controller**
   ```bash
   # Create in controllers/
   touch controllers/newFeatureController.js
   ```

4. **Create Routes**
   ```bash
   # Create in routes/
   touch routes/newFeatureRoutes.js
   ```

5. **Add to Server**
   ```javascript
   // server.js
   const newFeatureRoutes = require('./routes/newFeatureRoutes');
   app.use('/api/v1/new-feature', newFeatureRoutes);
   ```

6. **Add to AdminJS** (if admin manageable)
   ```javascript
   // admin.js
   const NewFeature = require('./models/NewFeatureModel');

   const adminJs = new AdminJS({
     resources: [
       // ... existing resources
       { resource: NewFeature, options: {} }
     ]
   });
   ```

### Middleware Guidelines

- **Authentication**: Use `middleware/authMiddleware.js`
- **Validation**: Use `middleware/validationMiddleware.js`
- **File Upload**: Use `middleware/uploadMiddleware.js`
- **Error Handling**: Use `middleware/errorMiddleware.js`

### Service Layer Pattern

```javascript
// services/userService.js
const User = require('../models/UserModel');
const AppError = require('../utils/AppError');

class UserService {
  static async createUser(userData) {
    // Business logic here
    const user = await User.create(userData);

    if (!user) {
      throw new AppError('Failed to create user', 500);
    }

    return user;
  }

  static async getUserById(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  static async updateUser(userId, updateData) {
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}

module.exports = UserService;
```

## 🧪 Testing

### Testing Guidelines

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test API endpoints
3. **End-to-End Tests**: Test complete user flows

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "user"
```

### Test Structure
```
tests/
├── unit/
│   ├── models/
│   ├── services/
│   └── utils/
├── integration/
│   ├── routes/
│   └── middleware/
└── e2e/
    └── flows/
```

## 🔄 Pull Request Process

1. **Update Documentation**: Update README.md and API.md if needed
2. **Add Tests**: Ensure all new features have tests
3. **Code Review**: Request review from maintainers
4. **CI/CD**: Ensure all checks pass
5. **Merge**: Merge to develop branch first

### Pull Request Template
```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project standards
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes
```

## 📋 Commit Guidelines

### Commit Message Format
```
type(scope): description

Examples:
feat(auth): add JWT authentication
fix(blog): resolve image upload bug
docs(api): update endpoint documentation
refactor(user-service): optimize database queries
test(auth): add unit tests for login
```

### Commit Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to auxiliary tools and libraries

### Scope
- **auth**: Authentication related
- **blog**: Blog management
- **user**: User management
- **admin**: Admin panel
- **api**: API related changes
- **docs**: Documentation
- **test**: Testing related

## 🚫 Common Mistakes to Avoid

1. **Don't commit directly to main or develop**
   ```bash
   # ❌ Wrong
   git push origin main

   # ✅ Correct
   git push origin feature/my-feature
   ```

2. **Don't skip validation**
   ```javascript
   // ❌ Don't skip validation
   await User.create(req.body);

   // ✅ Use proper validation
   const { error } = schema.validate(req.body);
   if (error) throw new AppError('Validation failed', 400);
   await User.create(req.body);
   ```

3. **Don't forget error handling**
   ```javascript
   // ❌ No error handling
   const user = await User.findById(id);

   // ✅ Proper error handling
   try {
     const user = await User.findById(id);
     if (!user) throw new AppError('User not found', 404);
   } catch (error) {
     // Handle error appropriately
   }
   ```

4. **Don't hardcode values**
   ```javascript
   // ❌ Hardcoded values
   const saltRounds = 10;

   // ✅ Use environment variables
   const saltRounds = process.env.BCRYPT_SALT_ROUNDS || 12;
   ```

## 📞 Getting Help

### Resources
- **Documentation**: README.md, API.md
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: development@abwabdigital.com

### Code Review Checklist
- [ ] Code follows project standards
- [ ] Proper error handling implemented
- [ ] Input validation included
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance impact considered

## 🎉 Recognition

Contributors will be recognized in the project README and our hall of fame. Thank you for helping make Abwab Digital API better!

---

**Happy coding! 🚀**
