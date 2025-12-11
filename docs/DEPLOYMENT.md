# Deployment Guide

Complete guide for deploying the AI Microlearning LMS to production.

## Prerequisites

- Production server (VM, cloud instance, etc.)
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- PostgreSQL 15+ with pgvector
- Redis 6+
- Node.js 20+ LTS
- PM2 (process manager)

## Pre-Deployment Checklist

- [ ] All tests passing (100% pass rate)
- [ ] Code coverage ≥ 90%
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate obtained
- [ ] Domain DNS configured
- [ ] Backup strategy in place

## Server Setup

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install pgvector
sudo apt install postgresql-15-pgvector

# Install Redis
sudo apt install redis-server

# Install PM2
sudo npm install -g pm2

# Install Nginx (optional)
sudo apt install nginx
```

### 2. Database Setup

```bash
# Create database
sudo -u postgres createdb ai_microlearning_lms

# Enable pgvector
sudo -u postgres psql ai_microlearning_lms -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Create database user
sudo -u postgres psql -c "CREATE USER lms_user WITH PASSWORD 'secure-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_microlearning_lms TO lms_user;"
```

### 3. Application Setup

```bash
# Clone repository
git clone https://github.com/fourtytwo42/ai-nuggets-lms.git
cd ai-nuggets-lms

# Install dependencies
npm install

# Build application
npm run build
```

### 4. Environment Configuration

Create `.env` file:

```env
# Database
DATABASE_URL="postgresql://lms_user:secure-password@localhost:5432/ai_microlearning_lms"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="change-this-to-secure-random-string"
JWT_EXPIRES_IN="3d"

# OpenAI
OPENAI_API_KEY="sk-..."

# Optional: ElevenLabs
ELEVENLABS_API_KEY=""

# Storage
STORAGE_PATH="/var/www/ai-lms/storage"

# Server
PORT=3000
NODE_ENV="production"
LOG_LEVEL="warn"

# Domain (if using custom domain)
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 5. Database Migrations

```bash
# Run migrations
npm run db:migrate

# Generate Prisma Client
npm run db:generate
```

## PM2 Configuration

### Start Application

```bash
# Start application
pm2 start npm --name "ai-lms" -- start

# Start worker
pm2 start npm --name "ai-lms-worker" -- run worker

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided
```

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs ai-lms
pm2 logs ai-lms-worker

# Restart
pm2 restart ai-lms

# Stop
pm2 stop ai-lms

# Delete
pm2 delete ai-lms
```

## Nginx Configuration

### Reverse Proxy Setup

Create `/etc/nginx/sites-available/ai-lms`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File upload size limit
    client_max_body_size 50M;
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/ai-lms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

## Storage Setup

```bash
# Create storage directory
sudo mkdir -p /var/www/ai-lms/storage/uploads
sudo chown -R $USER:$USER /var/www/ai-lms/storage
```

## Monitoring

### PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Health Checks

Create health check endpoint or use PM2 monitoring:

```bash
# Check application status
curl http://localhost:3000/api/health

# Check PM2 status
pm2 status
```

## Backup Strategy

### Database Backup

```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/var/backups/ai-lms"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump ai_microlearning_lms > "$BACKUP_DIR/db_$DATE.sql"

# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/backup-script.sh
```

### File Storage Backup

```bash
# Backup storage directory
tar -czf /var/backups/ai-lms/storage_$(date +%Y%m%d).tar.gz /var/www/ai-lms/storage
```

## Updates and Maintenance

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Rebuild
npm run build

# Restart PM2
pm2 restart ai-lms
pm2 restart ai-lms-worker
```

### Database Migrations

```bash
# Create migration
npm run db:migrate:dev --name migration_name

# Apply migration
npm run db:migrate
```

## Security

### Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Environment Variables

- Never commit `.env` file
- Use strong JWT_SECRET
- Rotate API keys regularly
- Use environment-specific configs

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs ai-lms --lines 100

# Check application logs
tail -f /var/log/ai-lms/app.log

# Verify environment variables
pm2 env ai-lms
```

### Database Connection Issues

```bash
# Test connection
psql -U lms_user -d ai_microlearning_lms

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Redis Connection Issues

```bash
# Test connection
redis-cli ping

# Check Redis status
sudo systemctl status redis
```

## Performance Optimization

### Database Optimization

- Add indexes for frequently queried fields
- Use connection pooling
- Monitor slow queries

### Caching

- Enable Redis caching
- Cache embeddings
- Cache API responses

### Load Balancing

- Use multiple PM2 instances
- Configure Nginx load balancing
- Use Redis for session storage

## Related Documentation

- [Installation Guide](INSTALLATION.md) - Setup instructions
- [Architecture Overview](ARCHITECTURE.md) - System design
