# Deployment Guide

Complete deployment guide for OCPP Central across different environments.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Development](#development)
- [Staging](#staging)
- [Production](#production)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)
- [Health Checks](#health-checks)

## Environment Setup

### Prerequisites

- Node.js 18+ LTS
- MongoDB 7.0+
- Redis 7+ (optional but recommended)
- Docker & Docker Compose (for containerized deployment)

### Environment Files

The application supports multiple environment configurations:

- `.env.development` - Local development
- `.env.staging` - Staging/QA environment
- `.env.production` - Production environment
- `.env.test` - Testing environment
- `.env.example` - Template for all environments

**Important:** Never commit actual `.env.*` files to version control. Only `.env.example` should be committed.

## Development

### Local Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd ocppcentral
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env.development
# Edit .env.development with your local settings
```

4. **Start MongoDB and Redis (if using Docker)**
```bash
docker-compose -f docker-compose.dev.yml up -d mongodb redis
```

5. **Run the application**
```bash
npm run dev
# or with auto-reload
npm run dev:watch
```

6. **Access the application**
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs
- Mongo Express: http://localhost:8081 (admin/admin123)

### Using Docker Compose for Development

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down -v
```

## Staging

### Setup

1. **Create staging environment file**
```bash
cp .env.example .env.staging
```

2. **Configure staging variables**
Edit `.env.staging` with staging-specific values:
- MongoDB Atlas connection string
- Staging domain URLs
- SendGrid/SMTP credentials
- AWS S3 staging bucket
- Sentry DSN for error tracking

3. **Deploy with Docker Compose**
```bash
# Build and start
docker-compose -f docker-compose.staging.yml up -d --build

# View logs
docker-compose -f docker-compose.staging.yml logs -f

# Scale application instances
docker-compose -f docker-compose.staging.yml up -d --scale app=2
```

### Staging Checklist

- [ ] SSL certificates configured
- [ ] MongoDB authentication enabled
- [ ] Redis password set
- [ ] Nginx reverse proxy configured
- [ ] CORS configured for staging domain
- [ ] Rate limiting enabled
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place

## Production

### Pre-deployment Checklist

- [ ] All secrets rotated and secure
- [ ] MongoDB Atlas production cluster configured
- [ ] Redis production instance (AWS ElastiCache recommended)
- [ ] SSL/TLS certificates obtained
- [ ] CDN configured (CloudFlare/AWS CloudFront)
- [ ] Load balancer configured
- [ ] Auto-scaling policies set
- [ ] Monitoring alerts configured (Sentry, New Relic)
- [ ] Backup and disaster recovery plan
- [ ] Security audit completed

### Deployment Steps

1. **Create production environment file**
```bash
cp .env.example .env.production
```

2. **Configure production variables**
- Use strong, randomly generated secrets (minimum 32 characters)
- Configure production MongoDB URI (MongoDB Atlas recommended)
- Set production domain URLs
- Configure production email service
- Set production API keys
- Enable all security features

3. **Build Docker image**
```bash
docker build -t ocppcentral:latest -t ocppcentral:v1.0.0 .
```

4. **Deploy with Docker Compose**
```bash
# Deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Production Deployment Options

#### Option 1: Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml ocppcentral

# Scale services
docker service scale ocppcentral_app=5

# Update service
docker service update --image ocppcentral:v1.0.1 ocppcentral_app
```

#### Option 2: Kubernetes

```bash
# Create namespace
kubectl create namespace ocppcentral

# Create secrets
kubectl create secret generic ocppcentral-secrets \
  --from-env-file=.env.production \
  -n ocppcentral

# Deploy
kubectl apply -f k8s/ -n ocppcentral

# Scale deployment
kubectl scale deployment ocppcentral-app --replicas=5 -n ocppcentral
```

#### Option 3: AWS ECS/Fargate

1. Push image to ECR
2. Create ECS task definition
3. Configure ALB/NLB
4. Deploy service with auto-scaling

#### Option 4: Traditional VPS/Server

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone and setup
git clone <repository-url>
cd ocppcentral
npm install --production

# Start with PM2
pm2 start npm --name "ocppcentral" -- start:production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Environment Variables

### Critical Variables

Must be set for all environments:

```bash
NODE_ENV=production
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<strong-random-secret>
```

### Security Variables

```bash
JWT_SECRET=<minimum-32-character-random-string>
SESSION_SECRET=<minimum-32-character-random-string>
BCRYPT_ROUNDS=12
```

### Database Variables

```bash
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
DB_POOL_SIZE=10
DB_MAX_IDLE_TIME_MS=10000
```

### Redis Variables

```bash
REDIS_HOST=redis-production.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>
REDIS_TLS=true
```

### Email Variables

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
```

### AWS Variables

```bash
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_REGION=us-east-1
AWS_S3_BUCKET=<bucket-name>
```

## Docker Deployment

### Building Images

```bash
# Development
docker build -t ocppcentral:dev .

# Production
docker build --build-arg NODE_ENV=production -t ocppcentral:prod .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t ocppcentral:latest .
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart service
docker-compose restart app

# Execute command in container
docker-compose exec app npm run seed-database

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v
```

## Health Checks

### Application Health Endpoint

Create a health check endpoint:

```javascript
// Add to app.js or create routes/health.js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

### Database Health Check

```javascript
app.get('/health/db', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});
```

### Docker Health Check

Already configured in Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', ...)"
```

## Monitoring & Logging

### Sentry Integration

```javascript
import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}
```

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs ocppcentral

# Flush logs
pm2 flush
```

## Backup & Recovery

### MongoDB Backup

```bash
# Manual backup
mongodump --uri="<mongodb-uri>" --out=/backup/$(date +%Y%m%d)

# Automated backup (cron)
0 2 * * * mongodump --uri="<mongodb-uri>" --out=/backup/$(date +\%Y\%m\%d)
```

### Restore

```bash
mongorestore --uri="<mongodb-uri>" /backup/20240315
```

## SSL/TLS Configuration

### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d api.ocppcentral.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.ocppcentral.com;

    ssl_certificate /etc/letsencrypt/live/api.ocppcentral.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ocppcentral.com/privkey.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB status
docker-compose logs mongodb

# Verify connection string
echo $MONGO_URI
```

**Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Out of Memory**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## Rollback Procedure

### Docker Compose

```bash
# Stop current version
docker-compose down

# Deploy previous version
docker-compose up -d ocppcentral:v1.0.0
```

### PM2

```bash
# List previous deployments
pm2 list

# Revert to previous
pm2 reload ecosystem.config.js --update-env
```

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate secrets regularly** - Every 90 days minimum
3. **Use strong passwords** - Minimum 32 characters for secrets
4. **Enable HTTPS only** - Redirect HTTP to HTTPS
5. **Keep dependencies updated** - Run `npm audit` regularly
6. **Use rate limiting** - Prevent abuse
7. **Enable CORS properly** - Only allow trusted origins
8. **Use helmet.js** - Security headers
9. **Implement logging** - Track all access and errors
10. **Regular backups** - Automated daily backups

## Support

For deployment issues:
- Check logs: `docker-compose logs -f`
- Review documentation
- Contact DevOps team
