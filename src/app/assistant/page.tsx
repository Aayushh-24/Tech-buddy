'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, Code, FileText, Lightbulb, BookOpen, MessageSquare, Copy } from 'lucide-react';

// Define the shape of a message
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial-1', role: 'assistant', content: "Hello! I'm your AI technical assistant. How can I assist you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the entire message history
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok || !response.body) {
        throw new Error(response.statusText || "Failed to get response from server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
      const assistantMessageId = (Date.now() + 1).toString();

      // Add a placeholder for the assistant's message
      setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantResponse += decoder.decode(value, { stream: true });
        
        // Update the assistant's message in the state as new text arrives
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId ? { ...msg, content: assistantResponse } : msg
        ));
      }

    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const quickActions = [
    { id: '1', title: 'Code Review', description: 'Get feedback', icon: <Code className="w-5 h-5" />, prompt: 'Can you review this code?' },
    { id: '2', title: 'Doc Help', description: 'Generate docs', icon: <FileText className="w-5 h-5" />, prompt: 'Help me write documentation' },
    { id: '3', title: 'Debug Issue', description: 'Troubleshoot', icon: <Lightbulb className="w-5 h-5" />, prompt: 'I have an issue with my code' },
    { id: '4', title: 'Architecture', description: 'Get guidance', icon: <BookOpen className="w-5 h-5" />, prompt: 'Best architecture for this app?' }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="text-center"><h1 className="text-4xl font-bold tracking-tight gradient-text">AI Assistant</h1></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) => (
                  <Button key={action.id} variant="outline" className="w-full justify-start h-auto p-3" onClick={() => setInput(action.prompt)}>
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600">{action.icon}</div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" />Conversation</CardTitle></CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((m) => (
                      <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {m.role === 'assistant' && <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-blue-600" /></div>}
                        <div className={`max-w-[80%] rounded-lg px-4 py-3 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                          {m.role === 'assistant' && m.content && <div className="flex items-center justify-end mt-2"><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigator.clipboard.writeText(m.content)}><Copy className="w-3 h-3" /></Button></div>}
                        </div>
                        {m.role === 'user' && <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-primary-foreground" /></div>}
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-blue-600" /></div>
                        <div className="bg-muted rounded-lg px-4 py-3"><Loader2 className="w-4 h-4 animate-spin" /></div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="border-t p-4">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a technical question..." disabled={isLoading} className="flex-1" />
                    <Button type="submit" disabled={isLoading || !input.trim()}><Send className="w-4 h-4" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}