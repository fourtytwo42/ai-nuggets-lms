# AI Integration Guide

Complete guide to AI services integration in the AI Microlearning LMS.

## Overview

The system integrates with multiple OpenAI services and optionally ElevenLabs for AI-powered content generation, tutoring, and multimedia creation.

## AI Services

### 1. OpenAI GPT Models

**Models Used:**

- **GPT-4o** - High-quality content generation
- **GPT-4o Mini** - Cost-effective for most tasks
- **GPT-4 Turbo** - Alternative high-quality option
- **GPT-3.5 Turbo** - Legacy support

**Use Cases:**

- Content generation (slides, scripts)
- Narrative planning
- AI tutoring
- Metadata extraction

**Configuration:**

- Model selection per task
- Temperature settings (0-2)
- Token limits
- System/organization/learner-level configs

### 2. Embeddings

**Model:** `text-embedding-3-small` (default) or `text-embedding-3-large`

**Use Cases:**

- Semantic chunking
- Vector similarity search
- Content discovery

**Storage:** PostgreSQL with pgvector extension

**Dimensions:** 1536 (small) or 3072 (large)

### 3. DALL-E 3

**Model:** DALL-E 3

**Use Cases:**

- Concept illustration generation
- Visual learning aids

**Configuration:**

- Size: 1024x1024
- Quality: Standard
- Style: Natural

### 4. Whisper (Speech-to-Text)

**Model:** `whisper-1`

**Use Cases:**

- Voice input transcription
- Audio content transcription

**Configuration:**

- Language detection
- Response format (text, json, verbose_json)

### 5. Text-to-Speech (TTS)

**Providers:**

- **OpenAI TTS** - Standard and HD quality
  - Models: `tts-1`, `tts-1-hd`
  - Voices: Alloy, Echo, Fable, Onyx, Nova, Shimmer
- **ElevenLabs** - High-quality (optional)

**Use Cases:**

- Audio script narration
- Voice responses

**Configuration:**

- Provider selection
- Voice selection
- Quality tier (low/mid/high)

## Integration Points

### Content Ingestion

**Metadata Extraction:**

```typescript
// Uses GPT-4o Mini for cost-effective extraction
const metadata = await extractMetadata(chunk);
// Returns: topics, difficulty, prerequisites, estimatedTime
```

**Image Generation:**

```typescript
// Uses DALL-E 3 for concept illustrations
const imageUrl = await generateImage(concept);
```

**Embedding Generation:**

```typescript
// Uses text-embedding-3-small
const embedding = await generateEmbedding(text);
await storeEmbedding(nuggetId, embedding);
```

### Learning Delivery

**AI Tutoring:**

```typescript
// Uses GPT-4o Mini with tool calling
const response = await aiTutor.processMessage(message, context);
// Tools: deliver_nugget, ask_question, update_mastery, etc.
```

**Narrative Planning:**

```typescript
// Uses GPT-4o Mini for adaptive path planning
const nextNode = await narrativePlanner.planNextNode(session);
```

### Content Authoring

**Slide Generation:**

```typescript
// Uses GPT-4o Mini for slide content
const slides = await generateSlides(nugget);
```

**Audio Script Generation:**

```typescript
// Uses GPT-4o Mini for conversational scripts
const script = await generateAudioScript(slides);
```

**Audio Generation:**

```typescript
// Uses OpenAI TTS or ElevenLabs
const audioUrl = await generateAudio(script, voiceConfig);
```

## Configuration

### AI Model Configuration

**Location:** Admin Settings (`/admin/settings`)

**Configurable Models:**

- Content Generation Model
- Narrative Planning Model
- Tutoring Model
- Metadata Model
- Embedding Model

**Temperature Settings:**

- Content Generation: 0.7 (default)
- Narrative Planning: 0.8 (default)
- Tutoring: 0.7 (default)

### Voice Configuration

**TTS Provider:**

- OpenAI Standard
- OpenAI HD
- ElevenLabs (optional)

**TTS Settings:**

- Model: TTS-1 or TTS-1-HD
- Voice: Alloy, Echo, Fable, Onyx, Nova, Shimmer
- Quality Tier: Low, Mid, High

**STT Provider:**

- OpenAI Whisper
- ElevenLabs (optional)

### API Keys

**Required:**

- `OPENAI_API_KEY` - For all OpenAI services

**Optional:**

- `ELEVENLABS_API_KEY` - For ElevenLabs TTS/STT

**Storage:** System settings (encrypted in production)

## Cost Management

### Cost Tracking

**Tracked Metrics:**

- API calls per model
- Token usage
- Cost per organization
- Cost per learner

**Storage:** Analytics table

### Optimization Strategies

1. **Model Selection:**
   - Use GPT-4o Mini for most tasks
   - Use GPT-4o only when needed
   - Use GPT-5.1 Nano for metadata (future)

2. **Embedding Caching:**
   - Cache embeddings for similar content
   - Reuse embeddings when possible

3. **Batch Processing:**
   - Process multiple items together
   - Reduce API call overhead

4. **Usage Limits:**
   - Per-organization limits
   - Per-learner limits
   - Rate limiting

## Error Handling

### Retry Logic

**Transient Errors:**

- Automatic retry (3 attempts)
- Exponential backoff
- Rate limit handling

**Permanent Errors:**

- Log error
- Mark job as failed
- Notify admin

### Common Errors

**Rate Limit Exceeded:**

- Automatic retry with backoff
- Queue job for later processing

**Invalid API Key:**

- Log error
- Notify admin
- Disable AI features

**Model Unavailable:**

- Fallback to alternative model
- Log error
- Notify admin

## Testing

### Mocking AI Services

**In Tests:**

```typescript
// Mock OpenAI API calls
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    // Mock implementations
  })),
}));
```

**Integration Tests:**

- Use test API keys
- Mock expensive operations
- Test error handling

## Best Practices

1. **API Key Security:**
   - Store in environment variables
   - Never commit to repository
   - Rotate regularly

2. **Cost Monitoring:**
   - Track usage regularly
   - Set usage limits
   - Review cost reports

3. **Error Handling:**
   - Implement retry logic
   - Log all errors
   - Graceful degradation

4. **Performance:**
   - Cache embeddings
   - Batch API calls
   - Use appropriate models

## Related Documentation

- [API Reference](API_REFERENCE.md) - API endpoints
- [Admin Interface](ADMIN_INTERFACE.md) - Settings configuration
- [Content Ingestion](CONTENT_INGESTION.md) - Ingestion pipeline
