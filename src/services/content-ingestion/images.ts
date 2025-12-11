import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '@/src/lib/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

export async function generateImage(
  content: string,
  nuggetId: string
): Promise<string | null> {
  try {
    // Extract key concept from content
    const concept = await extractConcept(content);

    if (!concept) {
      logger.warn('No concept extracted for image generation', { nuggetId });
      return null;
    }

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Educational illustration: ${concept}. Clean, professional, suitable for learning materials.`,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const imageData = response.data?.[0];
    if (!imageData?.url) {
      throw new Error('No image URL returned from DALL-E');
    }
    const imageUrl = imageData.url;

    // Download and save image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imagePath = path.join(
      STORAGE_PATH,
      'images',
      `${nuggetId}.png`
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(imagePath), { recursive: true });

    // Save image
    await fs.writeFile(imagePath, Buffer.from(imageBuffer));

    logger.info('Generated and saved image', {
      nuggetId,
      imagePath,
    });

    return `/storage/images/${nuggetId}.png`;
  } catch (error) {
    logger.error('Failed to generate image', {
      nuggetId,
      error: (error as Error).message,
    });
    return null;
  }
}

async function extractConcept(content: string): Promise<string | null> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Extract the main concept or topic from this content in 5-10 words. Return only the concept, nothing else.',
        },
        {
          role: 'user',
          content: content.substring(0, 1000),
        },
      ],
      temperature: 0.7,
      max_tokens: 20,
    });

    return response.choices[0].message.content?.trim() || null;
  } catch (error) {
    logger.error('Failed to extract concept', {
      error: (error as Error).message,
    });
    return null;
  }
}

