# Admin Interface Documentation

## Overview

The AI Microlearning LMS provides a comprehensive admin interface for managing all aspects of the system, including content ingestion, file management, system settings, and more.

## Access

The admin interface is accessible at `/admin/*` routes and requires:
- User authentication (logged in)
- Admin role (`role: 'admin'`)

## Navigation

The admin interface is accessible through the main navigation bar when logged in as an admin. Available sections:

- **Dashboard** (`/admin`) - System overview
- **Ingestion** (`/admin/ingestion`) - Content ingestion management
- **Files** (`/admin/files`) - File upload and management
- **Nuggets** (`/admin/nuggets`) - Learning nugget management
- **Settings** (`/admin/settings`) - System configuration
- **Analytics** (`/admin/analytics`) - System analytics

## Content Ingestion (`/admin/ingestion`)

### Watched Folders

Manage folders that are automatically monitored for new files.

**Features:**
- Add watched folders with custom paths
- Configure file types to watch (PDF, DOCX, TXT)
- Enable/disable recursive scanning
- Toggle auto-processing
- Enable/disable individual folders
- Delete folders

**API Endpoints:**
- `GET /api/admin/ingestion/folders` - List all watched folders
- `POST /api/admin/ingestion/folders` - Add new watched folder
- `PUT /api/admin/ingestion/folders/[id]` - Update folder settings
- `DELETE /api/admin/ingestion/folders/[id]` - Remove watched folder

### Monitored URLs

Manage URLs that are periodically checked for content updates.

**Features:**
- Add URLs to monitor
- Configure check intervals (minutes)
- Enable/disable monitoring
- View last checked timestamp
- Delete URLs

**API Endpoints:**
- `GET /api/admin/ingestion/urls` - List all monitored URLs
- `POST /api/admin/ingestion/urls` - Add new URL
- `PUT /api/admin/ingestion/urls/[id]` - Update URL settings
- `DELETE /api/admin/ingestion/urls/[id]` - Remove URL

### Ingestion Jobs

View and monitor content processing jobs.

**Features:**
- View all ingestion jobs
- Filter by status (pending, processing, completed, failed)
- See job type (file or URL)
- View source path/URL
- Check nugget count
- View timestamps

**API Endpoints:**
- `GET /api/admin/ingestion/jobs` - List jobs (supports `?status=` and `?limit=`)

## File Management (`/admin/files`)

See [FILE_MANAGEMENT.md](FILE_MANAGEMENT.md) for detailed documentation.

**Quick Overview:**
- Upload PDF, DOCX, or TXT files
- View all uploaded files
- Preview files in browser
- Delete files and associated nuggets
- Monitor processing status

## Settings (`/admin/settings`)

### API Keys

Manage API keys for external services.

**Supported Services:**
- **OpenAI API Key** - Required for GPT models, embeddings, TTS, Whisper
- **ElevenLabs API Key** - Optional, for ElevenLabs TTS/STT

**Storage:** API keys are stored securely in system settings (encrypted in production).

### AI Model Configuration

Configure which AI models to use for different tasks.

**Configurable Models:**
- **Content Generation Model** - For generating learning content
- **Narrative Planning Model** - For creating narrative paths
- **Tutoring Model** - For AI tutor interactions
- **Metadata Model** - For extracting metadata (cost-effective model)
- **Embedding Model** - For generating embeddings

**Available Models:**
- GPT-4o
- GPT-4o Mini
- GPT-4 Turbo
- GPT-4
- GPT-3.5 Turbo
- GPT-5.1 Mini/Nano (Future)

**Temperature Settings:**
- Content Generation Temperature (0-2, default: 0.7)
- Narrative Planning Temperature (0-2, default: 0.8)
- Tutoring Temperature (0-2, default: 0.7)

### Voice Configuration

Configure text-to-speech and speech-to-text settings.

**TTS Provider Options:**
- OpenAI Standard
- OpenAI HD
- ElevenLabs

**TTS Settings:**
- Model selection (TTS-1, TTS-1-HD)
- Voice selection (Alloy, Echo, Fable, Onyx, Nova, Shimmer)

**STT Provider Options:**
- OpenAI Whisper
- ElevenLabs

**STT Settings:**
- Model selection (Whisper-1)

**Quality Tier:**
- Low
- Mid (default)
- High

### System Settings

Manage system-wide configuration settings.

**Features:**
- Key-value pair storage
- JSON value support
- Scope-based settings (system, organization, learner)

**API Endpoints:**
- `GET /api/admin/settings/system` - List system settings
- `POST /api/admin/settings/system` - Create/update setting
- `DELETE /api/admin/settings/system?key=` - Delete setting

## Nuggets (`/admin/nuggets`)

Manage learning nuggets created from content.

**Features:**
- Browse all nuggets
- Search and filter
- View nugget details
- Edit nugget content
- Regenerate slides/audio
- Delete nuggets

## Analytics (`/admin/analytics`)

View system analytics and metrics.

**Features:**
- Usage statistics
- Cost tracking
- Learner engagement metrics
- Content performance
- System health

## API Authentication

All admin API endpoints require:

1. **JWT Token** in `Authorization: Bearer <token>` header
2. **Admin Role** - User must have `role: 'admin'`

## Error Handling

The admin interface provides:

- **Success Messages** - Green notifications for successful operations
- **Error Messages** - Red notifications with error details
- **Loading States** - Visual feedback during operations
- **Confirmation Dialogs** - For destructive actions (delete)

## Best Practices

1. **Regular Monitoring:** Check ingestion jobs and file processing regularly
2. **API Key Security:** Keep API keys secure and rotate periodically
3. **Model Selection:** Choose appropriate models based on cost and performance needs
4. **File Management:** Clean up unused files to manage storage
5. **Settings Backup:** Document custom settings for disaster recovery

## Future Enhancements

- Bulk operations for files and nuggets
- Advanced filtering and search
- Export/import configurations
- Audit logging
- Role-based permissions (beyond admin/learner)
- Multi-organization management

