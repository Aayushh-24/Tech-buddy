'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Github, 
  Link, 
  Unlink, 
  Search, 
  Star, 
  GitBranch, 
  Code,
  FileText,
  Loader2,
  ExternalLink,
  Users,
  Calendar
} from 'lucide-react'

interface Repository {
  id: string
  name: string
  owner: string
  description: string
  language: string
  stars: number
  forks: number
  lastUpdated: string
  isConnected: boolean
}

export default function GitHubPage() {
  const [githubToken, setGithubToken] = useState('')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    setLoading(true)
    try {
      // Simulate API call - in real implementation, this would fetch from your database
      const mockRepos: Repository[] = [
        {
          id: '1',
          name: 'techbuddy-frontend',
          owner: 'your-username',
          description: 'Frontend application for TechBuddy AI documentation platform',
          language: 'TypeScript',
          stars: 42,
          forks: 8,
          lastUpdated: '2024-01-15T10:30:00Z',
          isConnected: true
        },
        {
          id: '2',
          name: 'techbuddy-backend',
          owner: 'your-username',
          description: 'Backend API and services for TechBuddy platform',
          language: 'Python',
          stars: 28,
          forks: 5,
          lastUpdated: '2024-01-14T15:45:00Z',
          isConnected: false
        }
      ]
      setRepositories(mockRepos)
    } catch (error) {
      console.error('Error fetching repositories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectGitHub = async () => {
    if (!githubToken.trim()) return

    setConnecting(true)
    try {
      // Simulate API call to validate and store GitHub token
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In real implementation, you would:
      // 1. Validate the GitHub token
      // 2. Store it securely in the database
      // 3. Fetch user's repositories
      
      alert('GitHub connected successfully!')
      setGithubToken('')
      fetchRepositories()
    } catch (error) {
      console.error('Error connecting GitHub:', error)
      alert('Failed to connect GitHub. Please check your token.')
    } finally {
      setConnecting(false)
    }
  }

  const handleConnectRepository = async (repoId: string) => {
    try {
      // Simulate API call to connect repository
      setRepositories(prev => 
        prev.map(repo => 
          repo.id === repoId 
            ? { ...repo, isConnected: true }
            : repo
        )
      )
    } catch (error) {
      console.error('Error connecting repository:', error)
    }
  }

  const handleDisconnectRepository = async (repoId: string) => {
    try {
      // Simulate API call to disconnect repository
      setRepositories(prev => 
        prev.map(repo => 
          repo.id === repoId 
            ? { ...repo, isConnected: false }
            : repo
        )
      )
    } catch (error) {
      console.error('Error disconnecting repository:', error)
    }
  }

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GitHub Connect</h1>
          <p className="text-muted-foreground">
            Connect your GitHub repositories to analyze code and generate documentation
          </p>
        </div>

        <Tabs defaultValue="connect" className="space-y-6">
          <TabsList>
            <TabsTrigger value="connect">Connect GitHub</TabsTrigger>
            <TabsTrigger value="repositories">My Repositories</TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connect to GitHub</CardTitle>
                <CardDescription>
                  Enter your GitHub Personal Access Token to connect your repositories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                  <Input
                    id="github-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your token needs the following scopes: repo, read:org
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How to create a Personal Access Token:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to GitHub Settings → Developer Settings → Personal Access Tokens</li>
                    <li>Click "Generate new token" → "Generate new token (classic)"</li>
                    <li>Enter a note and select the required scopes</li>
                    <li>Click "Generate token" and copy it</li>
                  </ol>
                </div>

                <Button 
                  onClick={handleConnectGitHub} 
                  disabled={!githubToken.trim() || connecting}
                  className="w-full"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4 mr-2" />
                      Connect GitHub
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repositories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Repositories</CardTitle>
                <CardDescription>
                  Manage your connected GitHub repositories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search repositories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : filteredRepositories.length === 0 ? (
                  <div className="text-center py-8">
                    <Github className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2">No repositories found</p>
                    <p className="text-muted-foreground mb-4">
                      Connect your GitHub account to see your repositories
                    </p>
                    <Button onClick={() => document.querySelector('[value="connect"]')?.click()}>
                      Connect GitHub
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRepositories.map((repo) => (
                      <Card key={repo.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{repo.name}</h3>
                                <Badge variant="outline">{repo.language}</Badge>
                                {repo.isConnected && (
                                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground mb-3">{repo.description}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4" />
                                  {repo.stars}
                                </div>
                                <div className="flex items-center gap-1">
                                  <GitBranch className="w-4 h-4" />
                                  {repo.forks}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(repo.lastUpdated)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              {repo.isConnected ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDisconnectRepository(repo.id)}
                                >
                                  <Unlink className="w-4 h-4 mr-2" />
                                  Disconnect
                                </Button>
                              ) : (
                                <Button 
                                  size="sm"
                                  onClick={() => handleConnectRepository(repo.id)}
                                >
                                  <Link className="w-4 h-4 mr-2" />
                                  Connect
                                </Button>
                              )}
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