import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';
import { prisma } from '@/src/lib/db/prisma';
import { z } from 'zod';
import { FileWatcherService } from '@/src/services/content-ingestion/file-watcher';

const folderSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  enabled: z.boolean().optional().default(true),
  fileTypes: z.array(z.string()).default(['pdf', 'docx', 'txt']),
  recursive: z.boolean().optional().default(true),
  autoProcess: z.boolean().optional().default(true),
});

// Singleton file watcher service
let fileWatcherService: FileWatcherService | null = null;

function getFileWatcherService(): FileWatcherService {
  if (!fileWatcherService) {
    fileWatcherService = new FileWatcherService(prisma);
  }
  return fileWatcherService;
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const body = await request.json();
    const validated = folderSchema.parse(body);

    const folder = await prisma.watchedFolder.create({
      data: {
        organizationId: user.organizationId,
        path: validated.path,
        enabled: validated.enabled,
        fileTypes: validated.fileTypes,
        recursive: validated.recursive,
        autoProcess: validated.autoProcess,
      },
    });

    // Start watching if enabled
    if (folder.enabled) {
      await getFileWatcherService().startWatching(folder.id, {
        id: folder.id,
        organizationId: folder.organizationId,
        path: folder.path,
        enabled: folder.enabled,
        fileTypes: folder.fileTypes,
        recursive: folder.recursive,
        autoProcess: folder.autoProcess,
      });
    }

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', fields: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Create folder error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const folders = await prisma.watchedFolder.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Get folders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

