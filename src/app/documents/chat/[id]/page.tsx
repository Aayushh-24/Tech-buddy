'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { InlineError } from '@/components/ui/inline-error'
import { useApi } from '@/hooks/use-api'
import { 
  Send, 
  ArrowLeft, 
  FileText, 
  Bot, 
  User,
  Loader2,
  Brain,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  metadata?: {
    sources?: Array<{
      id: string
      content: string
      metadata: any
    }>
    confidence?: number
    processingTime?: number
    ragEnabled?: boolean
  }
}

interface Document {
  id: string
  originalName: string
  fileType: string
  status: string
}

interface RAGStats {
  totalDocuments: number
  totalChunks: number
  averageChunksPerDocument: number
  totalEmbeddings: number
}

export default function DocumentChatPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string
  const [document, setDocument] = useState<Document | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingDocument, setLoadingDocument] = useState(true)
  const [ragStats, setRagStats] = useState<RAGStats | null>(null)
  const [ragEnabled, setRagEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { execute: fetchDocument } = useApi<Document>()
  const { execute: fetchMessages } = useApi<Message[]>()
  const { execute: fetchRagStats } = useApi<{ stats: RAGStats; ragEnabled: boolean }>()

  useEffect(() => {
    loadDocument()
    loadMessages()
    loadRagStats()
  }, [documentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadDocument = async () => {
    try {
      const doc = await fetchDocument(async () => {
        const response = await fetch(`/api/documents/${documentId}`)
        if (!response.ok) throw new Error('Failed to fetch document')
        const data = await response.json()
        return data.document
      })
      setDocument(doc)
    } catch (error) {
      console.error('Error fetching document:', error)
    } finally {
      setLoadingDocument(false)
    }
  }

  const loadMessages = async () => {
    try {
      const messageList = await fetchMessages(async () => {
        const response = await fetch(`/api/documents/${documentId}/messages`)
        if (!response.ok) throw new Error('Failed to fetch messages')
        const data = await response.json()
        return data.messages
      })
      setMessages(messageList)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const loadRagStats = async () => {
    try {
      const stats = await fetchRagStats(async () => {
        const response = await fetch('/api/rag/stats')
        if (!response.ok) return { stats: {} as RAGStats, ragEnabled: false }
        return await response.json()
      })
      if (stats) {
        setRagStats(stats.stats)
        setRagEnabled(stats.ragEnabled)
      }
    } catch (error) {
      console.error('Error fetching RAG stats:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/documents/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          question: input
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get answer')
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.answer,
        createdAt: new Date().toISOString(),
        metadata: {
          sources: data.sources,
          confidence: data.confidence,
          processingTime: data.processingTime,
          ragEnabled: data.ragEnabled
        }
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error asking question:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  if (loadingDocument) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (!document) {
    return (
      <MainLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Document not found</h1>
          <Button onClick={() => router.push('/documents')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push('/documents')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">{document.originalName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={
                  document.status === 'ready' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }>
                  {document.status === 'ready' ? 'Ready' : 'Processing'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {document.fileType.toUpperCase()}
                </span>
                {ragEnabled && (
                  <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    RAG Enabled
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RAG Stats Panel */}
        {ragEnabled && ragStats && (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">RAG System Active</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {ragStats.totalDocuments} docs
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {ragStats.totalChunks} chunks
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {ragStats.averageChunksPerDocument.toFixed(1)} avg
                    </div>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Document Q&A {ragEnabled && '(Powered by RAG)'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2">Start a conversation</p>
                    <p className="text-muted-foreground">
                      Ask questions about this document and I'll help you find answers.
                      {ragEnabled && ' I\'ll use advanced RAG technology to provide accurate responses.'}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {/* RAG Metadata */}
                        {message.role === 'assistant' && message.metadata?.ragEnabled && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                              <div className="flex items-center gap-2">
                                <Brain className="w-3 h-3" />
                                RAG Enhanced Response
                              </div>
                              <div className="flex items-center gap-3">
                                {message.metadata.confidence && (
                                  <div className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {Math.round(message.metadata.confidence * 100)}% confidence
                                  </div>
                                )}
                                {message.metadata.processingTime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {message.metadata.processingTime}ms
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {message.metadata.sources && message.metadata.sources.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium">Sources:</p>
                                {message.metadata.sources.slice(0, 3).map((source, index) => (
                                  <div key={source.id} className="text-xs bg-background/50 p-2 rounded border">
                                    <p className="font-medium">Source {index + 1}:</p>
                                    <p className="text-muted-foreground mt-1 line-clamp-2">
                                      {source.content.substring(0, 100)}...
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Form */}
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={ragEnabled 
                    ? "Ask a question about this document (RAG powered)..." 
                    : "Ask a question about this document..."
                  }
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}