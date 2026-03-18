# Environment Configuration Guide

Complete guide for setting up and managing environment configurations for OCPP Central.

## Overview

OCPP Central uses environment-specific configuration files to manage different deployment environments:

- **Development** (`.env.development`) - Local development with debugging enabled
- **Staging** (`.env.staging`) - Pre-production testing environment
- **Production** (`.env.production`) - Live production environment
- **Test** (`.env.test`) - Automated testing environment

## Quick Start

### 1. Choose Your Environment

```bash
# Development
cp .env.example .env.development

# Staging
cp .env.example .env.staging

# Production
cp .env.example .env.production
```

### 2. Configure Required Variables

Edit your environment file and set these **required** variables:

```bash
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/ocppcentral_dev

# JWT Secret (use strong random string)
JWT_SECRET=your-secret-key-here

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Run the Application

```bash
# Development
npm run dev

# Development with auto-reload
npm run dev:watch

# Staging
npm run start:staging

# Production
npm run start:production
```

## Environment Variables Reference

### Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Environment name |
| `PORT` | No | 3000 | HTTP server port |
| `HOST` | No | localhost | Server host |

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | Yes | - | MongoDB connection string |
| `DB_POOL_SIZE` | No | 10 | Connection pool size |
| `DB_MAX_IDLE_TIME_MS` | No | 10000 | Max idle time |

**MongoDB URI Examples:**

```bash
# Local MongoDB
MONGO_URI=mongodb://rootuser:securepassword@localhost:27017/ocppcentral?authSource=admin

# MongoDB with authentication
MONGO_URI=mongodb://username:password@localhost:27017/ocppcentral_dev

# MongoDB Atlas
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/ocppcentral?retryWrites=true&w=majority
```

### Authentication & Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret for JWT tokens |
| `JWT_EXPIRES_IN` | No | 7d | Token expiration time |
| `SESSION_SECRET` | No | - | Session secret key |
| `BCRYPT_ROUNDS` | No | 10 | Password hashing rounds |

**Security Best Practices:**

```bash
# Generate strong secrets (Linux/Mac)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Minimum 32 characters for production
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### OCPP Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OCPP_PORT` | No | 8080 | WebSocket server port |
| `OCPP_HOST` | No | 0.0.0.0 | WebSocket host |
| `OCPP_PROTOCOL` | No | ws | Protocol (ws/wss) |

### Frontend Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FRONTEND_URL` | Yes | - | Allowed frontend origins (comma-separated) |

**Examples:**

```bash
# Development (multiple origins)
FRONTEND_URL=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Staging
FRONTEND_URL=https://staging.ocppcentral.com

# Production
FRONTEND_URL=https://app.ocppcentral.com,https://www.ocppcentral.com
```

### Email Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | No | - | SMTP server host |
| `SMTP_PORT` | No | 587 | SMTP server port |
| `SMTP_SECURE` | No | false | Use TLS |
| `SMTP_USER` | No | - | SMTP username |
| `SMTP_PASS` | No | - | SMTP password |

**Email Service Examples:**

```bash
# SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_api_key_here

# Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Mailtrap (Development)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
```

### AWS S3 Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | No | - | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | No | - | AWS secret key |
| `AWS_REGION` | No | us-east-1 | AWS region |
| `AWS_S3_BUCKET` | No | - | S3 bucket name |

### Redis Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_HOST` | No | localhost | Redis host |
| `REDIS_PORT` | No | 6379 | Redis port |
| `REDIS_PASSWORD` | No | - | Redis password |
| `REDIS_TLS` | No | false | Use TLS |

### Logging

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | info | Log level (debug/info/warn/error) |
| `LOG_FILE` | No | logs/app.log | Log file path |

**Log Levels by Environment:**

```bash
# Development
LOG_LEVEL=debug

# Staging
LOG_LEVEL=info

# Production
LOG_LEVEL=warn
```

### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | No | 60000 | Time window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | No | 100 | Max requests per window |

### Feature Flags

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_SWAGGER` | No | true | Enable API docs |
| `ENABLE_CORS` | No | true | Enable CORS |
| `ENABLE_RATE_LIMITING` | No | true | Enable rate limiting |

**Environment-specific Flags:**

```bash
# Development
ENABLE_SWAGGER=true
ENABLE_RATE_LIMITING=false

