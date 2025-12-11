import { generateEmbedding } from '@/src/lib/ai/embeddings';
import logger from '@/src/lib/logger';

export interface Chunk {
  text: string;
  paragraphIndices: number[];
  startIndex: number;
  endIndex: number;
}

export class SemanticChunker {
  private similarityThreshold = 0.85;
  private maxTokens = 2000;
  private overlapPercent = 0.15;

  async chunk(text: string): Promise<Chunk[]> {
    // 1. Split by paragraphs
    const paragraphs = text
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0)
      .map((p) => p.trim());

    if (paragraphs.length === 0) {
      return [];
    }

    logger.debug('Chunking text', {
      paragraphCount: paragraphs.length,
      totalLength: text.length,
    });

    // 2. Generate embeddings for paragraphs
    const embeddings = await Promise.all(
      paragraphs.map((p) => this.generateEmbedding(p))
    );

    // 3. Cluster by similarity
    const clusters: number[][] = [];
    let currentCluster: number[] = [0];

    for (let i = 1; i < paragraphs.length; i++) {
      const similarity = this.cosineSimilarity(
        embeddings[i - 1],
        embeddings[i]
      );

      if (similarity > this.similarityThreshold) {
        // Similar topic, add to current cluster
        currentCluster.push(i);
      } else {
        // Topic shift, start new cluster
        clusters.push(currentCluster);
        currentCluster = [i];
      }
    }
    clusters.push(currentCluster);

    logger.debug('Clustered paragraphs', { clusterCount: clusters.length });

    // 4. Combine clusters into chunks (max 2000 tokens)
    const chunks: Chunk[] = [];
    for (const cluster of clusters) {
      let chunkText = '';
      let chunkParagraphs: number[] = [];

      for (const paraIdx of cluster) {
        const paraText = paragraphs[paraIdx];
        const tokens = this.estimateTokens(chunkText + paraText);

        if (tokens > this.maxTokens && chunkText) {
          // Current chunk is full, save it
          chunks.push({
            text: chunkText.trim(),
            paragraphIndices: chunkParagraphs,
            startIndex: chunkParagraphs[0],
            endIndex: chunkParagraphs[chunkParagraphs.length - 1],
          });

          // Start new chunk
          chunkText = paraText;
          chunkParagraphs = [paraIdx];
        } else {
          chunkText += (chunkText ? '\n\n' : '') + paraText;
          chunkParagraphs.push(paraIdx);
        }
      }

      // Save remaining chunk
      if (chunkText.trim()) {
        chunks.push({
          text: chunkText.trim(),
          paragraphIndices: chunkParagraphs,
          startIndex: chunkParagraphs[0],
          endIndex: chunkParagraphs[chunkParagraphs.length - 1],
        });
      }
    }

    logger.debug('Created chunks', { chunkCount: chunks.length });

    // 5. Add overlap between chunks (15%)
    return this.addOverlap(chunks, this.overlapPercent);
  }

  private addOverlap(chunks: Chunk[], overlapPercent: number): Chunk[] {
    if (chunks.length <= 1) {
      return chunks;
    }

    const overlapped: Chunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let text = chunk.text;

      // Add overlap from previous chunk
      if (i > 0) {
        const prevChunk = chunks[i - 1];
        const prevText = prevChunk.text;
        const overlapSize = Math.floor(prevText.length * overlapPercent);
        const overlapText = prevText.slice(-overlapSize);
        text = overlapText + '\n\n' + text;
      }

      // Add overlap to next chunk
      if (i < chunks.length - 1) {
        const nextChunk = chunks[i + 1];
        const nextText = nextChunk.text;
        const overlapSize = Math.floor(nextText.length * overlapPercent);
        const overlapText = nextText.slice(0, overlapSize);
        text = text + '\n\n' + overlapText;
      }

      overlapped.push({
        ...chunk,
        text,
      });
    }

    return overlapped;
  }

  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      return await generateEmbedding(text.substring(0, 8000)); // Limit to 8k tokens
    } catch (error) {
      logger.error('Failed to generate embedding for chunking', {
        error: (error as Error).message,
        textLength: text.length,
      });
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }
}

