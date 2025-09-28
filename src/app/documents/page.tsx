'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ErrorBoundary } from '@/components/error-boundary/error-boundary'
import { LoadingCard } from '@/components/loading/loading-spinner'
import { InlineError } from '@/components/ui/inline-error'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  MessageSquare,
  Download,
  Trash2,
  Loader2,
  Sparkles,
  Zap,
  FileSymlink
} from 'lucide-react'
import Link from 'next/link'

interface Document {
  id: string
  filename: string
  originalName: string
  fileType: string
  fileSize: number
  status: string
  createdAt: string
}

export default function DocumentsPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reprocessingId, setReprocessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Fetch documents with useCallback for better performance
  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/documents')
      if (!response.ok) throw new Error('Failed to fetch documents')
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setSelectedFile(file)
      }
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setSelectedFile(file)
      setUploadError(null)
      
      // Auto-upload after selection
      setTimeout(() => {
        handleUpload()
      }, 100)
    } else if (file) {
      setUploadError('Please select a PDF or DOCX file')
    }
    
    // Reset the file input
    event.target.value = ''
  }

  const handleFileInputClick = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      // Refresh documents list
      await fetchDocuments()
      
      // Reset form
      setSelectedFile(null)
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      setTimeout(() => setUploadProgress(0), 1000)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleReprocess = async (documentId: string) => {
    setReprocessingId(documentId)
    try {
      // Update document status to processing first
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'processing' })
      })

      // Trigger processing
      const response = await fetch(`/api/documents/${documentId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to reprocess document')
      }

      // Refresh documents list
      await fetchDocuments()
    } catch (err) {
      console.error('Error reprocessing document:', err)
      setError(err instanceof Error ? err.message : 'Failed to reprocess document')
    } finally {
      setReprocessingId(null)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    setDeletingId(documentId)
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      // Refresh documents list
      await fetchDocuments()
    } catch (err) {
      console.error('Error deleting document:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ready</Badge>
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Processing</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unknown</Badge>
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with gradient and animation */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">AI-Powered Document Q&A</span>
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Document Intelligence
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your technical documents and get instant AI-powered answers to your questions
          </p>
        </div>

        <ErrorBoundary>
          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center gap-2">
                <FileSymlink className="w-4 h-4" />
                Library ({documents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <Card className="border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-lg transition-all duration-300">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Upload New Document
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Transform your documents into interactive knowledge bases
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Drag and drop area */}
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-100 scale-105' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={handleFileInputClick}
                  >
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {dragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          or click to browse from your computer
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">PDF files</Badge>
                        <Badge variant="outline">DOCX files</Badge>
                        <Badge variant="outline">Max 10MB</Badge>
                      </div>
                    </div>
                    
                    <Input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading}
                    />
                    <Button 
                      variant="outline" 
                      className="cursor-pointer mt-4 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                      disabled={uploading}
                      onClick={handleFileInputClick}
                    >
                      Choose File
                    </Button>
                  </div>

                  {/* Upload error alert */}
                  {uploadError && (
                    <Alert className="border-red-200 bg-red-50">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {uploadError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Selected file preview */}
                  {selectedFile && (
                    <Card className="bg-white border-green-200 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(selectedFile.size)} • {selectedFile.type.split('/')[1].toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <Button 
                            onClick={handleUpload} 
                            disabled={uploading}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium px-6"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Document
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {uploading && (
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Upload progress</span>
                              <span className="font-medium">{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="library" className="space-y-6">
              <Card className="bg-gradient-to-br from-gray-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                    Your Document Library
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Manage your uploaded documents and start AI conversations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <InlineError message={error} />
                  ) : loading ? (
                    <LoadingCard title="Loading Documents" description="Fetching your document library..." />
                  ) : !documents || documents.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mb-6">
                        <FileText className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Upload your first document to unlock AI-powered question answering and document analysis
                      </p>
                      <Button 
                        onClick={() => {
                          const tab = document.querySelector('[value="upload"]') as HTMLElement
                          tab?.click()
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-6"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Your First Document
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {documents.map((doc) => (
                        <Card key={doc.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                    {doc.originalName}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-2">
                                    {getStatusIcon(doc.status)}
                                    <span className="text-xs text-muted-foreground">
                                      {formatFileSize(doc.fileSize)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(doc.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="mt-2">
                                    {getStatusBadge(doc.status)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-2 pt-2">
                                {doc.status === 'ready' && (
                                  <Link href={`/documents/chat/${doc.id}`}>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1 hover:bg-blue-50 hover:border-blue-300"
                                    >
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      Chat
                                    </Button>
                                  </Link>
                                )}
                                {(doc.status === 'processing' || doc.status === 'error') && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 hover:bg-yellow-50 hover:border-yellow-300"
                                    onClick={() => handleReprocess(doc.id)}
                                    disabled={reprocessingId === doc.id || loading}
                                  >
                                    {reprocessingId === doc.id ? (
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <Loader2 className="w-3 h-3 mr-1" />
                                    )}
                                    {reprocessingId === doc.id ? 'Processing...' : 'Reprocess'}
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="hover:bg-red-100 text-red-600"
                                  onClick={() => handleDelete(doc.id)}
                                  disabled={deletingId === doc.id}
                                >
                                  {deletingId === doc.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ErrorBoundary>
      </div>
    </MainLayout>
  )
}