# Production
ENABLE_SWAGGER=false
ENABLE_RATE_LIMITING=true
```

### Monitoring & Analytics

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | No | - | Sentry error tracking DSN |
| `NEW_RELIC_LICENSE_KEY` | No | - | New Relic license key |

## Environment-Specific Configurations

### Development Environment

**Characteristics:**
- Verbose logging (debug level)
- Swagger enabled
- Rate limiting disabled
- Local database
- Mock external services

**Recommended Settings:**

```bash
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/ocppcentral_dev
JWT_SECRET=dev-secret-not-for-production
LOG_LEVEL=debug
ENABLE_SWAGGER=true
ENABLE_RATE_LIMITING=false
MOCK_EXTERNAL_APIS=true
```

### Staging Environment

**Characteristics:**
- Production-like setup
- Swagger enabled for testing
- Real external services (test accounts)
- Separate database
- Monitoring enabled

**Recommended Settings:**

```bash
NODE_ENV=staging
PORT=3000
MONGO_URI=mongodb+srv://user:pass@cluster-staging.mongodb.net/ocppcentral_staging
JWT_SECRET=<strong-random-secret-32-chars-minimum>
LOG_LEVEL=info
ENABLE_SWAGGER=true
ENABLE_RATE_LIMITING=true
SENTRY_DSN=https://your-staging-dsn@sentry.io/project
```

### Production Environment

**Characteristics:**
- Minimal logging (warn/error only)
- Swagger disabled
- All security features enabled
- Production database (MongoDB Atlas)
- Full monitoring and alerting

**Recommended Settings:**

```bash
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://user:pass@cluster-prod.mongodb.net/ocppcentral_production
JWT_SECRET=<highly-secure-random-64-char-string>
LOG_LEVEL=warn
ENABLE_SWAGGER=false
ENABLE_RATE_LIMITING=true
HELMET_ENABLED=true
SSL_ENABLED=true
SENTRY_DSN=https://your-production-dsn@sentry.io/project
```

## Security Checklist

### Development
- [ ] Use `.env.development` file
- [ ] Never use production credentials
- [ ] Keep secrets out of version control

### Staging
- [ ] Rotate secrets from development
- [ ] Use separate database
- [ ] Enable SSL/TLS
- [ ] Configure monitoring
- [ ] Test backup/restore procedures

### Production
- [ ] Generate new strong secrets (32+ chars)
- [ ] Use managed database (MongoDB Atlas)
- [ ] Enable all security features
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring and alerts
- [ ] Configure automated backups
- [ ] Enable rate limiting
- [ ] Disable Swagger documentation
- [ ] Use environment variables (never hardcode)
- [ ] Implement proper CORS policies
- [ ] Enable security headers (Helmet)

## Common Patterns

### Multiple Frontend URLs

```bash
# Comma-separated list
FRONTEND_URL=https://app.example.com,https://www.example.com,https://admin.example.com
```

### Database Connection Pooling

```bash
# Production settings
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db?maxPoolSize=50&minPoolSize=10
DB_POOL_SIZE=50
```

### Redis with TLS

```bash
# AWS ElastiCache
REDIS_HOST=master.redis-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_TLS=true
```

## Troubleshooting

### Issue: Environment not loading

**Solution:**
```bash
# Verify file exists
ls -la .env.development

# Check file permissions
chmod 600 .env.development

# Verify NODE_ENV is set
echo $NODE_ENV
```

### Issue: MongoDB connection failed

**Solution:**
```bash
# Test connection string
mongosh "mongodb://localhost:27017/ocppcentral_dev"

# Check MongoDB is running
docker-compose ps mongodb

# Verify network connectivity
ping localhost
```

### Issue: JWT errors

**Solution:**
```bash
# Ensure JWT_SECRET is set
echo $JWT_SECRET

# Generate new secret
openssl rand -base64 32

# Update .env file
JWT_SECRET=<new-secret>
```

## Best Practices

1. **Never commit `.env` files** - Only commit `.env.example`
2. **Use strong secrets** - Minimum 32 characters for production
3. **Rotate secrets regularly** - Every 90 days
4. **Separate environments** - Different databases and secrets per environment
5. **Document changes** - Update `.env.example` when adding new variables
6. **Validate on startup** - Check required variables exist
7. **Use managed services** - MongoDB Atlas, AWS ElastiCache for production
8. **Enable monitoring** - Sentry, New Relic, CloudWatch
9. **Backup configurations** - Store encrypted backups of production configs
10. **Audit access** - Track who has access to production secrets

## Environment Loading Order

The application loads environment variables in this order:

1. System environment variables
2. `.env.{NODE_ENV}` file (e.g., `.env.production`)
3. `.env` file (fallback)
4. Default values in code

## Scripts Reference

```bash
# Development
npm run dev                 # Start with .env.development
npm run dev:watch          # Start with auto-reload

# Staging
npm run start:staging      # Start with .env.staging

# Production
npm run start:production   # Start with .env.production

# Testing
npm run test              # Start with .env.test
```

## Additional Resources

- [MongoDB Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)
- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)

## Support

For environment configuration issues:
- Review this documentation
- Check application logs
- Verify all required variables are set
- Test database connectivity
- Contact DevOps team for production access
