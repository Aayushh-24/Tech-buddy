import { TextProcessor, TextChunk, ProcessingOptions } from './text-processor'
import { globalVectorStore } from './vector-store'
import { HfInference } from '@huggingface/inference'
import { db } from '@/lib/db'
import { ServerApiService } from '@/lib/server-api-service'

export interface RAGPipelineConfig {
  huggingFaceApiKey: string
  embeddingModel?: string
  chunkSize?: number
  chunkOverlap?: number
  similarityThreshold?: number
  maxContextLength?: number
}

export interface QueryResult {
  answer: string
  sources: TextChunk[]
  confidence: number
  processingTime: number
}

export class RAGPipeline {
  private textProcessor: TextProcessor
  private hf: HfInference
  private apiService: ServerApiService
  private config: Required<RAGPipelineConfig>

  constructor(config: RAGPipelineConfig) {
    this.config = {
      embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
      chunkSize: 1000,
      chunkOverlap: 200,
      similarityThreshold: 0.5,
      maxContextLength: 4000,
      ...config
    }

    this.hf = new HfInference(this.config.huggingFaceApiKey)
    this.textProcessor = new TextProcessor(
      this.config.huggingFaceApiKey,
      this.config.embeddingModel
    )
    this.apiService = ServerApiService.getInstance()
  }

