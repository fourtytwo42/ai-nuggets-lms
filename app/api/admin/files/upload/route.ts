import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/src/lib/db/prisma';
import { processingQueue } from '@/src/services/jobs/queues';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';
const UPLOADS_DIR = join(STORAGE_PATH, 'uploads');

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'docx', 'txt'];

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, DOCX, TXT' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    await mkdir(UPLOADS_DIR, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    const filepath = join(UPLOADS_DIR, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create ingestion job
    const job = await prisma.ingestionJob.create({
      data: {
        type: 'file',
        source: filepath,
        organizationId: user.organizationId,
        status: 'pending',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: fileExtension,
          uploadedBy: user.id,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Queue for processing
    await processingQueue.add('process-ingestion', {
      jobId: job.id,
      organizationId: user.organizationId,
    });

    return NextResponse.json(
      {
        id: job.id,
        filename: file.name,
        filepath,
        size: file.size,
        type: fileExtension,
        status: 'pending',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

