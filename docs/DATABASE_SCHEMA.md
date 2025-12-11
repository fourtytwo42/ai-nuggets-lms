# Database Schema

Complete database schema documentation for the AI Microlearning LMS.

## Overview

The system uses PostgreSQL 15+ with the pgvector extension for vector similarity search. All tables are managed through Prisma ORM.

## Core Models

### Organization

Multi-tenant organization model.

```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users     User[]
  nuggets   Nugget[]
  // ... other relations
}
```

### User

System users with authentication.

```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  passwordHash   String
  name           String
  role           String   // 'admin', 'learner', 'instructor'
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  learner        Learner?
  // ... other relations
}
```

### Learner

Learner profiles with mastery tracking.

```prisma
model Learner {
  id             String   @id @default(uuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  organizationId String
  masteryMap     Json     // Map of concept -> mastery level
  knowledgeGaps  String[] // Array of concept IDs
  profile        Json?    // Additional profile data
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  sessions       Session[]
  progress       Progress[]
}
```

### Nugget

Learning content chunks.

```prisma
model Nugget {
  id             String   @id @default(uuid())
  organizationId String
  content        String
  metadata       Json?   // Topics, difficulty, prerequisites, etc.
  embedding      Unsupported("vector(1536)") // pgvector
  status         String   // 'processing', 'ready', 'failed'
  imageUrl       String?
  audioUrl       String?
  slides         Json?    // Slide content
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  sources        NuggetSource[]
  narrativeNodes NarrativeNode[]
}
```

### NarrativeNode

Narrative path nodes.

```prisma
model NarrativeNode {
  id             String   @id @default(uuid())
  organizationId String
  nuggetId       String
  nugget         Nugget   @relation(fields: [nuggetId], references: [id])
  choices        Json     // Array of choice objects
  createdAt      DateTime @default(now())

  sessions       Session[]
}
```

### Session

Learning sessions.

```prisma
model Session {
  id             String   @id @default(uuid())
  learnerId      String
  learner        Learner  @relation(fields: [learnerId], references: [id])
  organizationId String
  currentNodeId  String?
  currentNode    NarrativeNode? @relation(fields: [currentNodeId], references: [id])
  mode           String   // 'text', 'voice'
  startedAt      DateTime @default(now())
  lastActivity   DateTime @updatedAt
  completedAt    DateTime?

  messages       Message[]
}
```

### Message

Conversation messages.

```prisma
model Message {
  id        String   @id @default(uuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id])
  role      String   // 'user', 'assistant'
  content   String
  toolCalls Json?
  media     Json?
  createdAt DateTime @default(now())
}
```

### Progress

Mastery and progress tracking.

```prisma
model Progress {
  id          String   @id @default(uuid())
  learnerId   String
  learner     Learner  @relation(fields: [learnerId], references: [id])
  concept     String
  masteryLevel Int     // 0-100
  evidence    String?
  createdAt   DateTime @default(now())
}
```

## Ingestion Models

### WatchedFolder

Monitored folders for file watching.

```prisma
model WatchedFolder {
  id          String   @id @default(uuid())
  organizationId String
  path        String
  enabled     Boolean  @default(true)
  fileTypes   String[] // ['pdf', 'docx', 'txt']
  recursive   Boolean  @default(true)
  autoProcess Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### MonitoredURL

Monitored URLs for content updates.

```prisma
model MonitoredURL {
  id           String    @id @default(uuid())
  organizationId String
  url          String
  enabled      Boolean   @default(true)
  checkInterval Int      // Minutes
  lastChecked  DateTime?
  lastModified String?
  etag         String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### IngestionJob

Content processing jobs.

```prisma
model IngestionJob {
  id           String    @id @default(uuid())
  organizationId String
  type         String    // 'file', 'url', 'manual'
  source       String    // File path or URL
  status       String    // 'pending', 'processing', 'completed', 'failed'
  metadata     Json?
  nuggetCount  Int?
  errorMessage String?
  startedAt    DateTime?
  completedAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  sources      NuggetSource[]
}
```

### NuggetSource

Links nuggets to their sources.

```prisma
model NuggetSource {
  id             String        @id @default(uuid())
  nuggetId       String
  nugget         Nugget        @relation(fields: [nuggetId], references: [id])
  ingestionJobId String
  ingestionJob   IngestionJob  @relation(fields: [ingestionJobId], references: [id])
  sourceType     String        // 'file', 'url'
  sourcePath     String
  chunkIndex     Int?
  createdAt      DateTime      @default(now())
}
```

## Configuration Models

### SystemSetting

Key-value system settings.

```prisma
model SystemSetting {
  id             String   @id @default(uuid())
  organizationId String
  key            String
  value          Json
  scope          String   // 'system', 'organization', 'learner'
  scopeId        String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([key, scope, scopeId])
}
```

### AIModelConfig

AI model configuration.

```prisma
model AIModelConfig {
  id                      String   @id @default(uuid())
  organizationId          String
  contentGenerationModel  String
  narrativePlanningModel   String
  tutoringModel           String
  metadataModel           String
  embeddingModel          String
  contentGenerationTemp   Float?
  narrativePlanningTemp   Float?
  tutoringTemp            Float?
  scope                   String
  scopeId                 String?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  @@unique([scope, scopeId])
}
```

### VoiceConfig

Voice/TTS configuration.

```prisma
model VoiceConfig {
  id          String   @id @default(uuid())
  organizationId String
  ttsProvider String   // 'openai-standard', 'openai-hd', 'elevenlabs'
  ttsModel    String?
  ttsVoice    String?
  sttProvider String   // 'openai-whisper', 'elevenlabs'
  sttModel    String?
  qualityTier String  // 'low', 'mid', 'high'
  scope       String
  scopeId     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([scope, scopeId])
}
```

## Indexes

### Performance Indexes

```sql
-- User email lookup
CREATE INDEX idx_user_email ON "User"(email);

-- Organization users
CREATE INDEX idx_user_organization ON "User"("organizationId");

-- Nugget embeddings (pgvector)
CREATE INDEX idx_nugget_embedding ON "Nugget" USING ivfflat (embedding vector_cosine_ops);

-- Session lookup
CREATE INDEX idx_session_learner ON "Session"("learnerId");
CREATE INDEX idx_session_organization ON "Session"("organizationId");

-- Message lookup
CREATE INDEX idx_message_session ON "Message"("sessionId");

-- Progress tracking
CREATE INDEX idx_progress_learner ON "Progress"("learnerId");
CREATE INDEX idx_progress_concept ON "Progress"("concept");

-- Ingestion jobs
CREATE INDEX idx_ingestion_job_organization ON "IngestionJob"("organizationId");
CREATE INDEX idx_ingestion_job_status ON "IngestionJob"("status");
```

## Migrations

Migrations are managed through Prisma:

```bash
# Create migration
npm run db:migrate:dev

# Apply migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset
```

## pgvector Setup

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## Related Documentation

- [Content Ingestion](CONTENT_INGESTION.md) - Ingestion system
- [API Reference](API_REFERENCE.md) - API endpoints
- [Architecture Overview](ARCHITECTURE.md) - System design
