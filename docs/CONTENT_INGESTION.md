# Content Ingestion System

Complete guide to the content ingestion system that transforms raw content into learning nuggets.

## Overview

The content ingestion system automatically processes raw educational content (PDFs, DOCX files, TXT files, and web pages) and transforms them into structured learning nuggets with embeddings, metadata, and multimedia.

## Components

### 1. File Watcher Service

Monitors specified folders for new files and automatically processes them.

**Location:** `src/services/content-ingestion/file-watcher.ts`

**Features:**

- Multiple watched folders per organization
- File type filtering (PDF, DOCX, TXT)
- Recursive directory scanning
- Stability detection (waits for file write completion)
- Automatic processing on file detection

**Configuration:**

- Path to watch
- File types to monitor
- Recursive scanning (on/off)
- Auto-processing (on/off)

### 2. URL Monitor Service

Periodically checks URLs for content updates.

**Location:** `src/services/content-ingestion/url-monitor.ts`

**Features:**

- Configurable check intervals (minutes)
- Change detection (ETag, Last-Modified headers)
- Web scraping with cheerio
- Automatic processing on content change

**Configuration:**

- URL to monitor
- Check interval (1-1440 minutes)
- Enable/disable monitoring

### 3. Text Extraction

Extracts text content from various sources.

**Location:** `src/services/content-ingestion/extraction.ts`

**Supported Formats:**

- **PDF:** Using `pdf-parse` library
- **DOCX:** Using `mammoth` library
- **TXT:** Direct file reading
- **URLs:** Web scraping with `cheerio`

### 4. Semantic Chunking

Splits content into coherent, semantically meaningful chunks.

**Location:** `src/services/content-ingestion/chunking.ts`

**Algorithm:**

1. **Paragraph Splitting:** Split by paragraphs
2. **Embedding Generation:** Generate embeddings for each paragraph
3. **Similarity Clustering:** Group similar paragraphs (threshold: 0.85)
4. **Chunk Combination:** Combine chunks up to 2000 tokens
5. **Overlap Addition:** Add 15% overlap between chunks

**Benefits:**

- Maintains semantic coherence
- Preserves context
- Optimizes for embedding search

### 5. Embedding Generation

Creates vector embeddings for semantic search.

**Location:** `src/lib/ai/embeddings.ts`

**Process:**

1. Generate embeddings using OpenAI API
2. Store in PostgreSQL with pgvector
3. Enable semantic similarity search

**Model:** `text-embedding-3-small` (default) or `text-embedding-3-large`

### 6. Metadata Extraction

Extracts structured metadata from content.

**Location:** `src/services/content-ingestion/metadata.ts`

**Extracted Metadata:**

- Topics (array of strings)
- Difficulty level (beginner, intermediate, advanced)
- Prerequisites (array of concepts)
- Estimated time (minutes)

**Model:** GPT-4o Mini (cost-effective)

### 7. Image Generation

Creates AI-generated images for key concepts.

**Location:** `src/services/content-ingestion/images.ts`

**Process:**

1. Extract key concepts from chunk
2. Generate image prompt
3. Create image with DALL-E 3
4. Download and store image

**Model:** DALL-E 3 (1024x1024, standard quality)

### 8. Content Processor

Orchestrates the full ingestion pipeline.

**Location:** `src/services/content-ingestion/processor.ts`

**Pipeline:**

```
Raw Content
  ↓
Text Extraction
  ↓
Semantic Chunking
  ↓
For each chunk:
  - Embedding Generation
  - Metadata Extraction
  - Image Generation
  ↓
Nugget Creation
```

## Processing Flow

### File Upload Flow

1. **Upload:** Admin uploads file via `/admin/files`
2. **Validation:** File type and format validated
3. **Storage:** File saved to `storage/uploads/`
4. **Job Creation:** Ingestion job created
5. **Queue:** Job added to BullMQ queue
6. **Processing:** Worker processes job
7. **Completion:** Nuggets created, status updated

### Watched Folder Flow

1. **File Detection:** File watcher detects new file
2. **Stability Check:** Wait for file write completion
3. **Job Creation:** Ingestion job created
4. **Queue:** Job added to BullMQ queue
5. **Processing:** Worker processes job
6. **Completion:** Nuggets created

