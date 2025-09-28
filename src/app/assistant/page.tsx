'use client'

import { useState, useEffect, useRef } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientApiService } from '@/lib/client-api'
import { ApiStatusService } from '@/lib/api-status-service'
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  Code,
  FileText,
  Github,
  Lightbulb,
  BookOpen,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Copy,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  feedback?: 'good' | 'bad'
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  prompt: string
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI technical assistant. I can help you with:\n\n• Code review and optimization\n• Technical documentation\n• Debugging and troubleshooting\n• Best practices and architecture\n• GitHub repository analysis\n• Document Q&A\n\nHow can I assist you today?",
      timestamp: new Date().toISOString()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState({ hasKey: false, isValid: false, source: 'Not Configured' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Update API key status when component mounts
  useEffect(() => {
    const loadApiStatus = async () => {
      try {
        const status = await ApiStatusService.getApiKeyStatus()
        setApiKeyStatus(status)
      } catch (error) {
        console.error('Error loading API status:', error)
        setApiKeyStatus({ hasKey: false, isValid: false, source: 'Error' })
      }
    }
    
    loadApiStatus()
  }, [])

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Code Review',
      description: 'Get feedback on your code',
      icon: <Code className="w-5 h-5" />,
      prompt: 'Can you review this code and suggest improvements?'
    },
    {
      id: '2',
      title: 'Documentation Help',
      description: 'Generate technical documentation',
      icon: <FileText className="w-5 h-5" />,
      prompt: 'Help me write documentation for my project'
    },
    {
      id: '3',
      title: 'Debug Issue',
      description: 'Troubleshoot coding problems',
      icon: <Lightbulb className="w-5 h-5" />,
      prompt: 'I\'m having an issue with my code, can you help me debug it?'
    },
    {
      id: '4',
      title: 'Architecture Advice',
      description: 'Get architectural guidance',
      icon: <BookOpen className="w-5 h-5" />,
      prompt: 'What\'s the best architecture for this type of application?'
    }
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Check if API key is configured
    if (!apiKeyStatus.hasKey || !apiKeyStatus.isValid) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ **API Key Required**\n\nTo use the AI assistant, you need to configure your OpenRouter API key first. Please go to Settings and add your API key to enable AI-powered features.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await ClientApiService.post('/api/assistant', {
        message: input
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Error**\n\n${error.message || 'Failed to get response from AI assistant. Please try again.'}`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
  }

  const handleFeedback = (messageId: string, feedback: 'good' | 'bad') => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    )
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight gradient-text">AI Assistant</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your personal AI assistant for technical questions and development help
          </p>
        </div>

        {/* API Key Status Banner */}
        {!apiKeyStatus.isValid && (
          <Alert className={`border-orange-200 ${apiKeyStatus.hasKey ? 'bg-yellow-50' : 'bg-red-50'}`}>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className={apiKeyStatus.hasKey ? "text-yellow-800" : "text-red-800"}>
              {apiKeyStatus.hasKey 
                ? 'Your API key needs validation. Please go to Settings to validate your API key.'
                : 'API key required. Please add your OpenRouter API key in Settings to use AI features.'
              }
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2"
                onClick={() => window.location.href = '/settings'}
              >
                Go to Settings →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleQuickAction(action.prompt)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600">
                        {action.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{action.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-4 card-hover">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {apiKeyStatus.isValid ? (
                    <Wifi className="w-5 h-5 text-green-600" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-600" />
                  )}
                  Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Code className="w-4 h-4 text-blue-600" />
                  <span className={apiKeyStatus.isValid ? '' : 'text-muted-foreground'}>Code analysis & review</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className={apiKeyStatus.isValid ? '' : 'text-muted-foreground'}>Documentation generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Github className="w-4 h-4 text-purple-600" />
                  <span className={apiKeyStatus.isValid ? '' : 'text-muted-foreground'}>GitHub repository insights</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  <span className={apiKeyStatus.isValid ? '' : 'text-muted-foreground'}>Debugging & troubleshooting</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-orange-600" />
                  <span className={apiKeyStatus.isValid ? '' : 'text-muted-foreground'}>Best practices & patterns</span>
                </div>
                {!apiKeyStatus.isValid && (
                  <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                    🔒 Connect your API key to unlock all AI capabilities
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversation
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
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
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.role === 'assistant' && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(message.content)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 w-6 p-0 ${
                                    message.feedback === 'good' ? 'text-green-600' : ''
                                  }`}
                                  onClick={() => handleFeedback(message.id, 'good')}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 w-6 p-0 ${
                                    message.feedback === 'bad' ? 'text-red-600' : ''
                                  }`}
                                  onClick={() => handleFeedback(message.id, 'bad')}
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
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
                      placeholder={apiKeyStatus.isValid 
                        ? "Ask a technical question or request assistance..." 
                        : apiKeyStatus.hasKey 
                          ? "Validating API key..." 
                          : "Configure your API key in Settings to start chatting..."
                      }
                      disabled={isLoading || !apiKeyStatus.isValid}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={isLoading || !input.trim() || !apiKeyStatus.isValid}
                      className={apiKeyStatus.isValid ? '' : 'cursor-not-allowed'}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  {!apiKeyStatus.isValid && (
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Tip: Add your OpenRouter API key in Settings to enable AI conversations
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}