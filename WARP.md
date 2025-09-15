# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
This is a Node.js/Express REST API for Abwab Digital, a bilingual (Arabic/English) digital marketing company. The API serves content for a corporate website including blogs, services, portfolios, employee profiles, and client testimonials.

## Architecture

### Layer Structure
- **Models**: MongoDB schemas with Mongoose ODM, located in `models/`
- **Routes**: Express route definitions in `routes/`, following REST conventions
- **Services**: Business logic layer in `services/`, using factory patterns for CRUD operations
- **Middleware**: Custom middleware in `middleware/` for error handling, validation, and file uploads
- **Utils**: Utility classes and functions in `utils/`

### Key Architectural Patterns
- **Handler Factory Pattern**: `services/handlerFactory.js` provides reusable CRUD operations for all models
- **Localization**: All content models support Arabic/English fields using a `localizedString` structure
- **SEO Schema**: Embedded SEO metadata in content models for multi-language SEO optimization
- **File Upload Strategy**: Multer-based uploads with dynamic field configuration per route
- **AdminJS Integration**: Admin panel at `/admin` with authenticated access for content management

### Data Models Structure
Content follows bilingual patterns:
```javascript
const localizedString = {
  ar: { type: String, required: false },
  en: { type: String, required: false },
}
```

Key models: User, Blog, Service, Employee, Project, Portfolio, Client, Testimonial, Contact, MailingList

### API Architecture
- Base URL: `/api/v1/`
- Routes follow RESTful conventions
- All routes support CORS with `origin: '*'`
- File uploads handled via `/uploads` static directory
- Centralized error handling through `middleware/errorMiddleware.js`

## Development Commands

### Server Management
```bash
# Start server (development)
npm start

# Start server with environment variables
NODE_ENV=development npm start
```

### Database Operations
```bash
# Create admin user
node createUser.js

# Seed database with initial data
node seed.js

# Fix image paths (maintenance)
node fixImagePaths.js
```

### Email & Cron
```bash
# Test email functionality
node sendMail.js

# Newsletter cron is auto-started with server
# Weekly: Tuesdays at 11:00 AM
# Monthly: 1st of month at 10:00 AM
```

### Development Workflow
```bash
# Install dependencies
npm install

# Start development server
npm start

# Server runs on:
# HTTPS: port 4000 (production)
# HTTP: port 8080 (redirects to HTTPS)
```

## Environment Configuration

Required environment variables in `.env`:
- `NODE_ENV`: development/production
- `MONGO_URI`: MongoDB connection string
- `BASE_URL`: API base URL
- `JWT_SECRET_KEY`: JWT signing key
- `JWT_EXPIRE_TIME`: Token expiration time
- `SESSION_SECRET`: Session signing secret
- `GMAIL_USER`: Gmail for newsletters
- `GMAIL_APP_PASSWORD`: Gmail app password

## Deployment

### Vercel Configuration
Project is configured for Vercel deployment via `vercel.json`:
- Build target: `server.js`
- All HTTP methods supported
- Routes proxy to main server file

### SSL Configuration
Production server expects SSL certificates at:
- `/etc/letsencrypt/live/backend.abwabdigital.com/privkey.pem`
- `/etc/letsencrypt/live/backend.abwabdigital.com/fullchain.pem`

## File Upload Structure
- Main uploads: `uploads/` directory
- Model-specific subdirectories (e.g., `uploads/about/`)
- Automatic filename generation with timestamps
- Supported via Multer with diskStorage

## Newsletter System
Automated email campaigns via `newsletterCron.js`:
- **Weekly Blog Newsletter**: Tuesdays 11:00 AM
- **Monthly Services Newsletter**: 1st of month 10:00 AM
- Sends to all contacts in database
- Supports bilingual content templating

## AdminJS Panel
- Access: `/admin`
- Authentication required (admin users only)
- Manages all content models
- Custom branding for Abwab Digital
- Logo optimization on startup

## Testing & Debugging
- Morgan logging in development mode
- Comprehensive error handling with stack traces in dev mode
- API Error class for standardized error responses
- Async handler wrapper for all route handlers

## Content Management Patterns
- All content supports Arabic/English localization
- SEO metadata embedded in models
- Slug generation for URL-friendly identifiers
- Markdown support in content fields (converted to HTML via `marked`)
- Image optimization using Sharp library

## Security Considerations
- CORS enabled for all origins (production setting)
- JWT-based authentication
- Password hashing with bcrypt
- Input validation via express-validator
- Helmet middleware (currently disabled)