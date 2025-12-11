import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';
import { prisma } from '@/src/lib/db/prisma';
import { unlink } from 'fs/promises';
import { readFile } from 'fs/promises';
import { join } from 'path';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';
const UPLOADS_DIR = join(STORAGE_PATH, 'uploads');

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const job = await prisma.ingestionJob.findUnique({
      where: { id: params.id },
    });

    if (!job || job.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if file exists
    try {
      const fileBuffer = await readFile(job.source);
      const filename = job.source.split('/').pop() || 'file';
      const metadata = job.metadata as any;
      const contentType =
        metadata?.fileType === 'pdf'
          ? 'application/pdf'
          : metadata?.fileType === 'docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'text/plain';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${metadata?.fileName || filename}"`,
        },
      });
    } catch {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }
  } catch (error) {
    console.error('Get file error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const job = await prisma.ingestionJob.findUnique({
      where: { id: params.id },
      include: {
        nuggetSources: true,
      },
    });

    if (!job || job.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete file from disk
    try {
      await unlink(job.source);
    } catch (error) {
      console.warn('File not found on disk, continuing with deletion:', error);
    }

    // Delete associated nuggets
    const nuggetIds = job.nuggetSources.map((ns) => ns.nuggetId);
    if (nuggetIds.length > 0) {
      await prisma.nugget.deleteMany({
        where: {
          id: { in: nuggetIds },
          organizationId: user.organizationId,
        },
      });
    }

    // Delete ingestion job (cascades to nugget sources)
    await prisma.ingestionJob.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

