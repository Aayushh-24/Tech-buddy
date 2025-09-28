'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Settings, 
  Key, 
  Github, 
  Bot, 
  User,
  Shield,
  Database,
  Save,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  BarChart3,
  FileText,
  MessageSquare,
  Zap,
  Crown,
  TrendingUp,
  Clock
} from 'lucide-react'
import { ApiStatusService } from '@/lib/api-status-service'

interface UsageStats {
  documentsUploaded: number
  questionsAsked: number
  tokensUsed: number
  lastActiveAt?: Date
  subscriptionType: string
  subscriptionEnds?: Date
}

interface UsageLimits {
  documentsUploaded: number
  questionsAsked: number
  tokensUsed: number
}

interface UsageDisplay {
  usage: UsageStats
  limits: UsageLimits
  remaining: UsageLimits
  percentages: UsageLimits
}

interface UserSettings {
  name: string
  email: string
  avatar: string
  githubToken: string
  notifications: {
    email: boolean
    browser: boolean
    documentReady: boolean
    githubSync: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    defaultTone: string
    defaultAudience: string
    autoSave: boolean
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    avatar: '',
    githubToken: '',
    notifications: {
      email: true,
      browser: true,
      documentReady: true,
      githubSync: false
    },
    preferences: {
      theme: 'auto',
      defaultTone: 'professional',
      defaultAudience: 'developers',
      autoSave: true
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState({
    hasKey: false,
    isValid: false,
    source: 'Not Configured'
  })
  const [testingApi, setTestingApi] = useState(false)
  const [usageDisplay, setUsageDisplay] = useState<UsageDisplay | null>(null)
  const [apiTestResult, setApiTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    fetchSettings()
    loadApiKeyStatus()
    loadUsageStats()
  }, [])

  const loadApiKeyStatus = async () => {
    try {
      const status = await ApiStatusService.getApiKeyStatus()
      setApiKeyStatus(status)
    } catch (error) {
      console.error('Error loading API key status:', error)
      setApiKeyStatus({
        hasKey: false,
        isValid: false,
        source: 'Error'
      })
    }
  }

  const loadUsageStats = async () => {
    try {
      const response = await fetch('/api/usage/stats')
      if (response.ok) {
        const data = await response.json()
        setUsageDisplay(data)
      }
    } catch (error) {
      console.error('Error loading usage stats:', error)
    }
  }

  const fetchSettings = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setSettings(prev => ({
        ...prev,
        name: 'John Doe',
        email: 'john@example.com',
        githubToken: 'ghp_********************************'
      }))
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestApi = async () => {
    setTestingApi(true)
    setApiTestResult(null)

    try {
      const result = await ApiStatusService.testApiConnection()
      setApiTestResult(result)
      loadApiKeyStatus()
    } catch (error) {
      setApiTestResult({
        success: false,
        message: `API key test failed: ${error.message}`
      })
    } finally {
      setTestingApi(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show success message
      setApiTestResult({
        success: true,
        message: 'Settings saved successfully!'
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      setApiTestResult({
        success: false,
        message: 'Failed to save settings. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateNotificationSetting = (key: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const updatePreference = (key: keyof UserSettings['preferences'], value: any) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }))
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight gradient-text">Settings</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage your account, usage statistics, and preferences to unlock the full potential of TechBuddy
          </p>
        </div>

        {/* API Key Status Banner */}
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  apiKeyStatus.isValid 
                    ? 'bg-green-100' 
                    : apiKeyStatus.hasKey 
                      ? 'bg-yellow-100' 
                      : 'bg-red-100'
                }`}>
                  {apiKeyStatus.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : apiKeyStatus.hasKey ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {apiKeyStatus.isValid 
                      ? 'AI Features Ready' 
                      : apiKeyStatus.hasKey 
                        ? 'API Key Needs Validation' 
                        : 'API Key Required'
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {apiKeyStatus.isValid 
                      ? `API key configured via ${apiKeyStatus.source}`
                      : apiKeyStatus.hasKey 
                        ? 'API key found but needs validation'
                        : 'API key not configured in environment variables'
                    }
                  </p>
                </div>
              </div>
              <Badge variant={
                apiKeyStatus.isValid 
                  ? 'default' 
                  : apiKeyStatus.hasKey 
                    ? 'secondary' 
                    : 'destructive'
              }>
                {apiKeyStatus.isValid ? 'Connected' : apiKeyStatus.hasKey ? 'Needs Setup' : 'Not Connected'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Status
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-6">
            {usageDisplay && (
              <>
                {/* Subscription Status */}
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 gradient-text">
                      <Crown className="w-5 h-5" />
                      Subscription Status
                    </CardTitle>
                    <CardDescription>
                      Your current subscription and usage limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          usageDisplay.usage.subscriptionType === 'premium' 
                            ? 'bg-gradient-to-r from-purple-400 to-purple-600' 
                            : 'bg-gradient-to-r from-blue-400 to-blue-600'
                        }`}>
                          {usageDisplay.usage.subscriptionType === 'premium' ? (
                            <Crown className="w-5 h-5 text-white" />
                          ) : (
                            <Zap className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {usageDisplay.usage.subscriptionType === 'premium' ? 'Premium Plan' : 'Free Plan'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {usageDisplay.usage.subscriptionType === 'premium' 
                              ? `Expires on ${formatDate(usageDisplay.usage.subscriptionEnds)}`
                              : 'Upgrade for unlimited usage'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          usageDisplay.usage.subscriptionType === 'premium' 
                            ? 'default' 
                            : 'secondary'
                        }>
                          {usageDisplay.usage.subscriptionType === 'premium' ? 'Active' : 'Free Tier'}
                        </Badge>
                      </div>
                    </div>

                    {usageDisplay.usage.subscriptionType === 'free' && (
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Usage Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Documents Usage */}
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Documents
                      </CardTitle>
                      <CardDescription>
                        {usageDisplay.usage.documentsUploaded} / {usageDisplay.limits.documentsUploaded} uploaded
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress 
                        value={usageDisplay.percentages.documentsUploaded} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{usageDisplay.remaining.documentsUploaded} remaining</span>
                        <span>{usageDisplay.percentages.documentsUploaded}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Questions Usage */}
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        Questions
                      </CardTitle>
                      <CardDescription>
                        {usageDisplay.usage.questionsAsked} / {usageDisplay.limits.questionsAsked} asked
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress 
                        value={usageDisplay.percentages.questionsAsked} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{usageDisplay.remaining.questionsAsked} remaining</span>
                        <span>{usageDisplay.percentages.questionsAsked}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tokens Usage */}
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        AI Tokens
                      </CardTitle>
                      <CardDescription>
                        {usageDisplay.usage.tokensUsed.toLocaleString()} / {usageDisplay.limits.tokensUsed.toLocaleString()} used
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress 
                        value={usageDisplay.percentages.tokensUsed} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{usageDisplay.remaining.tokensUsed.toLocaleString()} remaining</span>
                        <span>{usageDisplay.percentages.tokensUsed}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Last Activity */}
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Your last active session and usage statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Last Active</p>
                        <p className="font-semibold">{formatDate(usageDisplay.usage.lastActiveAt)}</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Documents</p>
                        <p className="font-semibold text-blue-600">{usageDisplay.usage.documentsUploaded}</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Questions</p>
                        <p className="font-semibold text-green-600">{usageDisplay.usage.questionsAsked}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 gradient-text">
                    <Shield className="w-5 h-5" />
                    OpenRouter API Status
                  </CardTitle>
                  <CardDescription>
                    Server-side API key configuration and status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">API Key Status</span>
                      <Badge variant={
                        apiKeyStatus.isValid 
                          ? 'default' 
                          : apiKeyStatus.hasKey 
                            ? 'secondary' 
                            : 'destructive'
                      }>
                        {apiKeyStatus.isValid ? 'Configured' : apiKeyStatus.hasKey ? 'Needs Validation' : 'Not Found'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Key Source</span>
                      <span className="text-sm text-muted-foreground">{apiKeyStatus.source}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Connection Test</span>
                      <Button 
                        onClick={handleTestApi} 
                        disabled={testingApi}
                        variant="outline"
                        size="sm"
                      >
                        {testingApi ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          'Test Connection'
                        )}
                      </Button>
                    </div>
                  </div>

                  {apiTestResult && (
                    <Alert className={apiTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      {apiTestResult.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <AlertDescription className={apiTestResult.success ? "text-green-800" : "text-red-800"}>
                        {apiTestResult.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🔐 Security Information</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• API keys are stored securely in environment variables</li>
                      <li>• Keys are never exposed to client-side code</li>
                      <li>• All AI processing happens on the server</li>
                      <li>• Your keys are safe and secure</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      For deployment, add your OpenRouter API key to your environment variables as{' '}
                      <code className="bg-blue-100 px-1 rounded">OPENROUTER_API_KEY</code>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 gradient-text">
                    <Github className="w-5 h-5" />
                    GitHub Integration
                  </CardTitle>
                  <CardDescription>
                    Connect your GitHub account for repository analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Personal Access Token</Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={settings.githubToken}
                        onChange={(e) => setSettings(prev => ({ ...prev, githubToken: e.target.value }))}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="font-mono"
                      />
                      {settings.githubToken && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSettings(prev => ({ ...prev, githubToken: '' }))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {settings.githubToken ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">GitHub token is configured</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-700">GitHub token not configured</span>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      Create a personal access token with{' '}
                      <code className="bg-blue-100 px-1 rounded">repo</code> scope from{' '}
                      <a 
                        href="https://github.com/settings/tokens" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline flex items-center gap-1 inline"
                      >
                        GitHub Settings
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 gradient-text">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Manage your account details and profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    value={settings.avatar}
                    onChange={(e) => setSettings(prev => ({ ...prev, avatar: e.target.value }))}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full button-hover bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Account Information
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 gradient-text">
                  <Settings className="w-5 h-5" />
                  Application Preferences
                </CardTitle>
                <CardDescription>
                  Customize your experience with application settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Theme</Label>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                    <div className="flex gap-2">
                      {(['light', 'dark', 'auto'] as const).map((theme) => (
                        <Button
                          key={theme}
                          variant={settings.preferences.theme === theme ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updatePreference('theme', theme)}
                        >
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Auto-save</Label>
                      <p className="text-sm text-muted-foreground">Automatically save your work</p>
                    </div>
                    <Switch
                      checked={settings.preferences.autoSave}
                      onCheckedChange={(checked) => updatePreference('autoSave', checked)}
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">Default Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Tone</Label>
                      <select
                        value={settings.preferences.defaultTone}
                        onChange={(e) => updatePreference('defaultTone', e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="technical">Technical</option>
                        <option value="beginner-friendly">Beginner Friendly</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Audience</Label>
                      <select
                        value={settings.preferences.defaultAudience}
                        onChange={(e) => updatePreference('defaultAudience', e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="developers">Developers</option>
                        <option value="managers">Managers</option>
                        <option value="end-users">End Users</option>
                        <option value="stakeholders">Stakeholders</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full button-hover bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving Preferences...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}