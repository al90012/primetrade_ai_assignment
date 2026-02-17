# Primetrade AI - Task Management Dashboard

A full-stack web application demonstrating authentication, task management, and clean REST APIs with a focus on production-ready architecture.

## 🎯 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Task Management**: Create, read, update, and delete tasks
- **Search & Filter**: Find tasks by keyword and filter by status
- **Responsive UI**: Mobile-friendly interface with TailwindCSS
- **Production-Ready**: Clean code, proper error handling, validation

## 🏗️ Architecture

### Frontend (Next.js 16)

```
frontend/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── (auth)/       # Auth pages (login, register)
│   │   ├── (dashboard)/  # Protected dashboard pages
│   │   └── layout.tsx    # Root layout
│   ├── components/       # Reusable React components
│   ├── context/          # Auth context for state management
│   ├── lib/              # Utilities and API client
│   └── services/         # API service layer
├── package.json
└── tailwind.config.ts
```

### Backend (Node.js/Express)

```
backend/
├── src/
│   ├── server.ts         # Express app setup
│   ├── controllers/      # Request handlers
│   ├── models/           # MongoDB schemas
│   ├── middleware/       # Auth middleware
│   ├── routes/           # API routes
│   ├── utils/            # Utilities (validation, response formatting)
│   └── config/           # Database configuration
├── package.json
└── tsconfig.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/task_dashboard
# JWT_SECRET=your_secret_key

# Start development server
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "jwt_token"
  },
  "message": "User registered successfully"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}

Response (200):
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "token": "jwt_token"
  },
  "message": "Login successful"
}
```

### Users

#### Get Profile

```http
GET /users/me
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "Profile retrieved successfully"
}
```

### Tasks

#### Get All Tasks (with filtering)

```http
GET /tasks?search={keyword}&status={status}
Authorization: Bearer {token}

Query Parameters:
- search: Search in title and description (optional)
- status: pending | in_progress | completed (optional)

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "task_id",
      "title": "Task 1",
      "description": "Description",
      "status": "pending",
      "user": "user_id",
      "createdAt": "2026-02-17T10:00:00Z",
      "updatedAt": "2026-02-17T10:00:00Z"
    }
  ],
  "message": "Tasks retrieved successfully"
}
```

#### Create Task

```http
POST /tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "My Task",
  "description": "Task description",
  "status": "pending"
}

Response (201):
{
  "success": true,
  "data": { ...task object },
  "message": "Task created successfully"
}
```

#### Update Task

```http
PUT /tasks/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated Description",
  "status": "in_progress"
}

Response (200):
{
  "success": true,
  "data": { ...updated task },
  "message": "Task updated successfully"
}
```

#### Delete Task

```http
DELETE /tasks/{id}
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Task deleted successfully"
}
```

## 🔐 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Stateless token-based authentication
- **Protected Routes**: Middleware-protected API endpoints
- **Input Validation**: Server-side validation on all inputs
- **CORS**: Enabled for frontend-backend communication
- **Environment Variables**: Sensitive data stored in .env files

## 📊 Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String(required),
  email: String(required, unique),
  password: String(required, hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Tasks Collection

```javascript
{
  _id: ObjectId,
  title: String(required),
  description: String,
  status: String (enum: ['pending', 'in_progress', 'completed']),
  user: ObjectId(ref: User, required),
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 Frontend Components

### Key Components

- **TaskList**: Display and manage tasks with search/filter
- **TaskForm**: Create and edit tasks
- **ProtectedLayout**: Route protection wrapper
- **AuthContext**: Global authentication state

### Features

- Loading states with spinners
- Error handling with user-friendly messages
- Form validation with error messages
- Responsive design for mobile/tablet/desktop
- Dark mode support via CSS variables

## 🧪 Testing

### Manual Testing

1. Register a new account
2. Login with credentials
3. Create, edit, and delete tasks
4. Search and filter tasks
5. Edit profile
6. Logout

### Postman Collection

Find the Postman collection at: `/docs/postman-collection.json`

## 🚀 Production Deployment

### Frontend Deployment (Vercel)

```bash
cd frontend
npm run build
# Deploy to Vercel
vercel deploy
```

### Backend Deployment (Railway/Heroku)

```bash
cd backend
npm run build
# Set environment variables
# Deploy to hosting platform
```

### Environment Variables

**Backend (.env)**

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/task_dashboard
DATABASE_URL=${MONGODB_URI}
JWT_SECRET=your-strong-secret-key-min-32-chars
JWT_EXPIRES_IN=30d
PORT=5000
NODE_ENV=production
```

**Frontend (.env.local)**

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

## 📈 Scalability Roadmap

### Current Implementation

- Single server instance
- MongoDB connection pooling
- In-memory caching with browser localStorage

### For Production Scaling

#### 1. **Containerization (Docker)**

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/server.js"]
```

#### 2. **Orchestration (Kubernetes)**

- Horizontal Pod Autoscaling
- Load balancing across multiple instances
- Self-healing and rolling updates

#### 3. **Database Optimization**

- MongoDB Atlas Sharding for data distribution
- Read replicas for read-heavy operations
- Connection pooling (already configured)

#### 4. **Caching Layer (Redis)**

```javascript
// Cache user profile
const cachedUser = await redis.get(`user:${userId}`);
```

#### 5. **API Rate Limiting**

```javascript
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);
```

#### 6. **Refresh Token Strategy**

```javascript
// Short-lived access token (15 min)
// Long-lived refresh token (7 days)
// Implement token rotation on refresh
```

#### 7. **Reverse Proxy (Nginx)**

```nginx
upstream backend {
  server backend-1:5000;
  server backend-2:5000;
  server backend-3:5000;
}

server {
  listen 80;
  location /api {
    proxy_pass http://backend;
  }
}
```

#### 8. **CI/CD Pipeline (GitHub Actions)**

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci && npm test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm run build && docker build -t image:tag .
```

#### 9. **Monitoring & Logging**

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog for performance monitoring
- Sentry for error tracking

#### 10. **Database Backup Strategy**

- Automated daily backups
- Multi-region replication
- Point-in-time recovery

## 🔄 Development Workflow

```bash
# Create feature branch
git checkout -b feature/task-filters

# Make changes and commit
git add .
git commit -m "feat: Add task status filter"

# Push and create PR
git push origin feature/task-filters
```

## 📝 Code Quality

- **ESLint**: Configured for consistent code style
- **TypeScript**: Type safety throughout
- **Error Handling**: Comprehensive try-catch blocks
- **Validation**: Input validation on every endpoint

## 🐛 Troubleshooting

### Backend Connection Issues

```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/task_dashboard"

# Check if backend is running
curl http://localhost:5000/api/
```

### Frontend API Errors

```javascript
// Check browser console for errors
// Verify API_URL is correct
// Ensure JWT token is stored properly
```

## 📄 License

MIT

## 👥 Contributors

- Sayyad Mohd Imdad

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

_Built with Next.js, Express.js, MongoDB, and TailwindCSS_
