# Quick Start Guide

Get the AI Microlearning LMS up and running in minutes.

## Prerequisites

- Node.js 20+ LTS
- PostgreSQL 15+ with pgvector extension
- Redis
- npm or yarn

## Installation

1. **Clone the repository:**

```bash
git clone https://github.com/fourtytwo42/ai-nuggets-lms.git
cd ai-nuggets-lms
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT token signing
- `OPENAI_API_KEY` - OpenAI API key (required for AI features)

4. **Set up the database:**

```bash
# Create database
createdb ai_microlearning_lms

# Enable pgvector extension
psql ai_microlearning_lms -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Seed test data
npm run db:seed
```

5. **Start Redis:**

```bash
# On Linux/Mac
redis-server

# On Windows (if installed)
redis-server
```

6. **Start the development server:**

```bash
npm run dev
```

7. **Start the background worker (in another terminal):**

```bash
npm run worker:dev
```

## Test Accounts

After seeding, you can log in with:

- **Admin:** `admin@test.com` / `admin123`
- **Learner:** `learner@test.com` / `learner123`
- **User:** `user@test.com` / `user123`

## Access the Application

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api

## Next Steps

- Read the [Installation Guide](INSTALLATION.md) for detailed setup
- Check [Architecture Overview](ARCHITECTURE.md) to understand the system
- Review [API Reference](API_REFERENCE.md) for API usage
- See [Admin Interface](ADMIN_INTERFACE.md) for admin features

## Troubleshooting

**Database connection errors:**

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists and pgvector extension is installed

**Redis connection errors:**

- Ensure Redis is running
- Check `REDIS_URL` in `.env`

**Port already in use:**

- Change `PORT` in `.env` or kill the process using port 3000

**Prisma errors:**

- Run `npm run db:generate` after schema changes
- Run `npm run db:migrate` to apply migrations
