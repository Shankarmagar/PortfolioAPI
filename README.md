# Portfolio API

A comprehensive REST API built with Node.js, Express.js, and Supabase for managing Projects, Certifications, and My Journey data.

## Features

### 🎯 Core Features

- **Complete CRUD Operations** for Projects, Certifications, and Journey Items
- **Authentication & Authorization** with JWT and Supabase Auth
- **File Upload Support** for project images
- **Advanced Filtering & Search** capabilities
- **Pagination** for all list endpoints
- **Input Validation** using Joi schemas
- **Error Handling** with comprehensive error responses

### 🔧 Technical Features

- **Supabase Integration** with Row Level Security (RLS)
- **Rate Limiting** for API protection
- **CORS Support** for cross-origin requests
- **Request Validation** with express-validator
- **File Upload Handling** with Multer
- **Environment Configuration** with dotenv

## Database Schema

The API uses three main tables:

### Projects Table

```sql
- id (BIGSERIAL PRIMARY KEY)
- name (TEXT NOT NULL)
- details (TEXT NOT NULL)
- image_url (TEXT)
- skills (JSONB NOT NULL DEFAULT '[]')
- demo_link (TEXT)
- github_link (TEXT)
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
```

### Certifications Table

```sql
- id (BIGSERIAL PRIMARY KEY)
- title (TEXT NOT NULL)
- issuer (TEXT NOT NULL)
- issued_date (DATE NOT NULL)
- certification_id (TEXT)
- details (TEXT)
- link_url (TEXT)
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
```

### Journey Items Table

```sql
- id (BIGSERIAL PRIMARY KEY)
- title (TEXT NOT NULL)
- company_name (TEXT NOT NULL)
- start_date (DATE NOT NULL)
- end_date (DATE)
- details (TEXT NOT NULL)
- journey_type (TEXT NOT NULL CHECK (journey_type IN ('Experience', 'Education', 'Volunteer')))
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE DEFAULT NOW())
```

## API Endpoints

### 🔐 Authentication

```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
POST   /api/auth/refresh      - Refresh token
POST   /api/auth/logout       - Logout user
GET    /api/auth/me          - Get current user
```

### 📁 Projects

```
GET    /api/projects          - Get all projects (public, with pagination & filtering)
GET    /api/projects/:id      - Get single project (public)
GET    /api/projects/search   - Search projects (public)
POST   /api/projects          - Create new project (auth required)
POST   /api/projects/upload-image - Upload project image (auth required)
PUT    /api/projects/:id      - Update project (auth required)
DELETE /api/projects/:id      - Delete project (auth required)
```

### 🎓 Certifications

```
GET    /api/certifications          - Get all certifications (public, with pagination)
GET    /api/certifications/:id      - Get single certification (public)
GET    /api/certifications/issuer/:issuer - Get certifications by issuer (public)
POST   /api/certifications          - Create new certification (auth required)
PUT    /api/certifications/:id      - Update certification (auth required)
DELETE /api/certifications/:id      - Delete certification (auth required)
```

### 🚀 My Journey

```
GET    /api/journey                - Get all journey items (public, with pagination & filtering)
GET    /api/journey/:id            - Get single journey item (public)
GET    /api/journey/type/:type     - Get journey items by type (public)
GET    /api/journey/current        - Get current (ongoing) journey items (public)
POST   /api/journey                - Create new journey item (auth required)
PUT    /api/journey/:id            - Update journey item (auth required)
DELETE /api/journey/:id            - Delete journey item (auth required)
```

## Request/Response Examples

### Create Project

```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Awesome Project",
  "details": "This is a detailed description of the project...",
  "skills": ["React", "Node.js", "MongoDB"],
  "demo_link": "https://demo.example.com",
  "github_link": "https://github.com/user/repo"
}
```

### Response

```json
{
  "success": true,
  "message": "Project created successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": 1,
    "name": "My Awesome Project",
    "details": "This is a detailed description of the project...",
    "skills": ["React", "Node.js", "MongoDB"],
    "demo_link": "https://demo.example.com",
    "github_link": "https://github.com/user/repo",
    "image_url": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "has_image": false
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Query Parameters

### Pagination

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)

### Sorting

- `sortBy` (string): Field to sort by
- `sortOrder` (string): Sort direction ('asc' or 'desc', default: 'desc')

### Filtering

- `search` (string): Search in name and details
- `skills` (string): Comma-separated skills filter
- `hasImage` (boolean): Filter by image presence
- `journey_type` (string): Filter journey by type
- `current` (boolean): Filter current (ongoing) items

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd portfolio-api
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

### 3. Database Setup

1. Create a Supabase project
2. Execute the SQL schema from `database/schema.sql`
3. Configure Row Level Security policies
4. Create a storage bucket for project images

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Security Features

- **Authentication Required** for create, update, delete operations
- **Public Read Access** for GET operations
- **Rate Limiting** to prevent abuse
- **Input Validation** using Joi and express-validator
- **SQL Injection Protection** via Supabase
- **CORS Configuration** for cross-origin security
- **Helmet** for security headers

## File Upload

Project images are uploaded using Multer with the following constraints:

- **File Types**: JPEG, PNG, GIF, WebP
- **Max Size**: 10MB (configurable)
- **Storage**: Local filesystem in `uploads/projects/`
- **Naming**: UUID-based unique filenames

## Testing

The API includes comprehensive error handling and validation. Test endpoints using:

### cURL Examples

```bash
# Get all projects
curl http://localhost:3000/api/projects

# Create project (requires auth)
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","details":"Test description","skills":["JavaScript"]}'

# Upload project image
curl -X POST http://localhost:3000/api/projects/upload-image \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/image.jpg"
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "errors": { ... } // Optional detailed errors
}
```

## Project Structure

```
portfolio-api/
├── src/
│   ├── config/
│   │   └── supabase.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── projectsController.js # Projects CRUD
│   │   ├── certificationsController.js # Certifications CRUD
│   │   └── journeyController.js # Journey items CRUD
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── upload.js           # File upload middleware
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── notFound.js         # 404 handler
│   │   └── validateRequest.js  # Request validation
│   ├── routes/
│   │   ├── auth.js             # Auth routes
│   │   ├── projects.js         # Projects routes
│   │   ├── certifications.js   # Certifications routes
│   │   └── journey.js          # Journey routes
│   ├── utils/
│   │   ├── responseFormatter.js # Response formatting
│   │   └── validation.js       # Joi schemas
│   └── server.js               # Main server file
├── database/
│   └── schema.sql              # Database schema
├── uploads/                    # File uploads directory
├── .env.example               # Environment variables template
├── package.json
└── README.md
```

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Configure proper CORS origins
3. Set up proper JWT secrets
4. Configure Supabase production environment
5. Set up file storage (consider cloud storage for production)
6. Enable proper logging and monitoring
7. Set up SSL/TLS certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
