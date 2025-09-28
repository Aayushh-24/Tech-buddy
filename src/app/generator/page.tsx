'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileCode, 
  Sparkles, 
  Download, 
  Copy, 
  Eye,
  Loader2,
  Code,
  FileText,
  BookOpen,
  Users,
  Settings,
  Plus,
  Trash2
} from 'lucide-react'

interface GeneratedDocument {
  id: string
  title: string
  content: string
  docType: string
  tone: string
  audience: string
  createdAt: string
}

interface CodeContext {
  language: string
  framework: string
  description: string
  codeSnippet: string
}

export default function GeneratorPage() {
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('')
  const [tone, setTone] = useState('')
  const [audience, setAudience] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [codeContexts, setCodeContexts] = useState<CodeContext[]>([])
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGeneratedDocuments()
  }, [])

  const fetchGeneratedDocuments = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockDocs: GeneratedDocument[] = [
        {
          id: '1',
          title: 'API Reference Documentation',
          content: '# API Reference\n\nThis documentation provides comprehensive information about our REST API...',
          docType: 'api-reference',
          tone: 'professional',
          audience: 'developers',
          createdAt: '2024-01-15T10:30:00Z'
        }
      ]
      setGeneratedDocuments(mockDocs)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const addCodeContext = () => {
    setCodeContexts(prev => [
      ...prev,
      {
        language: '',
        framework: '',
        description: '',
        codeSnippet: ''
      }
    ])
  }

  const updateCodeContext = (index: number, field: keyof CodeContext, value: string) => {
    setCodeContexts(prev =>
      prev.map((context, i) =>
        i === index ? { ...context, [field]: value } : context
      )
    )
  }

  const removeCodeContext = (index: number) => {
    setCodeContexts(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    if (!title || !docType || !tone || !audience) {
      alert('Please fill in all required fields')
      return
    }

    setIsGenerating(true)
    try {
      // Simulate API call to generate documentation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const mockContent = `# ${title}

## Overview
This ${docType.replace('-', ' ')} provides comprehensive information for ${audience}.

## Getting Started
${additionalContext || 'This section covers the basics you need to know.'}

${codeContexts.length > 0 ? `
## Code Examples
${codeContexts.map((context, index) => `
### ${context.description || `Example ${index + 1}`}

\`\`\`${context.language}
${context.codeSnippet}
\`\`\`
`).join('')}
` : ''}

## Additional Resources
- Check the official documentation for more details
- Join our community for support

---
*Generated with TechBuddy AI*`

      setGeneratedContent(mockContent)
    } catch (error) {
      console.error('Error generating documentation:', error)
      alert('Failed to generate documentation. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedContent) return

    try {
      // Simulate API call to save document
      const newDoc: GeneratedDocument = {
        id: Date.now().toString(),
        title,
        content: generatedContent,
        docType,
        tone,
        audience,
        createdAt: new Date().toISOString()
      }
      setGeneratedDocuments(prev => [newDoc, ...prev])
      setGeneratedContent('')
      setTitle('')
      setDocType('')
      setTone('')
      setAudience('')
      setAdditionalContext('')
      setCodeContexts([])
      alert('Document saved successfully!')
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Failed to save document. Please try again.')
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    alert('Copied to clipboard!')
  }

  const downloadDocument = () => {
    const blob = new Blob([generatedContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doc Generator</h1>
          <p className="text-muted-foreground">
            Generate professional technical documentation with AI
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList>
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="history">Generated Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuration Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Document Configuration</CardTitle>
                  <CardDescription>
                    Configure your document settings and provide context
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter document title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Document Type *</Label>
                      <Select value={docType} onValueChange={setDocType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api-reference">API Reference</SelectItem>
                          <SelectItem value="tutorial">Tutorial</SelectItem>
                          <SelectItem value="guide">User Guide</SelectItem>
                          <SelectItem value="readme">README</SelectItem>
                          <SelectItem value="technical-spec">Technical Spec</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tone *</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="beginner-friendly">Beginner Friendly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Audience *</Label>
                    <Select value={audience} onValueChange={setAudience}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="developers">Developers</SelectItem>
                        <SelectItem value="managers">Project Managers</SelectItem>
                        <SelectItem value="end-users">End Users</SelectItem>
                        <SelectItem value="stakeholders">Stakeholders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="context">Additional Context</Label>
                    <Textarea
                      id="context"
                      placeholder="Provide additional context about your project, requirements, or specific topics to cover..."
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Code Context</Label>
                      <Button variant="outline" size="sm" onClick={addCodeContext}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Code
                      </Button>
                    </div>

                    {codeContexts.map((context, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Code Snippet {index + 1}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCodeContext(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Language (e.g., JavaScript)"
                              value={context.language}
                              onChange={(e) => updateCodeContext(index, 'language', e.target.value)}
                            />
                            <Input
                              placeholder="Framework (e.g., React)"
                              value={context.framework}
                              onChange={(e) => updateCodeContext(index, 'framework', e.target.value)}
                            />
                          </div>
                          <Input
                            placeholder="Description of what this code does"
                            value={context.description}
                            onChange={(e) => updateCodeContext(index, 'description', e.target.value)}
                          />
                          <Textarea
                            placeholder="Paste your code snippet here..."
                            value={context.codeSnippet}
                            onChange={(e) => updateCodeContext(index, 'codeSnippet', e.target.value)}
                            rows={4}
                            className="font-mono text-sm"
                          />
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !title || !docType || !tone || !audience}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Documentation
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Generated Content</CardTitle>
                  <CardDescription>
                    Preview and export your generated documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedContent ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={copyToClipboard}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={downloadDocument}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                          <FileText className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                      <div className="border rounded-lg p-4 bg-muted/50 max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium mb-2">No content generated yet</p>
                      <p className="text-muted-foreground">
                        Configure your document and click "Generate Documentation" to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated Documents</CardTitle>
                <CardDescription>
                  View and manage your previously generated documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : generatedDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2">No documents generated yet</p>
                    <p className="text-muted-foreground mb-4">
                      Create your first AI-generated documentation
                    </p>
                    <Button onClick={() => document.querySelector('[value="create"]')?.click()}>
                      Generate Documentation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {generatedDocuments.map((doc) => (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{doc.title}</h3>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{doc.docType.replace('-', ' ')}</Badge>
                                <Badge variant="outline">{doc.tone}</Badge>
                                <Badge variant="outline">{doc.audience}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {doc.content.substring(0, 150)}...
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Generated on {new Date(doc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Download
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
      </div>
    </MainLayout>
  )
}