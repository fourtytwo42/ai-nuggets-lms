import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';
import { prisma } from '@/src/lib/db/prisma';
import { z } from 'zod';

const systemSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  scope: z.enum(['system', 'organization', 'learner']).optional(),
  scopeId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const scope = searchParams.get('scope') || 'system';
    const scopeId = searchParams.get('scopeId') || null;

    if (key) {
      // Get specific setting
      const setting = await prisma.systemSetting.findUnique({
        where: { key },
      });

      if (!setting) {
        return NextResponse.json(
          { error: 'Setting not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(setting);
    }

    // Get all system-level settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        scope: scope || 'system',
        scopeId: scopeId || null,
      },
      orderBy: { key: 'asc' },
    });

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const body = await request.json();
    const validated = systemSettingSchema.parse(body);

    // Upsert setting
    const setting = await prisma.systemSetting.upsert({
      where: { key: validated.key },
      update: {
        value: validated.value,
        scope: validated.scope || 'system',
        scopeId: validated.scopeId || null,
      },
      create: {
        key: validated.key,
        value: validated.value,
        scope: validated.scope || 'system',
        scopeId: validated.scopeId || null,
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', fields: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    await prisma.systemSetting.delete({
      where: { key },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

