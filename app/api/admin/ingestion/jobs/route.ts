import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';
import { prisma } from '@/src/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const searchParams = request.nextUrl?.searchParams || new URL(request.url).searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const jobs = await prisma.ingestionJob.findMany({
      where: {
        organizationId: user.organizationId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

