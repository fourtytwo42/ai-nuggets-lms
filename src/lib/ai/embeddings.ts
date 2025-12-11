import OpenAI from 'openai';
import { prisma } from '../db/prisma';
import logger from '../logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = 'text-embedding-3-small';

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.substring(0, 8000), // Limit to 8k tokens
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error('Failed to generate embedding', {
      error: (error as Error).message,
      textLength: text.length,
    });
    throw error;
  }
}

export async function storeEmbedding(
  nuggetId: string,
  embedding: number[]
): Promise<void> {
  try {
    // Prisma doesn't support pgvector directly, use raw SQL
    await prisma.$executeRaw`
      UPDATE nuggets
      SET embedding = ${embedding}::vector
      WHERE id = ${nuggetId}
    `;
  } catch (error) {
    logger.error('Failed to store embedding', {
      nuggetId,
      error: (error as Error).message,
    });
    throw error;
  }
}

export async function searchSimilar(
  queryEmbedding: number[],
  organizationId: string,
  limit: number = 10
): Promise<Array<{ id: string; content: string; similarity: number }>> {
  try {
    // Use cosine similarity search with pgvector
    const results = await prisma.$queryRaw<
      Array<{ id: string; content: string; similarity: number }>
    >`
      SELECT 
        id,
        content,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM nuggets
      WHERE organization_id = ${organizationId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;

    return results;
  } catch (error) {
    logger.error('Failed to search similar embeddings', {
      organizationId,
      error: (error as Error).message,
    });
    throw error;
  }
}

