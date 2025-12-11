# Installation Guide

Complete installation instructions for the AI Microlearning LMS.

## System Requirements

### Minimum Requirements

- **Node.js:** 20.0.0 or higher (LTS recommended)
- **PostgreSQL:** 15.0 or higher
- **Redis:** 6.0 or higher
- **RAM:** 4GB minimum (8GB recommended)
- **Disk Space:** 10GB minimum

### Recommended Requirements

- **Node.js:** 20.x LTS
- **PostgreSQL:** 15+ with pgvector extension
- **Redis:** 7.0+
- **RAM:** 16GB
- **Disk Space:** 50GB+ (for file storage)

## Step-by-Step Installation

### 1. Install Prerequisites

#### Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Or download from https://nodejs.org/
```

#### PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### pgvector Extension

```bash
# Ubuntu/Debian
sudo apt install postgresql-15-pgvector

# macOS
brew install pgvector

# Or build from source: https://github.com/pgvector/pgvector
```

#### Redis

```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Windows
# Download from https://redis.io/download
```

### 2. Clone Repository

```bash
git clone https://github.com/fourtytwo42/ai-nuggets-lms.git
cd ai-nuggets-lms
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Configuration

Create `.env` file from example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_microlearning_lms"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key-here-change-in-production"
JWT_EXPIRES_IN="3d"

# OpenAI (Required for AI features)
OPENAI_API_KEY="sk-..."

# Optional: ElevenLabs (for high-quality voice)
ELEVENLABS_API_KEY=""

# Storage
STORAGE_PATH="./storage"

# Server
PORT=3000
NODE_ENV="development"

# Logging
LOG_LEVEL="info"
```

### 5. Database Setup

#### Create Database

```bash
createdb ai_microlearning_lms
```

#### Enable pgvector Extension

```bash
psql ai_microlearning_lms -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### Run Migrations

```bash
npm run db:migrate
```

#### Generate Prisma Client

```bash
npm run db:generate
```

#### Seed Test Data

```bash
npm run db:seed
```

### 6. Start Services

#### Start Redis

```bash
# Linux/Mac
redis-server

# Or as a service
sudo systemctl start redis
```

#### Start Development Server

```bash
npm run dev
```

#### Start Background Worker (separate terminal)

```bash
npm run worker:dev
```

## Production Installation

### 1. Build Application

```bash
npm run build
```

### 2. Set Production Environment

```env
NODE_ENV="production"
LOG_LEVEL="warn"
```

### 3. Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "ai-lms" -- start

# Start worker
pm2 start npm --name "ai-lms-worker" -- run worker

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Configure Nginx (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Verification

### Check Database Connection

```bash
psql ai_microlearning_lms -c "SELECT version();"
psql ai_microlearning_lms -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### Check Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

### Test Application

1. Visit http://localhost:3000
2. Register a new account or login with test account
3. Access admin panel (if admin user)

## Troubleshooting

### Common Issues

**PostgreSQL connection refused:**

- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check connection string in `.env`
- Verify database exists

**pgvector extension not found:**

- Install pgvector package for your PostgreSQL version
- Or build from source: https://github.com/pgvector/pgvector

**Redis connection failed:**

- Ensure Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env`
- Verify Redis is accessible

**Prisma migration errors:**

- Ensure database exists
- Check `DATABASE_URL` is correct
- Run `npm run db:generate` before migrations

**Port already in use:**

- Change `PORT` in `.env`
- Or kill process: `lsof -ti:3000 | xargs kill`

## Next Steps

- Read [Architecture Overview](ARCHITECTURE.md)
- Review [API Reference](API_REFERENCE.md)
- Check [Deployment Guide](DEPLOYMENT.md) for production setup
