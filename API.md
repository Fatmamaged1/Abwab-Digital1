# API Documentation

## Overview
This document provides comprehensive documentation for the Abwab Digital API, a Node.js/Express REST API that powers a bilingual digital marketing company website and includes a complete CRM system.

## Base URL
```
Production: https://backend.abwabdigital.com/api/v1
Development: http://localhost:4000/api/v1
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow a consistent format:

### Success Response
```json
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
```

### Error Response
```json
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

## API Endpoints

### Authentication

#### Register User
```http
POST /api/v1/auth/signup
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

#### Login
```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Forgot Password
```http
POST /api/v1/auth/forgotPassword
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### Reset Password
```http
PUT /api/v1/auth/resetPassword
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "resetCode": "123456",
  "newPassword": "newpassword123"
}
```

### Blog Management

#### Get All Blogs
```http
GET /api/v1/blogs
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sort` (optional): Sort field (default: createdAt)
- `fields` (optional): Fields to include
- `search` (optional): Search term

**Response:**
```json
{
  "status": "success",
  "data": {
    "blogs": [
      {
        "id": "blog_id",
        "title": {
          "ar": "عنوان المدونة",
          "en": "Blog Title"
        },
        "content": {
          "ar": "محتوى المدونة بالعربية",
          "en": "Blog content in English"
        },
        "image": "uploads/blogs/image.jpg",
        "tags": ["tag1", "tag2"],
        "author": "Author Name",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### Create Blog
```http
POST /api/v1/blogs
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title[ar]`: Blog title in Arabic
- `title[en]`: Blog title in English
- `content[ar]`: Blog content in Arabic (markdown supported)
- `content[en]`: Blog content in English (markdown supported)
- `excerpt[ar]`: Short excerpt in Arabic
- `excerpt[en]`: Short excerpt in English
- `image`: Main blog image
- `sectionImage[0-3]`: Section images (optional)
- `tagIcons[0-3]`: Tag icons (optional)
- `tags`: Comma-separated tags
- `author`: Author name
- `publishDate`: Publication date
- `isPublished`: true/false

#### Update Blog
```http
PUT /api/v1/blogs/:id
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Parameters:**
- `id`: Blog ID

### Services Management

#### Get All Services
```http
GET /api/v1/services
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "services": [
      {
        "id": "service_id",
        "title": {
          "ar": "خدمة التسويق الرقمي",
          "en": "Digital Marketing Service"
        },
        "description": {
          "ar": "وصف الخدمة بالعربية",
          "en": "Service description in English"
        },
        "icon": "service-icon.png",
        "features": [
          {
            "ar": "ميزة 1",
            "en": "Feature 1"
          }
        ],
        "isActive": true
      }
    ]
  }
}
```

#### Create Service
```http
POST /api/v1/services
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title[ar]`: Service title in Arabic
- `title[en]`: Service title in English
- `description[ar]`: Service description in Arabic
- `description[en]`: Service description in English
- `shortDescription[ar]`: Short description in Arabic
- `shortDescription[en]`: Short description in English
- `icon`: Service icon image
- `image`: Service main image
- `features[ar]`: JSON string of features in Arabic
- `features[en]`: JSON string of features in English
- `isActive`: true/false

### Portfolio Management

#### Get Portfolio Projects
```http
GET /api/v1/portfolio
```

**Query Parameters:**
- `category` (optional): Filter by category
- `technology` (optional): Filter by technology
- `limit` (optional): Number of projects to return

**Response:**
```json
{
  "status": "success",
  "data": {
    "projects": [
      {
        "id": "project_id",
        "title": {
          "ar": "عنوان المشروع",
          "en": "Project Title"
        },
        "description": {
          "ar": "وصف المشروع",
          "en": "Project description"
        },
        "images": [
          "project-image1.jpg",
          "project-image2.jpg"
        ],
        "technologies": ["React", "Node.js"],
        "category": "Web Development",
        "client": "Client Name",
        "year": 2025,
        "url": "https://project-url.com"
      }
    ]
  }
}
```

### Employee Management

#### Get Team Members
```http
GET /api/v1/employee
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "employees": [
      {
        "id": "employee_id",
        "name": "John Doe",
        "position": {
          "ar": "مدير التسويق",
          "en": "Marketing Manager"
        },
        "bio": {
          "ar": "السيرة الذاتية",
          "en": "Biography"
        },
        "image": "employee.jpg",
        "socialLinks": {
          "linkedin": "https://linkedin.com/in/johndoe",
          "twitter": "https://twitter.com/johndoe"
        },
        "isActive": true
      }
    ]
  }
}
```

### Sales CRM API

#### Leads Management

##### Get All Leads
```http
GET /api/v1/lead
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status (new, contacted, qualified, converted, closed)
- `source`: Filter by source (web, referral, ads, event, cold_outreach, other)
- `owner`: Filter by owner/assigned user
- `search`: Search in name, email, company

