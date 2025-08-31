import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Key, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

type AIProvider = 'openai' | 'gemini';

interface ProviderConfig {
  name: string;
  apiUrl: string;
  defaultModel: string;
  keyPrefix: string;
}

interface ChatInterfaceProps {
  opacity: number;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ opacity }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('openai');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const providers: Record<AIProvider, ProviderConfig> = {
    openai: {
      name: 'OpenAI',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      defaultModel: 'gpt-3.5-turbo',
      keyPrefix: 'sk-'
    },
    gemini: {
      name: 'Google Gemini',
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
      defaultModel: 'gemini-1.5-flash-latest',
      keyPrefix: 'AI'
    }
  };

  // Load API key and provider from localStorage on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem('ai-provider') as AIProvider;
    if (savedProvider && providers[savedProvider]) {
      setProvider(savedProvider);
    }
    
    const savedApiKey = localStorage.getItem(`${savedProvider || 'openai'}-api-key`);
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      setShowApiKeySetup(true);
    }
  }, []);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempApiKey.trim()) return;
    
    localStorage.setItem(`${provider}-api-key`, tempApiKey);
    localStorage.setItem('ai-provider', provider);
    setApiKey(tempApiKey);
    setShowApiKeySetup(false);
    setTempApiKey('');
  };

  const handleChangeApiKey = () => {
    setShowApiKeySetup(true);
    setTempApiKey(apiKey);
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    const savedApiKey = localStorage.getItem(`${newProvider}-api-key`);
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setTempApiKey(savedApiKey);
    } else {
      setApiKey('');
      setTempApiKey('');
    }
  };

  const addMessage = (content: string, role: 'user' | 'assistant') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !apiKey) return;

    const userMessage = input.trim();
    setInput('');
    addMessage(userMessage, 'user');
    setIsLoading(true);

    try {
      let response;
      const config = providers[provider];

      if (provider === 'openai') {
        response = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: config.defaultModel,
            messages: [
              ...messages.map(msg => ({
                role: msg.role,
                content: msg.content
              })),
              { role: 'user', content: userMessage }
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });
      } else if (provider === 'gemini') {
        response = await fetch(`${config.apiUrl}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: userMessage }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (provider === 'openai') {
          if (response.status === 429 && errorData.error?.code === 'insufficient_quota') {
            throw new Error('Your OpenAI account has exceeded its quota. Please check your billing details at platform.openai.com');
          } else if (response.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your API key.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
          } else {
            throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
          }
        } else if (provider === 'gemini') {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Invalid Gemini API key. Please check your API key.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
          } else {
            throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
          }
        }
      }

      const data = await response.json();
      let assistantMessage = '';

      if (provider === 'openai') {
        assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      } else if (provider === 'gemini') {
        assistantMessage = data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I could not generate a response.';
      }
      
      addMessage(assistantMessage, 'assistant');
    } catch (error) {
      console.error(`${provider.toUpperCase()} API Error:`, error);
      addMessage(`Error: ${error.message}`, 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Focus input on mount and keep it focused
    inputRef.current?.focus();
  }, []);

  // Show API key setup if no API key is stored
  if (showApiKeySetup) {
    return (
      <div 
        className="flex flex-col h-full bg-gradient-glass backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden"
        style={{ opacity }}
      >
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <Key className="w-16 h-16 text-primary mb-6 animate-float" />
          <h2 className="text-2xl font-semibold text-foreground mb-4">AI Provider Setup</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Choose your AI provider and enter your API key to start chatting. Your key will be stored locally and never shared.
          </p>
          
          <form onSubmit={handleApiKeySubmit} className="w-full max-w-md space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">AI Provider</label>
              <Select value={provider} onValueChange={handleProviderChange}>
                <SelectTrigger className="w-full bg-input border-white/20 focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">API Key</label>
              <Input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder={providers[provider].keyPrefix + "..."}
                className="w-full bg-input border-white/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                autoFocus
              />
            </div>
            
            <Button
              type="submit"
              disabled={!tempApiKey.trim()}
              className="w-full bg-gradient-primary hover:scale-105 transition-transform"
            >
              <Key className="w-4 h-4 mr-2" />
              Save API Key
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground mt-6 max-w-md">
            Get your API key from{' '}
            {provider === 'openai' ? (
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                platform.openai.com
              </a>
            ) : (
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-full bg-gradient-glass backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden"
      style={{ opacity }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">{providers[provider].name} Assistant</h1>
            <p className="text-xs text-muted-foreground">Ready for screen sharing overlay</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleChangeApiKey}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-primary animate-float" />
              <h3 className="text-lg font-medium text-foreground mb-2">Ready to assist</h3>
              <p className="text-muted-foreground text-sm">Type your prompt below to get started</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-slide-up",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] p-3 rounded-lg",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-secondary text-secondary-foreground rounded-bl-none'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 animate-slide-up">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-secondary p-3 rounded-lg rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-card/50">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 bg-input border-white/20 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            disabled={isLoading}
            autoFocus
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-gradient-primary hover:scale-105 transition-transform"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
