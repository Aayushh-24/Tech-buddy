import { HfInference } from '@huggingface/inference'

export interface TextChunk {
  id: string
  content: string
  metadata: {
    documentId: string
    chunkIndex: number
    startChar: number
    endChar: number
    documentName: string
    section?: string
    heading?: string
  }
  embedding?: number[]
}

export interface ProcessingOptions {
  chunkSize: number
  chunkOverlap: number
  includeMetadata: boolean
}

export class TextProcessor {
  private hf: HfInference
  private embeddingModel: string

  constructor(hfApiKey: string, embeddingModel: string = 'sentence-transformers/all-MiniLM-L6-v2') {
    this.hf = new HfInference(hfApiKey)
    this.embeddingModel = embeddingModel
  }

  /**
   * Extract text from PDF buffer
   */
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      // Dynamic import to avoid issues with PDF parsing in serverless environments
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(pdfBuffer)
      return data.text
    } catch (error) {
      console.error('Error extracting text from PDF:', error)
      throw new Error('Failed to extract text from PDF')
    }
  }

  /**
   * Extract text from DOCX buffer
   */
  async extractTextFromDOCX(docxBuffer: Buffer): Promise<string> {
    try {
      // Dynamic import to avoid issues with DOCX parsing in serverless environments
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer: docxBuffer })
      return result.value
    } catch (error) {
      console.error('Error extracting text from DOCX:', error)
      throw new Error('Failed to extract text from DOCX')
    }
  }

  /**
   * Advanced text chunking with structure awareness
   */
  async chunkText(
    text: string,
    documentId: string,
    documentName: string,
    options: ProcessingOptions
  ): Promise<TextChunk[]> {
    const { chunkSize, chunkOverlap, includeMetadata } = options

    // Clean and normalize text
    const cleanedText = this.cleanText(text)
    
    // Split by sections (headings, paragraphs, etc.)
    const sections = this.splitIntoSections(cleanedText)
    
    const chunks: TextChunk[] = []
    let currentChunk = ''
    let chunkIndex = 0
    let currentStart = 0

    for (const section of sections) {
      const lines = section.split('\n').filter(line => line.trim().length > 0)
      
      for (const line of lines) {
        if (currentChunk.length + line.length + 1 <= chunkSize) {
          currentChunk += (currentChunk.length > 0 ? '\n' : '') + line
        } else {
          // Save current chunk if not empty
          if (currentChunk.trim().length > 0) {
            chunks.push(this.createChunk(
              currentChunk,
              documentId,
              documentName,
              chunkIndex++,
              currentStart,
              currentStart + currentChunk.length,
              includeMetadata ? { section: section.substring(0, 50) } : undefined
            ))
            currentStart += currentChunk.length
          }
          
          // Start new chunk with overlap
          const overlapStart = Math.max(0, currentChunk.length - chunkOverlap)
          currentChunk = currentChunk.substring(overlapStart) + '\n' + line
        }
      }
    }

    // Add the last chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(this.createChunk(
        currentChunk,
        documentId,
        documentName,
        chunkIndex,
        currentStart,
        currentStart + currentChunk.length,
        includeMetadata ? { section: 'final' } : undefined
      ))
    }

    return chunks
  }

  /**
   * Generate embeddings for text chunks
   */
  async generateEmbeddings(chunks: TextChunk[]): Promise<TextChunk[]> {
    const batchSize = 10 // Process in batches to avoid rate limits
    const processedChunks: TextChunk[] = []

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      
      try {
        const texts = batch.map(chunk => chunk.content)
        const embeddings = await this.hf.featureExtraction({
          model: this.embeddingModel,
          inputs: texts
        })

        // Add embeddings to chunks
        for (let j = 0; j < batch.length; j++) {
          processedChunks.push({
            ...batch[j],
            embedding: embeddings[j] as number[]
          })
        }

        // Add delay to avoid rate limiting
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error('Error generating embeddings for batch:', error)
        // Add chunks without embeddings if there's an error
        processedChunks.push(...batch)
      }
    }

    return processedChunks
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .trim()
  }

  /**
   * Split text into sections based on headings and structure
   */
  private splitIntoSections(text: string): string[] {
    // Split by common heading patterns
    const headingPattern = /^(#{1,6}\s+.+)$|^[A-Z][A-Z\s]+$|^[A-Z][a-z]+.*:$/gm
    const sections = text.split(headingPattern)
    
    if (sections.length === 1) {
      // No clear sections, split by paragraphs
      return text.split('\n\n').filter(section => section.trim().length > 0)
    }

    return sections.filter(section => section.trim().length > 0)
  }

  /**
   * Create a text chunk with metadata
   */
  private createChunk(
    content: string,
    documentId: string,
    documentName: string,
    chunkIndex: number,
    startChar: number,
    endChar: number,
    additionalMetadata?: Record<string, any>
  ): TextChunk {
    return {
      id: `${documentId}-${chunkIndex}`,
      content: content.trim(),
      metadata: {
        documentId,
        chunkIndex,
        startChar,
        endChar,
        documentName,
        ...additionalMetadata
      }
    }
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Find most similar chunks to a query embedding
   */
  findSimilarChunks(
    queryEmbedding: number[],
    chunks: TextChunk[],
    topK: number = 5,
    similarityThreshold: number = 0.5
  ): TextChunk[] {
    const chunksWithScores = chunks
      .filter(chunk => chunk.embedding)
      .map(chunk => ({
        chunk,
        similarity: this.calculateSimilarity(queryEmbedding, chunk.embedding!)
      }))
      .filter(item => item.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)

    return chunksWithScores.map(item => item.chunk)
  }
}