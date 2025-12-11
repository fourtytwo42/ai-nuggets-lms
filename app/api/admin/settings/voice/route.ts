import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';
import { prisma } from '@/src/lib/db/prisma';
import { z } from 'zod';

const voiceConfigSchema = z.object({
  ttsProvider: z.enum(['openai-standard', 'openai-hd', 'elevenlabs']),
  ttsModel: z.string().optional().nullable(),
  ttsVoice: z.string().optional().nullable(),
  sttProvider: z.enum(['openai-whisper', 'elevenlabs']),
  sttModel: z.string().optional().nullable(),
  qualityTier: z.enum(['low', 'mid', 'high']),
});

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    // Get system-level config (scope = 'system', scopeId = null)
    let config = await prisma.voiceConfig.findUnique({
      where: {
        scope_scopeId: {
          scope: 'system',
          scopeId: null,
        },
      },
    });

    // If no system config exists, create default one
    if (!config) {
      config = await prisma.voiceConfig.create({
        data: {
          scope: 'system',
          scopeId: null,
          ttsProvider: 'openai-standard',
          ttsModel: 'tts-1',
          ttsVoice: 'alloy',
          sttProvider: 'openai-whisper',
          sttModel: 'whisper-1',
          qualityTier: 'mid',
        },
      });
    }

    return NextResponse.json(config);
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

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    const body = await request.json();
    const validated = voiceConfigSchema.parse(body);

    // Upsert system-level config
    const config = await prisma.voiceConfig.upsert({
      where: {
        scope_scopeId: {
          scope: 'system',
          scopeId: null,
        },
      },
      update: {
        ttsProvider: validated.ttsProvider,
        ttsModel: validated.ttsModel || null,
        ttsVoice: validated.ttsVoice || null,
        sttProvider: validated.sttProvider,
        sttModel: validated.sttModel || null,
        qualityTier: validated.qualityTier,
      },
      create: {
        scope: 'system',
        scopeId: null,
        ttsProvider: validated.ttsProvider,
        ttsModel: validated.ttsModel || null,
        ttsVoice: validated.ttsVoice || null,
        sttProvider: validated.sttProvider,
        sttModel: validated.sttModel || null,
        qualityTier: validated.qualityTier,
      },
    });

    return NextResponse.json(config);
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

