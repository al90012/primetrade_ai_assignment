# Production Scalability Guide

## Overview

This document outlines strategies to transform the current application into a production-grade, scalable system that can handle millions of requests and terabytes of data.

## Current Architecture

- **Single server** running Node.js backend
- **MongoDB** connection pooling
- **Browser-side** token storage
- **No caching layer**
- **No rate limiting**
- **No monitoring**

## Phase 1: Containerization & Orchestration

### 1.1 Docker Setup

**Backend Dockerfile:**

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 5000
USER node
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

**Frontend Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/.next ./.next
COPY package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["serve", "-s", ".next", "-l", "3000"]
```

**docker-compose.yml:**

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:6
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password@mongodb:27017/task_dashboard?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:5000/api
    depends_on:
      - backend
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  mongodb_data:
```

### 1.2 Kubernetes Deployment

**backend-deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend-api
  template:
    metadata:
      labels:
        app: backend-api
    spec:
      containers:
        - name: api
          image: your-registry/backend:latest
          ports:
            - containerPort: 5000
          env:
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: backend-secrets
                  key: mongodb-uri
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/
              port: 5000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/
              port: 5000
            initialDelaySeconds: 5
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend-api
  ports:
    - port: 80
      targetPort: 5000
  type: LoadBalancer

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Phase 2: Caching Strategy

### 2.1 Redis Caching

**Install Redis in production:**

```bash
npm install redis ioredis
```

**Cache Layer Implementation:**

```typescript
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },

  async set<T>(key: string, value: T, ttl = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error("Cache set error:", error);
    }
  },

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error("Cache invalidate error:", error);
    }
  },
};
```

**Apply caching to task retrieval:**

```typescript
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?._id;
  const cacheKey = `tasks:${userId}:${JSON.stringify(req.query)}`;

  try {
    // Check cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return sendSuccess(res, 200, cached, 'Tasks retrieved from cache');
    }

    // Fetch from DB
    const tasks = await Task.find({...}).sort({createdAt: -1});

    // Cache for 10 minutes
    await cacheService.set(cacheKey, tasks, 600);

    sendSuccess(res, 200, tasks, 'Tasks retrieved successfully');
  } catch (error: any) {
    sendError(res, 500, 'Server error', [error.message]);
  }
};
```

## Phase 3: Rate Limiting & Security

### 3.1 API Rate Limiting

```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: "rate-limit:",
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/", limiter);
app.use("/api/tasks/", limiter);
```

### 3.2 CORS & Security Headers

```typescript
import helmet from "helmet";
import cors from "cors";

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);
```

## Phase 4: Database Optimization

### 4.1 MongoDB Atlas Setup

1. Create a cluster on MongoDB Atlas
2. Enable automatic backups
3. Set up read replicas for distribution

**Connection String:**

```
mongodb+srv://username:password@cluster.mongodb.net/task_dashboard?retryWrites=true&w=majority
```

### 4.2 Indexing Strategy

```typescript
// In User model
UserSchema.index({ email: 1 });

// In Task model
TaskSchema.index({ user: 1, createdAt: -1 });
TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ title: "text", description: "text" });
```

### 4.3 Connection Pooling

```typescript
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  maxIdleTimeMS: 30000,
});
```

## Phase 5: Authentication Improvements

### 5.1 Refresh Token Strategy

```typescript
// Generate tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
};

// Refresh endpoint
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.id,
    );

    sendSuccess(res, 200, { accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    sendError(res, 401, "Invalid refresh token");
  }
};
```

## Phase 6: Monitoring & Logging

### 6.1 Winston Logger

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

export default logger;
```

### 6.2 Monitoring Stack

**docker-compose addition:**

```yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  depends_on:
    - prometheus
```

## Phase 7: CI/CD Pipeline

### 7.1 GitHub Actions Workflow

**.github/workflows/deploy.yml:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:6
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Run linter
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint

      - name: Run tests
        run: |
          cd backend && npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Build Docker images
        run: |
          docker build -t backend:${{ github.sha }} ./backend
          docker build -t frontend:${{ github.sha }} ./frontend

      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker tag backend:${{ github.sha }} myregistry/backend:latest
          docker tag frontend:${{ github.sha }} myregistry/frontend:latest
          docker push myregistry/backend:latest
          docker push myregistry/frontend:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/backend-api api=myregistry/backend:latest
          kubectl set image deployment/frontend frontend=myregistry/frontend:latest
```

## Phase 8: Infrastructure as Code

### 8.1 Terraform Configuration

```hcl
# terraform/main.tf
provider "aws" {
  region = "us-east-1"
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "task-app-cluster"
}

# Load Balancer
resource "aws_lb" "main" {
  name               = "task-app-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  subnets            = aws_subnet.public[*].id
}

# RDS Database
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "task-app-cluster"
  engine                  = "aurora-mongodb"
  database_name           = "task_dashboard"
  master_username         = "admin"
  master_password         = random_password.db_password.result
  backup_retention_period = 30
  preferred_backup_window = "03:00-04:00"
}
```

## Scaling Metrics & Targets

### Expected Performance

| Metric           | Current | Target   |
| ---------------- | ------- | -------- |
| Requests/sec     | 100     | 10,000+  |
| Response time    | ~200ms  | <100ms   |
| Availability     | 99%     | 99.99%   |
| Concurrent users | 100     | 100,000+ |
| Data storage     | GB      | TB       |

### Auto-scaling Thresholds

- **CPU Utilization**: Scale up at 70%, down at 30%
- **Memory**: Scale up at 80%, down at 50%
- **Request latency**: Scale up if >500ms for 2 minutes
- **Error rate**: Scale up if >5% for 2 minutes

## Security Checklist

- [ ] Enable HTTPS/SSL everywhere
- [ ] Implement WAF (Web Application Firewall)
- [ ] Set up DDoS protection
- [ ] Enable database encryption at rest
- [ ] Configure backup encryption
- [ ] Implement secrets rotation
- [ ] Set up audit logging
- [ ] Regular security scans
- [ ] Penetration testing
- [ ] Compliance audits (GDPR, SOC 2, etc.)

## Cost Optimization

1. **Caching**: Reduces database hits by 60-80%
2. **CDN**: Reduces bandwidth costs by 50%
3. **Reserved instances**: 60% savings vs on-demand
4. **Auto-scaling**: Pay only for needed resources
5. **Multi-region**: Reduce latency, improve reliability

## Estimated Production Costs (Monthly)

| Component                | Dev     | Prod       |
| ------------------------ | ------- | ---------- |
| Compute (Kubernetes)     | $50     | $800       |
| Database (MongoDB Atlas) | $10     | $500       |
| Cache (Redis)            | $0      | $100       |
| CDN                      | $0      | $200       |
| Monitoring               | $0      | $100       |
| **Total**                | **$60** | **$1,700** |

## Conclusion

Following this roadmap transforms the application from a single-server setup to an enterprise-grade system capable of:

- Handling millions of requests daily
- 99.99% uptime
- Sub-100ms response times
- Automatic scaling
- Zero-downtime deployments
- Comprehensive monitoring
- Full disaster recovery

Each phase should be implemented based on growth metrics and requirements.
