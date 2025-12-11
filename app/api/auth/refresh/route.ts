import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth/middleware';
import { generateToken } from '@/src/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);

    // Generate new token
    const token = generateToken(user.id, user.organizationId, user.role);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3); // 3 days

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
    });
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

