import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';
import { prisma } from '@/src/lib/db/prisma';
import { z } from 'zod';

const aiModelConfigSchema = z.object({
  contentGenerationModel: z.string().min(1),
  narrativePlanningModel: z.string().min(1),
  tutoringModel: z.string().min(1),
  metadataModel: z.string().min(1),
  embeddingModel: z.string().min(1),
  contentGenerationTemp: z.number().min(0).max(2).optional(),
  narrativePlanningTemp: z.number().min(0).max(2).optional(),
  tutoringTemp: z.number().min(0).max(2).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await requireRole(user, ['admin']);

    // Get system-level config (scope = 'system', scopeId = null)
    let config = await prisma.aIModelConfig.findFirst({
      where: {
        scope: 'system',
        scopeId: null,
      },
    });

    // If no system config exists, create default one
    if (!config) {
      config = await prisma.aIModelConfig.create({
        data: {
          scope: 'system',
          scopeId: null,
          contentGenerationModel: 'gpt-5.1-mini',
          narrativePlanningModel: 'gpt-5.1-mini',
          tutoringModel: 'gpt-5.1-mini',
          metadataModel: 'gpt-5.1-nano',
          embeddingModel: 'text-embedding-3-small',
          contentGenerationTemp: 0.7,
          narrativePlanningTemp: 0.8,
          tutoringTemp: 0.7,
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
    const validated = aiModelConfigSchema.parse(body);

    // Find existing config
    const existing = await prisma.aIModelConfig.findFirst({
      where: {
        scope: 'system',
        scopeId: null,
      },
    });

    // Upsert system-level config
    const config = existing
      ? await prisma.aIModelConfig.update({
          where: { id: existing.id },
          data: {
            contentGenerationModel: validated.contentGenerationModel,
            narrativePlanningModel: validated.narrativePlanningModel,
            tutoringModel: validated.tutoringModel,
            metadataModel: validated.metadataModel,
            embeddingModel: validated.embeddingModel,
            contentGenerationTemp: validated.contentGenerationTemp,
            narrativePlanningTemp: validated.narrativePlanningTemp,
            tutoringTemp: validated.tutoringTemp,
          },
        })
      : await prisma.aIModelConfig.create({
          data: {
            scope: 'system',
            scopeId: null,
            contentGenerationModel: validated.contentGenerationModel,
            narrativePlanningModel: validated.narrativePlanningModel,
            tutoringModel: validated.tutoringModel,
            metadataModel: validated.metadataModel,
            embeddingModel: validated.embeddingModel,
            contentGenerationTemp: validated.contentGenerationTemp,
            narrativePlanningTemp: validated.narrativePlanningTemp,
            tutoringTemp: validated.tutoringTemp,
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