### URL Monitor Flow

1. **Periodic Check:** URL monitor checks URL at interval
2. **Change Detection:** Compare ETag/Last-Modified
3. **Content Extraction:** Scrape updated content
4. **Job Creation:** Ingestion job created
5. **Queue:** Job added to BullMQ queue
6. **Processing:** Worker processes job
7. **Completion:** Nuggets created

## Job Queue

### BullMQ Integration

**Queue:** `processingQueue`

**Job Types:**

- `process-content` - Process file/URL into nuggets

**Job Data:**

```typescript
{
  jobId: string; // IngestionJob ID
  organizationId: string;
  type: 'file' | 'url' | 'manual';
  source: string; // File path or URL
}
```

**Worker:** `src/workers/index.ts`

## Admin Interface

### Content Ingestion Page (`/admin/ingestion`)

**Features:**

- Add/remove watched folders
- Add/remove monitored URLs
- View ingestion jobs
- Enable/disable monitoring
- View job status and errors

### File Management Page (`/admin/files`)

**Features:**

- Upload files (PDF, DOCX, TXT)
- View uploaded files
- Preview files
- Delete files and associated nuggets
- Monitor processing status

## API Endpoints

### Watched Folders

- `POST /api/admin/ingestion/folders` - Add watched folder
- `GET /api/admin/ingestion/folders` - List watched folders
- `PUT /api/admin/ingestion/folders/:id` - Update folder
- `DELETE /api/admin/ingestion/folders/:id` - Remove folder

### Monitored URLs

- `POST /api/admin/ingestion/urls` - Add monitored URL
- `GET /api/admin/ingestion/urls` - List monitored URLs
- `PUT /api/admin/ingestion/urls/:id` - Update URL
- `DELETE /api/admin/ingestion/urls/:id` - Remove URL

### Ingestion Jobs

- `GET /api/admin/ingestion/jobs` - List jobs (with filtering)

### File Management

- `POST /api/admin/files/upload` - Upload file
- `GET /api/admin/files` - List uploaded files
- `GET /api/admin/files/:id` - Download/preview file
- `DELETE /api/admin/files/:id` - Delete file

See [API Reference](API_REFERENCE.md) for detailed API documentation.

## Error Handling

### Retry Logic

- **Transient Errors:** Automatic retry (3 attempts)
- **Permanent Errors:** Job marked as failed
- **Error Logging:** All errors logged with context

### Common Errors

**File Not Found:**

- File moved or deleted before processing
- Solution: Re-upload file

**Invalid File Format:**

- Unsupported file type
- Solution: Convert to PDF/DOCX/TXT

**API Rate Limits:**

- OpenAI API rate limit exceeded
- Solution: Automatic retry with backoff

**Processing Timeout:**

- Large files taking too long
- Solution: Increase timeout or split file

## Best Practices

1. **File Organization:** Use descriptive filenames
2. **Folder Structure:** Organize content by topic/course
3. **Monitoring:** Regularly check job status
4. **Error Review:** Review failed jobs and fix issues
5. **Storage Management:** Clean up unused files

## Performance

### Optimization

- **Batch Processing:** Process multiple chunks in parallel
- **Caching:** Cache embeddings for similar content
- **Queue Management:** Prioritize urgent jobs

### Limits

- **File Size:** Recommended < 50MB
- **Concurrent Jobs:** Configurable via BullMQ
- **API Rate Limits:** Respect OpenAI limits

## Troubleshooting

**Jobs stuck in "pending":**

- Check worker is running: `npm run worker:dev`
- Check Redis connection
- Review worker logs

**Jobs failing:**

- Check error message in job details
- Verify OpenAI API key is set
- Check file format is supported

**Slow processing:**

- Large files take longer
- Check API rate limits
- Consider splitting large files

## Related Documentation

- [File Management](FILE_MANAGEMENT.md) - File upload system
- [API Reference](API_REFERENCE.md) - API endpoints
- [Database Schema](DATABASE_SCHEMA.md) - Database models
