import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    await authenticate(request);

    // In a stateless JWT system, logout is handled client-side
    // by removing the token. We could implement token blacklisting
    // here if needed in the future.

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

