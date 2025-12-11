import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';
import { prisma } from '@/src/lib/db/prisma';
import { z } from 'zod';
import { FileWatcherService } from '@/src/services/content-ingestion/file-watcher';

const updateFolderSchema = z.object({
  path: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  fileTypes: z.array(z.string()).optional(),
  recursive: z.boolean().optional(),
  autoProcess: z.boolean().optional(),
});

// Singleton file watcher service
let fileWatcherService: FileWatcherService | null = null;

function getFileWatcherService(): FileWatcherService {
  if (!fileWatcherService) {
    fileWatcherService = new FileWatcherService(prisma);
  }
  return fileWatcherService;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const folder = await prisma.watchedFolder.findUnique({
      where: { id: params.id },
    });

    if (!folder || folder.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateFolderSchema.parse(body);

    const updated = await prisma.watchedFolder.update({
      where: { id: params.id },
      data: validated,
    });

    // Restart watching if enabled status changed
    if (validated.enabled !== undefined) {
      await getFileWatcherService().stopWatching(params.id);
      if (updated.enabled) {
        await getFileWatcherService().startWatching(updated.id, {
          id: updated.id,
          organizationId: updated.organizationId,
          path: updated.path,
          enabled: updated.enabled,
          fileTypes: updated.fileTypes,
          recursive: updated.recursive,
          autoProcess: updated.autoProcess,
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', fields: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Update folder error:', error);
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

    const folder = await prisma.watchedFolder.findUnique({
      where: { id: params.id },
    });

    if (!folder || folder.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Stop watching
    await getFileWatcherService().stopWatching(params.id);

    // Delete folder
    await prisma.watchedFolder.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

