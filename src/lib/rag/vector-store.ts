import { TextChunk } from './text-processor'

export interface VectorStoreEntry {
  id: string
  documentId: string
  content: string
  embedding: number[]
  metadata: Record<string, any>
  createdAt: Date
}

export class VectorStore {
  private entries: Map<string, VectorStoreEntry> = new Map()

  /**
   * Add entries to the vector store
   */
  async addEntries(chunks: TextChunk[]): Promise<void> {
    for (const chunk of chunks) {
      if (!chunk.embedding) {
        console.warn(`Chunk ${chunk.id} has no embedding, skipping`)
        continue
      }

      const entry: VectorStoreEntry = {
        id: chunk.id,
        documentId: chunk.metadata.documentId,
        content: chunk.content,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
        createdAt: new Date()
      }

      this.entries.set(chunk.id, entry)
    }
  }

  /**
   * Search for similar entries using cosine similarity
   */
  async search(
    queryEmbedding: number[],
    options: {
      limit?: number
      documentId?: string
      similarityThreshold?: number
    } = {}
  ): Promise<VectorStoreEntry[]> {
    const {
      limit = 5,
      documentId,
      similarityThreshold = 0.5
    } = options

    const entries = Array.from(this.entries.values())
      .filter(entry => {
        // Filter by document ID if specified
        if (documentId && entry.documentId !== documentId) {
          return false
        }
        return true
      })
      .map(entry => ({
        entry,
        similarity: this.calculateCosineSimilarity(queryEmbedding, entry.embedding)
      }))
      .filter(item => item.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    return entries.map(item => item.entry)
  }

  /**
   * Get entries by document ID
   */
  async getByDocumentId(documentId: string): Promise<VectorStoreEntry[]> {
    return Array.from(this.entries.values())
      .filter(entry => entry.documentId === documentId)
  }

  /**
   * Delete entries by document ID
   */
  async deleteByDocumentId(documentId: string): Promise<void> {
    for (const [id, entry] of this.entries) {
      if (entry.documentId === documentId) {
        this.entries.delete(id)
      }
    }
  }

  /**
   * Get all entries
   */
  async getAll(): Promise<VectorStoreEntry[]> {
    return Array.from(this.entries.values())
  }

  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    this.entries.clear()
  }

  /**
   * Get entry count
   */
  async count(): Promise<number> {
    return this.entries.size
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Export entries to JSON (for persistence)
   */
  async export(): Promise<string> {
    const data = Array.from(this.entries.entries())
    return JSON.stringify(data, null, 2)
  }

  /**
   * Import entries from JSON (for persistence)
   */
  async import(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData) as [string, VectorStoreEntry][]
      this.entries.clear()
      
      for (const [id, entry] of data) {
        this.entries.set(id, {
          ...entry,
          createdAt: new Date(entry.createdAt)
        })
      }
    } catch (error) {
      console.error('Error importing vector store data:', error)
      throw new Error('Failed to import vector store data')
    }
  }
}

// Global vector store instance (in-memory for now)
export const globalVectorStore = new VectorStore()