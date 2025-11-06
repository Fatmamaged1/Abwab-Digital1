# Abwab Digital API

A comprehensive Node.js/Express REST API for Abwab Digital, a bilingual (Arabic/English) digital marketing company. This API serves as the backend for a corporate website and includes a complete CRM system for sales management.

## 🚀 Features

### Core Features
- **Bilingual Support**: Full Arabic/English localization for all content
- **Admin Dashboard**: Complete content management system via AdminJS
- **File Management**: Advanced file upload system with image optimization
- **Email System**: Automated newsletter campaigns and email notifications
- **CRM Integration**: Complete sales management with leads, activities, and reporting
- **API Documentation**: Swagger/OpenAPI documentation
- **Security**: JWT authentication, rate limiting, CORS, and input validation

### Content Management
- **Blog System**: Rich blog management with markdown support
- **Portfolio**: Project showcase with image galleries
- **Services**: Service offerings with detailed descriptions
- **Team Management**: Employee profiles and team structure
- **Client Testimonials**: Customer feedback management
- **Contact System**: Contact form handling and inquiry management

### Sales CRM
- **Lead Management**: Complete lead tracking and qualification
- **Sales Pipeline**: Opportunity management and deal tracking
- **Activity Logging**: Sales activities and customer interactions
- **Document Management**: File attachments and document storage
- **Analytics & Reports**: Sales performance and analytics dashboard

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18
- **Framework**: Express.js 4.21.2
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **File Processing**: Multer, Sharp (image optimization)
- **Email**: Nodemailer with Gmail integration
- **Queue System**: Bull for background jobs
- **Caching**: Redis support
- **Documentation**: Swagger/OpenAPI
- **Admin Panel**: AdminJS

### Project Structure
```
├── models/                 # MongoDB schemas
│   ├── sales/             # CRM-related models
│   └── *.js               # Content models (Blog, User, etc.)
├── routes/                # Express route definitions
│   └── sales/             # CRM routes
├── controllers/           # Request handlers
├── services/              # Business logic layer
├── middleware/            # Custom middleware
├── utils/                 # Utility functions
├── config/                # Configuration files
├── uploads/               # File storage
└── public/                # Static assets
```

### Key Design Patterns
- **Handler Factory Pattern**: Reusable CRUD operations
- **Service Layer**: Business logic separation
- **Middleware Chain**: Request processing pipeline
- **Error Handling**: Centralized error management
- **API Features**: Advanced querying and pagination

## 📋 Prerequisites

- Node.js 18 or higher
- MongoDB 4.4 or higher
- Redis (optional, for caching)
- Gmail account (for email functionality)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Abwab-Digital1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file with the following variables:
   ```env
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/abwab-digital
   BASE_URL=http://localhost:4000
   JWT_SECRET_KEY=your-secret-key
   JWT_EXPIRE_TIME=7d
   SESSION_SECRET=your-session-secret
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   ```

4. **Database Setup**
   ```bash
   # Create initial admin user
   node createUser.js

   # Seed database with sample data (optional)
   node seed.js
   ```

5. **Start the server**
   ```bash
   npm start
   ```

The server will start on:
- **HTTPS**: `https://localhost:4000` (production)
- **HTTP**: `https://localhost:8080` (redirects to HTTPS)

## 📚 API Documentation

### Base URL
```
https://localhost:4000/api/v1
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Main API Endpoints

#### Content Management
- `GET /api/v1/blogs` - Get all blog posts
- `POST /api/v1/blogs` - Create new blog post
- `GET /api/v1/services` - Get all services
- `GET /api/v1/portfolio` - Get portfolio projects
- `GET /api/v1/employee` - Get team members
- `GET /api/v1/testimonial` - Get client testimonials
- `GET /api/v1/client` - Get client list

#### User Management
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/user/profile` - Get user profile

#### Sales CRM
- `GET /api/v1/lead` - Get all leads
- `POST /api/v1/lead` - Create new lead
- `GET /api/v1/activity` - Get sales activities
- `GET /api/v1/reports` - Get sales reports
- `GET /api/v1/analytics` - Get analytics data

#### Admin Panel
- `GET /admin` - AdminJS dashboard (authenticated)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | development |
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `BASE_URL` | Base URL for the API | Yes | - |
| `JWT_SECRET_KEY` | JWT signing secret | Yes | - |
| `JWT_EXPIRE_TIME` | JWT expiration time | No | 7d |
| `SESSION_SECRET` | Session secret | Yes | - |
| `GMAIL_USER` | Gmail account for emails | No | - |
| `GMAIL_APP_PASSWORD` | Gmail app password | No | - |

### File Upload Configuration
- Upload directory: `uploads/`
- Supported formats: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX)
- Max file size: 10MB (configurable)
- Image optimization: Automatic resizing and compression

## 📧 Email System

### Newsletter Campaigns
The system includes automated newsletter functionality:

- **Weekly Blog Newsletter**: Tuesdays at 11:00 AM
- **Monthly Services Newsletter**: 1st of each month at 10:00 AM

### Email Configuration
- **Provider**: Gmail SMTP
- **Templates**: EJS-based bilingual templates
- **Queue System**: Bull for reliable delivery

## 🛠️ Development

### Available Scripts
```bash
# Start development server
npm start

# Create admin user
node createUser.js

# Seed database
node seed.js

# Fix image paths
node fixImagePaths.js

# Test email functionality
node sendMail.js
```

### Development Workflow
1. Make changes to the codebase
2. Test API endpoints using tools like Postman or curl
3. Check admin panel at `/admin` for data management
4. Review logs in development mode (Morgan logging enabled)

### Code Style
- ESLint configuration recommended
- Follow existing patterns in the codebase
- Use async/await for asynchronous operations
- Implement proper error handling

## 🚀 Deployment

### Vercel Deployment
The project is configured for Vercel deployment:

```bash
# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
vercel env add MONGO_URI
vercel env add JWT_SECRET_KEY
# ... add other required variables
```

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure SSL certificates (Let's Encrypt recommended)
3. Set up MongoDB production database
4. Configure email service
5. Deploy to your hosting platform

### SSL Configuration
Production expects SSL certificates at:
- `/etc/letsencrypt/live/backend.abwabdigital.com/privkey.pem`
- `/etc/letsencrypt/live/backend.abwabdigital.com/fullchain.pem`

## 🔒 Security Features

- **CORS**: Configured for cross-origin requests
- **Rate Limiting**: API request throttling
- **Input Validation**: Express-validator integration
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Secure token generation and validation
- **File Upload Security**: File type validation and size limits

## 📊 Monitoring & Logging

- **Morgan**: HTTP request logging in development
- **Winston**: Production logging system
- **Error Tracking**: Centralized error handling
- **Performance Monitoring**: Basic request timing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🔄 Version History

### v1.0.0
- Initial release with complete CMS and CRM functionality
- Bilingual support (Arabic/English)
- AdminJS integration
- Email newsletter system
- File management system
- Sales CRM with lead management
- API documentation with Swagger

---

**Abwab Digital** © 2025. All rights reserved.
