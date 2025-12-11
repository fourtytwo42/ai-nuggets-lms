import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';
import { prisma } from '@/src/lib/db/prisma';
import { stat } from 'fs/promises';
import { join } from 'path';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';
const UPLOADS_DIR = join(STORAGE_PATH, 'uploads');

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    // Get all ingestion jobs for this organization that are file uploads
    const jobs = await prisma.ingestionJob.findMany({
      where: {
        organizationId: user.organizationId,
        type: 'file',
        source: {
          startsWith: UPLOADS_DIR,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        nuggetSources: {
          include: {
            nugget: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Get file info from filesystem
    const files = await Promise.all(
      jobs.map(async (job) => {
        const metadata = job.metadata as { fileName?: string; fileSize?: number; fileType?: string } | null;
        let fileStats = null;

        try {
          const stats = await stat(job.source);
          fileStats = {
            size: stats.size,
            modified: stats.mtime,
          };
        } catch {
          // File may not exist
        }

        return {
          id: job.id,
          filename: metadata?.fileName || job.source.split('/').pop(),
          filepath: job.source,
          size: fileStats?.size || metadata?.fileSize || 0,
          type: metadata?.fileType || 'unknown',
          status: job.status,
          nuggetCount: job.nuggetCount || job.nuggetSources.length,
          createdAt: job.createdAt,
          updatedAt: job.completedAt || job.startedAt || job.createdAt,
          error: job.errorMessage,
        };
      })
    );

    return NextResponse.json(files);
  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

