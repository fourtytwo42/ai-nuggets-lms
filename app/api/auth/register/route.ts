import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db/prisma';
import { hashPassword } from '@/src/lib/auth/password';
import { generateToken } from '@/src/lib/auth/jwt';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  organizationName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Create or find organization
    let organization;
    if (validated.organizationName) {
      organization = await prisma.organization.create({
        data: { name: validated.organizationName },
      });
    } else {
      // Create default organization for user
      organization = await prisma.organization.create({
        data: { name: `${validated.name}'s Organization` },
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        name: validated.name,
        role: 'learner',
        organizationId: organization.id,
      },
    });

    // Create learner profile
    await prisma.learner.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        profile: {
          interests: [],
          goals: '',
          learningStyle: 'visual',
        },
      },
    });

    // Generate token
    const token = generateToken(user.id, organization.id, user.role);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3); // 3 days

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: organization.id,
      },
      expiresAt: expiresAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', fields: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