  /**
   * Initialize the RAG system
   */
  async initialize(request?: Request): Promise<void> {
    try {
      // Initialize the API service
      await this.apiService.initialize(request)

      // Load existing chunks from database
      const existingChunks = await db.documentChunk.findMany({
        include: {
          document: true
        }
      })

      console.log(`Found ${existingChunks.length} existing chunks in database`)

      // Convert to TextChunk format and add to vector store
      const textChunks: TextChunk[] = existingChunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        metadata: {
          ...JSON.parse(chunk.metadata),
          documentId: chunk.documentId,
          documentName: chunk.document.originalName
        },
        embedding: JSON.parse(chunk.embedding)
      }))

      await globalVectorStore.addEntries(textChunks)
      console.log('RAG system initialized successfully')

    } catch (error) {
      console.error('Error initializing RAG system:', error)
      throw new Error(`Failed to initialize RAG system: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Process a document and add it to the RAG system
   */
  async processDocument(
    documentId: string,
    fileBuffer: Buffer,
    fileName: string,
    fileType: 'pdf' | 'docx'
  ): Promise<void> {
    const startTime = Date.now()

    try {
      console.log(`Starting document processing for ${fileName}`)

      // Step 1: Extract text from document
      let extractedText: string
      if (fileType === 'pdf') {
        extractedText = await this.textProcessor.extractTextFromPDF(fileBuffer)
      } else {
        extractedText = await this.textProcessor.extractTextFromDOCX(fileBuffer)
      }

      console.log(`Extracted ${extractedText.length} characters from ${fileName}`)

      // Step 2: Chunk the text
      const processingOptions: ProcessingOptions = {
        chunkSize: this.config.chunkSize,
        chunkOverlap: this.config.chunkOverlap,
        includeMetadata: true
      }

      const chunks = await this.textProcessor.chunkText(
        extractedText,
        documentId,
        fileName,
        processingOptions
      )

      console.log(`Created ${chunks.length} chunks from ${fileName}`)

      // Step 3: Generate embeddings
      const chunksWithEmbeddings = await this.textProcessor.generateEmbeddings(chunks)

      console.log(`Generated embeddings for ${chunksWithEmbeddings.length} chunks`)

      // Step 4: Store in vector store
      await globalVectorStore.addEntries(chunksWithEmbeddings)

      // Step 5: Save chunks to database
      for (const chunk of chunksWithEmbeddings) {
        await db.documentChunk.create({
          data: {
            documentId,
            content: chunk.content,
            chunkIndex: chunk.metadata.chunkIndex,
            metadata: JSON.stringify(chunk.metadata),
            embedding: JSON.stringify(chunk.embedding)
          }
        })
      }

      // Step 6: Update document status
      await db.document.update({
        where: { id: documentId },
        data: { status: 'ready' }
      })

      const processingTime = Date.now() - startTime
      console.log(`Document processing completed in ${processingTime}ms`)

    } catch (error) {
      console.error('Error processing document:', error)
      
      // Update document status to error
      await db.document.update({
        where: { id: documentId },
        data: { status: 'error' }
      })

      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Query the RAG system for an answer
   */
  async query(
    question: string,
    documentId?: string,
    options: {
      maxSources?: number
      includeContext?: boolean
    } = {}
  ): Promise<QueryResult> {
    const startTime = Date.now()
    const { maxSources = 5, includeContext = true } = options

    try {
      console.log(`Processing query: ${question}`)

      // Step 1: Generate query embedding
      const queryEmbedding = await this.hf.featureExtraction({
        model: this.config.embeddingModel,
        inputs: question
      }) as number[]

      // Step 2: Retrieve relevant chunks
      const relevantChunks = await globalVectorStore.search(queryEmbedding, {
        limit: maxSources,
        documentId,
        similarityThreshold: this.config.similarityThreshold
      })

      console.log(`Found ${relevantChunks.length} relevant chunks`)

      // Step 3: Build context
      let context = ''
      if (includeContext && relevantChunks.length > 0) {
        context = this.buildContext(relevantChunks)
      }

      // Step 4: Generate answer using AI
      const answer = await this.generateAnswer(question, context, relevantChunks)

      const processingTime = Date.now() - startTime
      console.log(`Query processed in ${processingTime}ms`)

      return {
        answer,
        sources: relevantChunks.map(chunk => ({
          id: chunk.id,
          content: chunk.content,
          metadata: chunk.metadata
        })) as TextChunk[],
        confidence: this.calculateConfidence(relevantChunks),
        processingTime
      }

    } catch (error) {
      console.error('Error processing query:', error)
      throw new Error(`Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate answer using AI with context
   */
  private async generateAnswer(
    question: string,
    context: string,
    relevantChunks: any[]
  ): Promise<string> {
    const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided document context. 

Your task:
1. Answer the user's question based ONLY on the provided context
2. If the context doesn't contain the answer, say "I don't have enough information in the provided documents to answer this question."
3. Be concise and accurate
4. Cite the relevant parts of the context that support your answer
5. Do not make up information or use external knowledge

Context:
${context}

Question: ${question}

Instructions:
- Provide a clear, direct answer
- Include specific quotes or references from the context when helpful
- If multiple sources are relevant, synthesize the information
- Keep your response focused on the question`

    try {
      const answer = await this.apiService.createChatCompletion([
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: question
        }
      ], {
        maxTokens: 1000,
        temperature: 0.1
      })

      return answer
    } catch (error) {
      console.error('Error generating answer:', error)
      return 'I encountered an error while generating your answer. Please try again.'
    }
  }

  /**
   * Build context from relevant chunks
   */
  private buildContext(chunks: any[]): string {
    let context = 'Relevant document excerpts:\n\n'
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      context += `Source ${i + 1} (from ${chunk.metadata.documentName}):\n`
      context += `${chunk.content}\n\n`
    }

    return context
  }

  /**
   * Calculate confidence score based on similarity scores
   */
  private calculateConfidence(chunks: any[]): number {
    if (chunks.length === 0) return 0
    
    // Simple confidence calculation based on number of relevant chunks
    // In a more sophisticated implementation, you could use actual similarity scores
    const baseConfidence = Math.min(chunks.length * 0.2, 0.8)
    const lengthBonus = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) > 1000 ? 0.1 : 0
    const diversityBonus = chunks.length > 1 ? 0.1 : 0
    
    return Math.min(baseConfidence + lengthBonus + diversityBonus, 1.0)
  }

  /**
   * Get system statistics
   */
  async getStats(): Promise<{
    totalDocuments: number
    totalChunks: number
    averageChunksPerDocument: number
    totalEmbeddings: number
  }> {
    const [totalDocuments, totalChunks] = await Promise.all([
      db.document.count(),
      db.documentChunk.count()
    ])

    return {
      totalDocuments,
      totalChunks,
      averageChunksPerDocument: totalDocuments > 0 ? totalChunks / totalDocuments : 0,
      totalEmbeddings: await globalVectorStore.count()
    }
  }
}