import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';
import { prisma } from '@/src/lib/db/prisma';
import { z } from 'zod';

const urlSchema = z.object({
  url: z.string().url('Invalid URL'),
  enabled: z.boolean().optional().default(true),
  checkInterval: z.number().int().min(1).max(1440).optional().default(5),
});

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const body = await request.json();
    const validated = urlSchema.parse(body);

    const monitoredUrl = await prisma.monitoredURL.create({
      data: {
        organizationId: user.organizationId,
        url: validated.url,
        enabled: validated.enabled,
        checkInterval: validated.checkInterval,
      },
    });

    return NextResponse.json(monitoredUrl, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', fields: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Create URL error:', error);
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

    const urls = await prisma.monitoredURL.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(urls);
  } catch (error) {
    console.error('Get URLs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