**Response:**
```json
{
  "status": "success",
  "data": {
    "leads": [
      {
        "id": "lead_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@company.com",
        "phone": "+1234567890",
        "jobTitle": "Marketing Director",
        "company": {
          "name": "Tech Corp",
          "website": "https://techcorp.com",
          "industry": "technology",
          "size": "50-100"
        },
        "source": "web",
        "status": "new",
        "priority": "high",
        "owner": "user_id",
        "interactions": [],
        "documents": [],
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

##### Create Lead
```http
POST /api/v1/lead
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@company.com",
  "phone": "+1234567890",
  "jobTitle": "Marketing Director",
  "company": {
    "name": "Tech Corp",
    "website": "https://techcorp.com",
    "industry": "technology",
    "size": "50-100"
  },
  "source": "web",
  "campaign": "Google Ads Campaign",
  "notes": "Initial inquiry about digital marketing services",
  "owner": "user_id",
  "priority": "medium"
}
```

##### Update Lead
```http
PUT /api/v1/lead/:id
```

**Parameters:**
- `id`: Lead ID

**Request Body:** (same as create, with updated fields)

##### Convert Lead to Opportunity
```http
PATCH /api/v1/lead/:id/convert
```

**Parameters:**
- `id`: Lead ID

**Request Body:**
```json
{
  "opportunityValue": 50000,
  "expectedCloseDate": "2025-06-01",
  "notes": "Converted to opportunity"
}
```

##### Delete Lead
```http
DELETE /api/v1/lead/:id
```

**Parameters:**
- `id`: Lead ID

#### Activities Management

##### Get All Activities
```http
GET /api/v1/activity
```

**Query Parameters:**
- `leadId`: Filter by lead ID
- `type`: Filter by activity type
- `dateFrom`, `dateTo`: Date range filter

**Response:**
```json
{
  "status": "success",
  "data": {
    "activities": [
      {
        "id": "activity_id",
        "type": "call",
        "title": "Follow-up call",
        "description": "Discussed service requirements",
        "leadId": "lead_id",
        "userId": "user_id",
        "scheduledAt": "2025-01-15T10:00:00.000Z",
        "completedAt": "2025-01-15T10:30:00.000Z",
        "status": "completed",
        "notes": "Client interested in SEO services",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

##### Create Activity
```http
POST /api/v1/activity
```

**Request Body:**
```json
{
  "type": "call",
  "title": "Follow-up call",
  "description": "Discuss project requirements",
  "leadId": "lead_id",
  "scheduledAt": "2025-01-15T10:00:00.000Z",
  "notes": "Initial contact made"
}
```

#### Sales Reports

##### Get Sales Reports
```http
GET /api/v1/reports
```

**Query Parameters:**
- `type`: Report type (leads, opportunities, activities, conversion)
- `period`: Time period (daily, weekly, monthly, quarterly, yearly)
- `dateFrom`, `dateTo`: Custom date range

**Response:**
```json
{
  "status": "success",
  "data": {
    "report": {
      "type": "leads",
      "period": "monthly",
      "summary": {
        "total": 150,
        "new": 50,
        "contacted": 40,
        "qualified": 30,
        "converted": 20,
        "closed": 10
      },
      "bySource": {
        "web": 60,
        "referral": 40,
        "ads": 30,
        "other": 20
      },
      "byOwner": {
        "user1": 75,
        "user2": 75
      },
      "conversionRate": 13.33
    }
  }
}
```

#### Analytics

##### Get Analytics Data
```http
GET /api/v1/analytics
```

**Query Parameters:**
- `metric`: Specific metric (leads, conversion, revenue, activities)
- `period`: Time period
- `dateFrom`, `dateTo`: Date range

**Response:**
```json
{
  "status": "success",
  "data": {
    "analytics": {
      "overview": {
        "totalLeads": 150,
        "totalOpportunities": 45,
        "totalRevenue": 250000,
        "conversionRate": 15.5,
        "avgDealSize": 5500
      },
      "trends": {
        "leadsGrowth": 12.5,
        "conversionImprovement": 3.2,
        "revenueGrowth": 8.7
      },
      "topPerformers": [
        {
          "user": "Sales Rep 1",
          "leads": 45,
          "conversion": 18.5,
          "revenue": 85000
        }
      ]
    }
  }
}
```

#### Documents Management

##### Upload Document
```http
POST /api/v1/document
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Document file (PDF, DOC, DOCX, etc.)
- `title`: Document title
- `description`: Document description
- `leadId` (optional): Associated lead ID
- `category`: Document category

**Response:**
```json
{
  "status": "success",
  "data": {
    "document": {
      "id": "doc_id",
      "title": "Contract Document",
      "filename": "contract_2025.pdf",
      "url": "/uploads/documents/contract_2025.pdf",
      "size": 2048576,
      "mimeType": "application/pdf",
      "leadId": "lead_id",
      "category": "contract",
      "uploadedBy": "user_id"
    }
  }
}
```

##### Get Documents
```http
GET /api/v1/document
```

**Query Parameters:**
- `leadId`: Filter by lead ID
- `category`: Filter by category
- `page`, `limit`: Pagination

### Contact Management

#### Submit Contact Form
```http
POST /api/v1/contact
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "Inquiry about services",
  "message": "I would like to know more about your digital marketing services",
  "service": "Digital Marketing"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Thank you for your message. We will get back to you soon."
}
```

#### Get All Contacts (Admin)
```http
GET /api/v1/contact
```

**Headers:**
```
Authorization: Bearer <token>
```

### Mailing List

#### Subscribe to Newsletter
```http
POST /api/v1/mailing-list
```

**Request Body:**
```json
{
  "email": "subscriber@example.com",
  "name": "John Doe",
  "preferences": {
    "weekly": true,
    "monthly": false,
    "language": "en"
  }
}
```

#### Get Subscribers (Admin)
```http
GET /api/v1/mailing-list
```

**Headers:**
```
Authorization: Bearer <token>
```

### Admin Panel

#### Access Admin Dashboard
```http
GET /admin
```

**Authentication:** HTTP Basic Auth with admin credentials

The admin panel provides a web interface for managing all content including:
- Users and permissions
- Blog posts and content
- Sales leads and CRM data
- File management
- System settings

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created successfully |
| 400 | Bad request / Validation error |
| 401 | Unauthorized / Invalid credentials |
| 403 | Forbidden / Insufficient permissions |
| 404 | Resource not found |
| 405 | Method not allowed |
| 429 | Too many requests / Rate limited |
| 500 | Internal server error |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **File upload endpoints**: 10 uploads per hour

## File Upload Specifications

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP (max 10MB)
- **Documents**: PDF, DOC, DOCX, XLS, XLSX (max 10MB)

### Image Processing
- Automatic optimization using Sharp
- Multiple sizes generated
- WebP format conversion
- Metadata stripping

## Webhooks

### Lead Created Webhook
```http
POST /api/v1/webhooks/lead-created
```

**Payload:**
```json
{
  "event": "lead.created",
  "data": {
    "id": "lead_id",
    "email": "lead@example.com",
    "source": "web",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

## SDK and Libraries

While there's no official SDK, the API is designed to work with:
- **HTTP clients**: Axios, Fetch API, cURL
- **JavaScript frameworks**: React, Vue, Angular
- **Mobile apps**: React Native, Flutter
- **Desktop applications**: Electron

## Support

For API support or questions:
- **Documentation**: This document
- **Issues**: GitHub repository issues
- **Email**: technical@abwabdigital.com

## Changelog

### Version 1.0.0
- Initial API release
- Complete CRM functionality
- Bilingual content support
- AdminJS integration
- Email newsletter system
- File management system
