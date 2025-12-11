# Architecture Overview

High-level architecture and system design of the AI Microlearning LMS.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (Next.js 15)                     │
│  ┌────────────────────┐  ┌────────────────────┐          │
│  │  Learner Canvas    │  │  Admin Console     │          │
│  │  - Chat Interface  │  │  - Ingestion Mgmt  │          │
│  │  - Media Widgets   │  │  - File Management │          │
│  │  - Voice I/O       │  │  - Settings        │          │
│  │  - Progress Panel  │  │  - Analytics       │          │
│  └────────────────────┘  └────────────────────┘          │
└───────────────────────────────┬───────────────────────────┘
                                │ HTTP/WebSocket
┌───────────────────────────────▼───────────────────────────┐
│            Next.js API Routes (Node.js)                   │
│  - Authentication (JWT)                                    │
│  - Content Ingestion API                                    │
│  - Learning Delivery API                                   │
│  - Admin API                                               │
└───────────────────────────────┬───────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼──────┐      ┌─────────▼────────┐    ┌───────▼──────┐
│   Content    │      │    Learning      │    │     AI       │
│  Processing  │      │    Delivery     │    │   Services   │
│   Service    │      │    Service      │    │              │
│              │      │                  │    │  - GPT-4o    │
│  - File      │      │  - Session Mgmt │    │  - Embeddings│
│    watcher   │      │  - AI Tutor     │    │  - TTS/STT   │
│  - URL       │      │  - Progress     │    │  - DALL-E 3  │
│    monitor   │      │    Tracking     │    │              │
│  - Chunking  │      │                  │    │              │
│  - Embedding │      │                  │    │              │
└───────┬──────┘      └─────────┬────────┘    └───────┬──────┘
        │                       │                       │
┌───────▼───────────────────────▼───────────────────────▼───┐
│         Background Job Queue (BullMQ + Redis)             │
│  - Ingestion jobs                                          │
│  - Content generation jobs                                 │
│  - Multimedia generation jobs                              │
└───────────────────────────────┬───────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────┐
│         PostgreSQL + pgvector                              │
│  - Nuggets, Learners, Sessions                            │
│  - Narrative nodes, Analytics                             │
│  - System settings, Jobs                                  │
│  - Vector embeddings for semantic search                  │
└───────────────────────────────┬───────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────┐
│                    File Storage                            │
│  - Raw content (uploads/)                                 │
│  - Generated media (images, audio)                         │
└───────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.0
- **Icons:** Heroicons v2
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion
- **Date Utilities:** date-fns

### Backend

- **Runtime:** Node.js 20+ LTS
- **Framework:** Next.js API Routes
- **ORM:** Prisma
- **Database:** PostgreSQL 15+ with pgvector
- **Job Queue:** BullMQ + Redis
- **File Watching:** chokidar
- **Web Scraping:** cheerio

### AI Services

- **LLM:** OpenAI GPT-4o, GPT-4o Mini
- **Embeddings:** OpenAI text-embedding-3-small/large
- **Image Generation:** DALL-E 3
- **Speech-to-Text:** OpenAI Whisper
- **Text-to-Speech:** OpenAI TTS (standard/HD), ElevenLabs

### Infrastructure

- **Process Manager:** PM2
- **Reverse Proxy:** Nginx (optional)
- **Logging:** Winston
- **Testing:** Jest, React Testing Library, Playwright

## Core Components

### 1. Content Ingestion Service

**Purpose:** Transform raw content into learning nuggets

**Components:**

- File Watcher Service - Monitors folders for new files
- URL Monitor Service - Periodically checks URLs for updates
- Text Extractor - Extracts text from PDF, DOCX, TXT, URLs
- Semantic Chunker - Splits content into coherent chunks
- Embedding Generator - Creates vector embeddings
- Metadata Extractor - Extracts topics, difficulty, prerequisites
- Image Generator - Creates DALL-E 3 images for concepts

**Flow:**

```
Raw Content → Text Extraction → Semantic Chunking →
Embedding Generation → Metadata Extraction →
Image Generation → Nugget Creation
```

### 2. Learning Delivery Service

**Purpose:** Deliver personalized learning experiences

**Components:**

- AI Tutor Service - Conversational AI with tool calling
- Session Manager - Manages learning sessions
- Progress Tracker - Tracks mastery and knowledge gaps
- Narrative Planner - Creates adaptive learning paths

**Flow:**

```
User Message → AI Tutor → Tool Execution →
Response Generation → Progress Update →
Narrative Adaptation
```

### 3. Admin Console

**Purpose:** System management and monitoring

**Features:**

- Content Ingestion Management
- File Upload and Management
- Settings Configuration (AI models, voice, API keys)
- Nugget Store (browse, edit, regenerate)
- Analytics Dashboard

## Data Flow

### Content Ingestion Flow

1. **File Upload or Folder Watch**
   - File uploaded via admin interface OR
   - File detected in watched folder

2. **Job Creation**
   - Ingestion job created in database
   - Job queued in BullMQ

3. **Processing**
   - Worker picks up job
   - Text extraction
   - Semantic chunking
   - Embedding generation
   - Metadata extraction
   - Image generation

4. **Nugget Creation**
   - Nuggets created from chunks
   - Linked to source file/URL
   - Status updated to "ready"

### Learning Session Flow

1. **Session Creation**
   - Learner creates new session
   - Session record created

2. **Message Processing**
   - User sends message
   - AI Tutor processes with context
   - Tools executed as needed
   - Response generated

3. **Progress Update**
   - Mastery levels updated
   - Knowledge gaps identified
   - Narrative path adapted

## Database Schema

### Core Models

- **Organization** - Multi-tenant organization
- **User** - System users (admin, learner)
- **Learner** - Learner profiles with mastery maps
- **Nugget** - Learning content chunks
- **NarrativeNode** - Narrative path nodes
- **Session** - Learning sessions
- **Message** - Conversation messages
- **Progress** - Mastery and progress tracking

### Ingestion Models

- **WatchedFolder** - Monitored folders
- **MonitoredURL** - Monitored URLs
- **IngestionJob** - Processing jobs
- **NuggetSource** - Source tracking

### Configuration Models

- **SystemSetting** - Key-value settings
- **AIModelConfig** - AI model configuration
- **VoiceConfig** - Voice/TTS configuration

See [Database Schema](DATABASE_SCHEMA.md) for detailed schema.

## Security

### Authentication

- JWT-based authentication
- Token expiration (3 days default)
- Password hashing with bcrypt

### Authorization

- Role-based access control (RBAC)
- Admin, learner roles
- Organization-level isolation

### Data Protection

- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection (React)
- File upload validation

## Performance

### Optimization Strategies

- Database query optimization
- Redis caching
- Background job processing
- Code splitting
- Image optimization

### Scalability

- Horizontal scaling with PM2
- Database connection pooling
- Redis for session storage
- CDN for static assets (future)

## Monitoring

### Logging

- Winston structured logging
- Error tracking
- Performance metrics

### Health Checks

- Database connectivity
- Redis connectivity
- External API status

## Deployment

See [Deployment Guide](DEPLOYMENT.md) for production deployment instructions.

## Related Documentation

- [API Reference](API_REFERENCE.md) - API endpoints
- [Database Schema](DATABASE_SCHEMA.md) - Database structure
- [Content Ingestion](CONTENT_INGESTION.md) - Ingestion details
- [AI Integration](AI_INTEGRATION.md) - AI services
