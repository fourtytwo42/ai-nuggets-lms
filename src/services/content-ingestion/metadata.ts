import OpenAI from 'openai';
import logger from '@/src/lib/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const METADATA_MODEL = 'gpt-4o-mini'; // Using available model instead of gpt-5.1-nano

export interface NuggetMetadata {
  topics: string[];
  difficulty: number; // 1-10
  prerequisites: string[];
  estimatedTime: number; // minutes
  relatedConcepts: string[];
}

export async function extractMetadata(
  content: string
): Promise<NuggetMetadata> {
  try {
    const response = await openai.chat.completions.create({
      model: METADATA_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a learning content analyzer. Extract metadata from learning content and return ONLY valid JSON in this exact format:
{
  "topics": ["topic1", "topic2"],
  "difficulty": 5,
  "prerequisites": ["prereq1", "prereq2"],
  "estimatedTime": 10,
  "relatedConcepts": ["concept1", "concept2"]
}`,
        },
        {
          role: 'user',
          content: `Extract metadata from this content:\n\n${content.substring(0, 4000)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const metadata = JSON.parse(
      response.choices[0].message.content || '{}'
    ) as NuggetMetadata;

    // Validate and normalize
    return {
      topics: Array.isArray(metadata.topics) ? metadata.topics : [],
      difficulty: Math.max(1, Math.min(10, metadata.difficulty || 5)),
      prerequisites: Array.isArray(metadata.prerequisites)
        ? metadata.prerequisites
        : [],
      estimatedTime: Math.max(1, metadata.estimatedTime || 5),
      relatedConcepts: Array.isArray(metadata.relatedConcepts)
        ? metadata.relatedConcepts
        : [],
    };
  } catch (error) {
    logger.error('Failed to extract metadata', {
      error: (error as Error).message,
      contentLength: content.length,
    });
    // Return default metadata on error
    return {
      topics: [],
      difficulty: 5,
      prerequisites: [],
      estimatedTime: 5,
      relatedConcepts: [],
    };
  }
}

