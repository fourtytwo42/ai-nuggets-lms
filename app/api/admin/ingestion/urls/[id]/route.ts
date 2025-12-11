import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';
import { prisma } from '@/src/lib/db/prisma';
import { z } from 'zod';

const updateUrlSchema = z.object({
  url: z.string().url('Invalid URL').optional(),
  enabled: z.boolean().optional(),
  checkInterval: z.number().int().min(1).max(1440).optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const url = await prisma.monitoredURL.findUnique({
      where: { id: params.id },
    });

    if (!url || url.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateUrlSchema.parse(body);

    const updated = await prisma.monitoredURL.update({
      where: { id: params.id },
      data: validated,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', fields: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Update URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const url = await prisma.monitoredURL.findUnique({
      where: { id: params.id },
    });

    if (!url || url.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    await prisma.monitoredURL.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

