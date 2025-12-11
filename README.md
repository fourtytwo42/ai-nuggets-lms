# AI Microlearning LMS

Zero-human-authoring adaptive microlearning platform that transforms raw content into interactive, multimedia learning nuggets with AI-powered tutoring.

## Features

- **Zero Human Authoring:** Fully automated content creation and transformation
- **Adaptive Learning:** Choose-your-own-adventure style narrative paths
- **AI Tutoring:** Conversational AI with organic assessment
- **Multimedia Rich:** AI-generated images and audio for each learning nugget
- **Semantic Search:** Vector-based content discovery using pgvector
- **File Upload & Management:** Direct file upload with automatic processing
- **Content Ingestion:** Watch folders and monitor URLs for automatic content ingestion
- **Admin Console:** Comprehensive admin interface for system management
- **Authentication System:** JWT-based auth with role-based access control

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4.0
- **Backend:** Node.js 20 LTS, Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL 15+ with pgvector extension
- **Job Queue:** BullMQ + Redis
- **AI:** OpenAI GPT-5.1 Mini/Nano, DALL-E 3, Whisper, TTS
- **Testing:** Jest, React Testing Library, Playwright

## Getting Started

### Prerequisites

- Node.js 20+ LTS
- PostgreSQL 15+ with pgvector extension
- Redis

### Installation

1. Clone the repository:
```bash
git clone https://github.com/fourtytwo42/ai-nuggets-lms.git
cd ai-nuggets-lms
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create database and enable pgvector
createdb ai_microlearning_lms
psql ai_microlearning_lms -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
npm run db:migrate
```

5. Generate Prisma Client:
```bash
npm run db:generate
```

6. Seed test accounts:
```bash
npm run db:seed
```

7. Start development server:
```bash
npm run dev
```

### Test Accounts

After seeding, you can log in with:
- **Admin:** `admin@test.com` / `admin123`
- **Learner:** `learner@test.com` / `learner123`
- **User:** `user@test.com` / `user123`

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format
```

## Project Structure

```
ai-nuggets-lms/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── admin/         # Admin API endpoints
│   │       ├── files/     # File management
│   │       ├── ingestion/ # Content ingestion
│   │       └── settings/  # System settings
│   ├── (app)/             # Protected app routes
│   │   ├── admin/         # Admin interface
│   │   │   ├── files/     # File management page
│   │   │   ├── ingestion/ # Content ingestion page
│   │   │   ├── settings/  # Settings page
│   │   │   └── nuggets/   # Nugget management
│   │   ├── dashboard/     # User dashboard
│   │   └── learning/      # Learning interface
│   ├── login/             # Login page
│   └── register/          # Registration page
├── src/
│   ├── lib/               # Utilities and helpers
│   │   ├── auth/          # Authentication (JWT, password, middleware)
│   │   ├── db/            # Database utilities
│   │   ├── ai/            # AI integrations (embeddings)
│   │   ├── errors.ts      # Error handling
│   │   └── logger.ts      # Logging
│   ├── services/          # Business logic services
│   │   ├── content-ingestion/ # Content processing
│   │   ├── jobs/          # Job queue definitions
│   │   └── learning-delivery/ # Learning services (future)
│   └── workers/           # Background workers
├── prisma/                # Database schema and migrations
├── tests/                 # Test files
├── storage/               # File storage
│   └── uploads/          # Uploaded files
└── docs/                  # Project documentation
```

## License

MIT

