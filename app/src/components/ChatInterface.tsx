import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Trash2,
  Sparkles,
  User,
  Loader2,
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// Puter.js chat completion
async function puterChatCompletion(messages: { role: string; content: string }[]) {
  // @ts-ignore
  if (!window.puter?.ai?.chat) {
    throw new Error('Puter.js AI not available')
  }
  // @ts-ignore
  return await window.puter.ai.chat(messages, {
    model: 'claude-sonnet-4-20250514',
  })
}

// Puter.js KV storage
async function puterKVGet(key: string): Promise<string | null> {
  try {
    // @ts-ignore
    if (!window.puter?.kv?.get) return null
    // @ts-ignore
    return await window.puter.kv.get(key)
  } catch {
    return null
  }
}

async function puterKVSet(key: string, value: string) {
  try {
    // @ts-ignore
    if (window.puter?.kv?.set) {
      // @ts-ignore
      await window.puter.kv.set(key, value)
    }
  } catch {
    // Silent fail - localStorage fallback handled elsewhere
  }
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPuterReady, setIsPuterReady] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Check if Puter.js is ready
  useEffect(() => {
    const checkPuter = () => {
      // @ts-ignore
      if (window.puter) {
        setIsPuterReady(true)
      }
    }
    checkPuter()
    const interval = setInterval(checkPuter, 500)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setIsPuterReady(true) // Proceed anyway after 5s
    }, 5000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  // Load messages from storage
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const stored = await puterKVGet('chat_messages')
        if (stored) {
          setMessages(JSON.parse(stored))
          return
        }
      } catch {
        // Fall through to localStorage
      }
      try {
        const local = localStorage.getItem('chat_messages')
        if (local) setMessages(JSON.parse(local))
      } catch {
        // Ignore
      }
    }
    loadMessages()
  }, [])

  // Save messages to storage
  const saveMessages = useCallback(async (msgs: Message[]) => {
    const json = JSON.stringify(msgs)
    try {
      await puterKVSet('chat_messages', json)
    } catch {
      // Fallback
    }
    try {
      localStorage.setItem('chat_messages', json)
    } catch {
      // Ignore
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    await saveMessages(updatedMessages)

    try {
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await puterChatCompletion(apiMessages)
      const aiContent = response?.message?.content || response?.content || String(response)

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiContent,
        timestamp: Date.now(),
      }

      const finalMessages = [...updatedMessages, aiMessage]
      setMessages(finalMessages)
      await saveMessages(finalMessages)
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please ensure you are logged into Puter and try again.',
        timestamp: Date.now(),
      }
      const finalMessages = [...updatedMessages, errorMessage]
      setMessages(finalMessages)
      await saveMessages(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = async () => {
    setMessages([])
    try {
      await puterKVSet('chat_messages', '[]')
    } catch {
      // Ignore
    }
    try {
      localStorage.setItem('chat_messages', '[]')
    } catch {
      // Ignore
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-screen bg-[#050505] relative overflow-hidden">
      {/* Liquid glass background shader effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.03) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 50%, rgba(255,255,255,0.015) 0%, transparent 50%)
          `,
        }}
      />

      {/* Header */}
      <header className="liquid-glass-strong relative z-10 flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden animate-pulse-glow">
            <img
              src="https://files.catbox.moe/6jm80y.jpg"
              alt="AI"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-sm font-medium text-[#F5F5F5] tracking-wide">
              AI Assistant
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider font-mono">
                {isPuterReady ? 'Claude Opus 4' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="glass-button p-2.5 rounded-xl cursor-pointer"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4 text-[#8A8A8A] relative z-10" />
            </button>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 relative z-10"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in">
            <div className="relative w-20 h-20 rounded-full overflow-hidden">
              <img
                src="https://files.catbox.moe/6jm80y.jpg"
                alt="AI"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 rounded-full shadow-glow" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-light text-[#F5F5F5] mb-2 text-glow">
                How can I help you today?
              </h2>
              <p className="text-sm text-[#8A8A8A]">
                Ask me anything — I'm powered by Claude 4.7 Opus
              </p>
            </div>

            {/* Quick suggestions */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg mt-4">
              {[
                'Explain quantum computing',
                'Write a poem about stars',
                'Help me debug code',
                'Creative writing tips',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion)
                    inputRef.current?.focus()
                  }}
                  className="glass-button px-4 py-2.5 rounded-xl text-xs text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  <span className="relative z-10">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-slide-up ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full overflow-hidden ${
                    message.role === 'assistant'
                      ? 'animate-pulse-glow'
                      : ''
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <img
                      src="https://files.catbox.moe/6jm80y.jpg"
                      alt="AI"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#8A8A8A]" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`flex flex-col gap-1 max-w-[80%] sm:max-w-[70%] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'chat-bubble-user rounded-br-md'
                        : 'chat-bubble-ai'
                    }`}
                  >
                    <p
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                      style={{
                        color:
                          message.role === 'user' ? '#F5F5F5' : '#E0E0E0',
                      }}
                    >
                      {message.content}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#8A8A8A] font-mono px-1">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 animate-slide-up">
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden animate-pulse-glow">
                  <img
                    src="https://files.catbox.moe/6jm80y.jpg"
                    alt="AI"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="liquid-glass px-5 py-4 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-1.5 relative z-10">
                    <span
                      className="w-2 h-2 rounded-full bg-white/40 animate-typing-dot"
                      style={{ animationDelay: '0s' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-white/40 animate-typing-dot"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-white/40 animate-typing-dot"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative z-10 px-4 sm:px-6 pb-4 pt-2">
        <div className="liquid-glass-strong max-w-3xl mx-auto rounded-2xl flex items-end gap-2 px-4 py-3">
          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full bg-transparent text-sm text-[#F5F5F5] placeholder-[#8A8A8A] outline-none relative z-10 disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`glass-button p-2.5 rounded-xl flex-shrink-0 transition-all cursor-pointer ${
              input.trim() && !isLoading
                ? 'opacity-100'
                : 'opacity-40'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-[#F5F5F5] animate-spin relative z-10" />
            ) : (
              <Send className="w-4 h-4 text-[#F5F5F5] relative z-10" />
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-3 pb-2">
          <Sparkles className="w-3 h-3 text-[#8A8A8A]" />
          <span className="text-[10px] text-[#8A8A8A] font-mono tracking-wider uppercase">
            Powered by Puter.js + Claude 4.7 Opus
          </span>
        </div>
      </div>
    </div>
  )
}
