# File Management System

## Overview

The AI Microlearning LMS includes a comprehensive file upload and management system that allows administrators to upload files directly to the platform, which are then automatically processed into learning nuggets.

## Features

- **Direct File Upload:** Upload PDF, DOCX, and TXT files through the admin interface
- **Automatic Processing:** Files are automatically queued for ingestion and processing
- **File Preview:** View uploaded files directly in the browser
- **File Management:** Delete files and their associated nuggets
- **Status Tracking:** Monitor processing status in real-time
- **Storage Management:** Files stored in organized directory structure

## Storage Structure

Files are stored in the project's storage directory:

```
storage/
└── uploads/
    ├── 1234567890_document.pdf
    ├── 1234567891_article.docx
    └── 1234567892_notes.txt
```

The storage path is configurable via the `STORAGE_PATH` environment variable (default: `./storage`).

## File Upload Process

1. **Upload:** Admin uploads file through `/admin/files` page
2. **Validation:** File type and format validated (PDF, DOCX, TXT only)
3. **Storage:** File saved to `storage/uploads/` with unique timestamped filename
4. **Job Creation:** Ingestion job created in database
5. **Queue Processing:** Job queued for background processing
6. **Content Processing:** File processed through ingestion pipeline:
   - Text extraction
   - Semantic chunking
   - Embedding generation
   - Metadata extraction
   - Image generation (optional)
7. **Nugget Creation:** Learning nuggets created from processed content

## API Endpoints

### POST /api/admin/files/upload

Upload a new file for processing.

**Authentication:** Required (Admin role)

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (File object)

**Response:**
```json
{
  "id": "job-id",
  "filename": "document.pdf",
  "filepath": "./storage/uploads/1234567890_document.pdf",
  "size": 1024000,
  "type": "pdf",
  "status": "pending"
}
```

**Error Responses:**
- `400` - Invalid file type or no file provided
- `401` - Unauthorized
- `500` - Internal server error

### GET /api/admin/files

List all uploaded files for the organization.

**Authentication:** Required (Admin role)

**Response:**
```json
[
  {
    "id": "job-id",
    "filename": "document.pdf",
    "filepath": "./storage/uploads/1234567890_document.pdf",
    "size": 1024000,
    "type": "pdf",
    "status": "completed",
    "nuggetCount": 5,
    "createdAt": "2025-12-11T12:00:00.000Z",
    "updatedAt": "2025-12-11T12:05:00.000Z",
    "error": null
  }
]
```

### GET /api/admin/files/[id]

Download or preview a file.

**Authentication:** Required (Admin role)

**Response:**
- File content with appropriate Content-Type header
- `404` if file not found

### DELETE /api/admin/files/[id]

Delete a file and all associated nuggets.

**Authentication:** Required (Admin role)

**Response:**
```json
{
  "success": true
}
```

**Note:** This operation:
- Deletes the file from disk
- Deletes all nuggets created from this file
- Deletes the ingestion job record

## File Types Supported

- **PDF** (`.pdf`) - Portable Document Format
- **DOCX** (`.docx`) - Microsoft Word documents
- **TXT** (`.txt`) - Plain text files

## Processing Status

Files go through the following statuses:

- **pending** - File uploaded, waiting for processing
- **processing** - Currently being processed
- **completed** - Successfully processed, nuggets created
- **failed** - Processing failed (check error message)

## Admin Interface

The file management interface is available at `/admin/files` and provides:

- **Upload Button:** Click to select and upload files
- **File Table:** List of all uploaded files with:
  - Filename and type
  - File size (formatted)
  - Processing status
  - Number of nuggets created
  - Upload timestamp
- **Preview:** Click "Preview" to view file in modal
- **Delete:** Click "Delete" to remove file and nuggets

## Best Practices

1. **File Naming:** Use descriptive filenames for easier identification
2. **File Size:** Large files may take longer to process
3. **File Organization:** Files are automatically organized by upload timestamp
4. **Cleanup:** Regularly delete unused files to free storage space
5. **Monitoring:** Check processing status regularly for failed jobs

## Error Handling

If file processing fails:

1. Check the error message in the file list
2. Verify file format is valid
3. Check that required services (OpenAI API, etc.) are configured
4. Review server logs for detailed error information
5. Re-upload the file if needed

## Integration with Content Ingestion

The file upload system integrates with the content ingestion pipeline:

- Files uploaded through the admin interface use the same processing pipeline as watched folders
- All files create `IngestionJob` records
- Nuggets are linked to source files via `NuggetSource` records
- Processing uses the same semantic chunking and embedding generation

## Security Considerations

- **Authentication:** All endpoints require admin authentication
- **File Validation:** Only allowed file types accepted
- **Path Sanitization:** Filenames sanitized to prevent path traversal
- **Organization Isolation:** Users can only access files from their organization
- **Storage Location:** Files stored outside web root for security

## Environment Variables

- `STORAGE_PATH` - Base path for file storage (default: `./storage`)

## Future Enhancements

- Bulk file upload
- File versioning
- File sharing between organizations
- Advanced file preview (annotations, highlights)
- File metadata editing
- Storage quota management

