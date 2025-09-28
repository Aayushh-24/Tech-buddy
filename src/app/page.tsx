'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Github, 
  FileCode, 
  Bot, 
  Upload,
  Search,
  Sparkles,
  ArrowRight,
  Zap,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface QuickStat {
  label: string
  value: string
  change: string
  icon: any
  color: string
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<QuickStat[]>([])

  useEffect(() => {
    setMounted(true)
    // Simulate loading stats
    setStats([
      { label: 'Documents Processed', value: '0', change: '+0%', icon: FileText, color: 'blue' },
      { label: 'AI Conversations', value: '0', change: '+0%', icon: Bot, color: 'purple' },
      { label: 'GitHub Repos', value: '0', change: '+0%', icon: Github, color: 'green' },
      { label: 'Docs Generated', value: '0', change: '+0%', icon: FileCode, color: 'orange' }
    ])
  }, [])

  const quickActions = [
    {
      title: 'Upload Documents',
      description: 'Upload PDFs and DOCX files for AI-powered Q&A',
      icon: Upload,
      color: 'blue',
      href: '/documents',
      badge: 'New'
    },
    {
      title: 'GitHub Connect',
      description: 'Connect and query your GitHub repositories',
      icon: Github,
      color: 'green',
      href: '/github',
      badge: 'Connect'
    },
    {
      title: 'Doc Generator',
      description: 'Generate professional documentation with AI',
      icon: FileCode,
      color: 'purple',
      href: '/generator',
      badge: 'AI'
    },
    {
      title: 'AI Assistant',
      description: 'Get help with your technical questions',
      icon: Bot,
      color: 'orange',
      href: '/assistant',
      badge: 'Chat'
    }
  ]

  const features = [
    {
      icon: Search,
      title: 'Smart Document Q&A',
      description: 'Upload your technical documents and get instant answers using advanced RAG technology.',
      color: 'blue'
    },
    {
      icon: Github,
      title: 'GitHub Integration',
      description: 'Connect your repositories to analyze code, generate documentation, and get insights.',
      color: 'green'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Generation',
      description: 'Create high-quality technical documentation tailored to your audience.',
      color: 'purple'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getIconBgClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-400 to-blue-600',
      green: 'from-green-400 to-green-600',
      purple: 'from-purple-400 to-purple-600',
      orange: 'from-orange-400 to-orange-600'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  if (!mounted) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Welcome to TechBuddy</span>
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              AI-Powered Technical Documentation
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform your documentation workflow with AI. Create, manage, and query technical documents with intelligent assistance.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/documents">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-8">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/assistant">
              <Button variant="outline" size="lg" className="font-medium px-8">
                Try AI Assistant
                <Bot className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${getIconBgClasses(stat.color)} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <Badge variant="outline" className="text-xs">
              Powered by AI
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white via-white to-gray-50">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 bg-gradient-to-br ${getIconBgClasses(action.color)} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <action.icon className="w-7 h-7 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {action.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href={action.href}>
                    <Button className={`w-full bg-gradient-to-r ${getColorClasses(action.color)} text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300`}>
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Overview */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Powerful Features</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${getIconBgClasses(feature.color)} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Getting Started</CardTitle>
                <CardDescription className="text-gray-600">
                  Here's how to make the most of TechBuddy
                </CardDescription>
              </div>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-blue-100 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">1. Upload Documents</p>
                  <p className="text-xs text-gray-600">Add your technical docs</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-green-100 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">2. Start Chatting</p>
                  <p className="text-xs text-gray-600">Ask questions about your docs</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-purple-100 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                  <Github className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">3. Connect GitHub</p>
                  <p className="text-xs text-gray-600">Analyze your repositories</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-orange-100 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">4. Generate Docs</p>
                  <p className="text-xs text-gray-600">Create new documentation</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}