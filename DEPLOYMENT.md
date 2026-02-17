# Deployment & Setup Guide

## Local Development Setup

### Prerequisites

Ensure you have installed:

- Node.js 18+ ([download](https://nodejs.org))
- MongoDB Community Edition ([download](https://www.mongodb.com/try/download/community)) or MongoDB Atlas account
- Git
- npm or yarn

### Quick Setup (5 minutes)

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/primetrade-ai.git
cd primetrade-ai
```

2. **Backend setup**

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/task_dashboard
DATABASE_URL=${MONGODB_URI}
JWT_SECRET=your_development_secret_key_here
JWT_EXPIRES_IN=30d
PORT=5000
NODE_ENV=development
EOF

# Start MongoDB (if local)
# mongod --dbpath ./data

# Start development server
npm run dev
```

3. **Frontend setup** (in new terminal)

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF

# Start development server
npm run dev
```

4. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Test with credentials:
  - Email: test@example.com
  - Password: TestPassword123

---

## Docker Deployment (Recommended for Development)

### Quick Docker Start

1. **Ensure Docker is installed**

```bash
docker --version
docker-compose --version
```

2. **Create docker-compose.yml** in project root

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:6-alpine
    container_name: task-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: task_dashboard
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: task-backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://mongodb:27017/task_dashboard
      JWT_SECRET: development_secret_key
      JWT_EXPIRES_IN: 30d
      PORT: 5000
    depends_on:
      mongodb:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: task-frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000/api
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongodb_data:
```

3. **Start all services**

```bash
docker-compose up -d
```

4. **View logs**

```bash
docker-compose logs -f
```

5. **Stop services**

```bash
docker-compose down
```

---

## Cloud Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend Deployment to Vercel

1. **Sign up** at https://vercel.com
2. **Import your GitHub repository**
3. **Set environment variables**

```
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.com/api
```

4. **Deploy** - Vercel automatically builds and deploys on every push

#### Backend Deployment to Railway

1. **Sign up** at https://railway.app
2. **Create new project**
3. **Add MongoDB**

```bash
# Railway provides a MongoDB connection string
# Copy it to your environment variables
```

4. **Deploy backend**

```bash
# Connect your GitHub repo
# Set environment variables
MONGODB_URI=<railway-mongodb-connection-string>
JWT_SECRET=<your-secret>
NODE_ENV=production
```

### Option 2: Heroku Deployment (Legacy but still works)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create backend app
heroku create your-app-name-backend
git push heroku main

# Set environment variables
heroku config:set MONGODB_URI=<your-mongodb-uri>
heroku config:set JWT_SECRET=<your-secret>

# View logs
heroku logs --tail
```

### Option 3: AWS Deployment

#### Using Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli --upgrade --user

# Initialize
eb init -p node.js-18 primetrade-backend -r us-east-1

# Create environment
eb create primetrade-env

# Deploy
eb deploy

# Set environment variables
eb setenv MONGODB_URI=<your-mongodb-uri> JWT_SECRET=<your-secret>
```

### Option 4: Digital Ocean App Platform

1. **Sign up** at https://www.digitalocean.com
2. **Create App**
3. **Connect GitHub repository**
4. **Configure build and run commands**

```yaml
# Backend
Build command: npm ci && npm run build
Run command: node dist/server.js

# Frontend
Build command: npm ci && npm run build
Run command: npm start
```

5. **Set environment variables**
6. **Deploy**

---

## Production Environment Variables

### Backend Production (.env)

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task_dashboard?retryWrites=true&w=majority
DATABASE_URL=${MONGODB_URI}

# JWT
JWT_SECRET=your_very_long_and_secure_secret_key_min_32_characters
JWT_EXPIRES_IN=30d

# Server
PORT=5000
NODE_ENV=production

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=https://your-frontend-domain.com

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Frontend Production (.env.production)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_APP_ENV=production
```

---

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. **Create account** at https://www.mongodb.com/cloud/atlas
2. **Create cluster**
   - Choose Free tier for development
   - Select region closest to your users
3. **Configure username/password**
4. **Get connection string**
5. **Whitelist IP addresses** (or use 0.0.0.0 for development only)

### Local MongoDB

```bash
# macOS (Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu)
sudo apt-get install -y mongodb
sudo systemctl start mongod

# Windows (MSI Installer)
# Download and install from https://www.mongodb.com/try/download/community

# Connect
mongosh
```

---

## HTTPS/SSL Configuration

### Using Let's Encrypt with Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Health Checks & Monitoring

### Health Check Endpoint

Add to backend (src/server.ts):

```typescript
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});
```

### Database Health Check

```typescript
app.get("/api/health/db", async (req, res) => {
  try {
    await mongoose.connection.db!.admin().ping();
    res.status(200).json({ database: "connected" });
  } catch (error) {
    res.status(503).json({ database: "disconnected", error: error });
  }
});
```

---

## Performance Optimization

### Caching Headers (Nginx)

```nginx
location ~* \.(js|css|png|jpg|gif|ico|svg|woff|woff2)$ {
    expires 1mo;
    add_header Cache-Control "public, immutable";
}

location / {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### Gzip Compression

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1000;
gzip_types text/plain text/css text/xml text/javascript
           application/x-javascript application/xml+rss
           application/javascript application/json;
```

---

## Backup & Disaster Recovery

### MongoDB Backup

```bash
# Local backup
mongodump --uri="mongodb://localhost:27017/task_dashboard" --out ./backup

# Restore
mongorestore --uri="mongodb://localhost:27017" ./backup

# MongoDB Atlas: Automated backups every 12 hours (included in Atlas)
```

### Database Replication (Production)

```javascript
// In MongoDB Atlas, configure read replicas in 3+ regions
// Automatic failover enabled
// Backup retention: 30 days
```

---

## Troubleshooting

### Connection Issues

```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017"

# Test backend API
curl http://localhost:5000/api/

# Check logs
docker-compose logs backend
```

### Performance Issues

```bash
# Monitor MongoDB
db.currentOp()
db.stats()

# Check Node.js memory
node --inspect dist/server.js

# Use clinic.js
npm install -g clinic
clinic doctor -- node dist/server.js
```

### CORS Errors

Update backend (src/server.ts):

```typescript
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Development
      "https://yourdomain.com", // Production
    ],
    credentials: true,
  }),
);
```

---

## Continuous Deployment

### GitHub Actions (Automatic Deployment)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy backend to Railway
        run: |
          curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }} \
            -H "Authorization: Bearer ${{ secrets.RAILWAY_TOKEN }}"

      - name: Deploy frontend to Vercel
        run: |
          npm install -g vercel
          vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## Rollback Procedures

### If deployment fails

```bash
# Vercel: Automatic rollback available in dashboard
# Railway: Use previous deployment version
# Heroku: heroku releases && heroku rollback v123
```

---

## Monitoring & Alerts

### Critical Alerts to Configure

1. **API response time** > 1 second
2. **Error rate** > 1%
3. **Database latency** > 500ms
4. **Server CPU** > 80%
5. **Memory** > 90%
6. **Disk space** < 10%

### Recommended Monitoring Services

- **Sentry**: Error tracking
- **Datadog**: Performance monitoring
- **New Relic**: APM
- **PagerDuty**: Incident management

---

## Maintenance Checklist

- [ ] Daily: Check error logs
- [ ] Weekly: Review performance metrics
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit
- [ ] Yearly: Disaster recovery drill

---

## Support & Documentation

- API Docs: See `/docs/api.md`
- Architecture: See `/SCALABILITY.md`
- Local setup: This file
- Contributing: See `/CONTRIBUTING.md`

For questions or issues, open a GitHub issue!
