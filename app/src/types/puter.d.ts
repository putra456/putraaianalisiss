interface PuterAIResponse {
  message?: {
    content?: string
  }
  content?: string
}

interface PuterKV {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
}

interface PuterAI {
  chat(messages: { role: string; content: string }[], options?: { model?: string }): Promise<PuterAIResponse>
}

interface Puter {
  ai?: {
    chat: PuterAI['chat']
  }
  kv?: PuterKV
}

declare global {
  interface Window {
    puter?: Puter
  }
}

export {}
