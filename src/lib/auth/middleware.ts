import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from './jwt';
import { UnauthorizedError } from '../errors';
import { prisma } from '../db/prisma';

export interface AuthenticatedUser extends JWTPayload {
  id: string;
  email: string;
  name: string;
}

export async function authenticate(request: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (user.organizationId !== payload.organizationId) {
    throw new UnauthorizedError('Organization mismatch');
  }

  return {
    ...payload,
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function requireRole(
  user: AuthenticatedUser,
  allowedRoles: string[]
): Promise<void> {
  if (!allowedRoles.includes(user.role)) {
    throw new UnauthorizedError(`Role ${user.role} not allowed`);
  }
}

