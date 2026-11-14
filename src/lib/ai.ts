import { supabase, getUser } from './db'

export const FREE_MODELS = [
  { id: "openrouter/auto", name: "⚡ OpenRouter Auto" },
  { id: "deepseek/deepseek-r1:free", name: "🧠 DeepSeek R1 (FREE)" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "🦙 Llama 3.3 70B (FREE)" },
  { id: "google/gemini-2.0-flash-lite-preview-02-05:free", name: "⚡ Gemini 2.0 Flash (FREE)" }
]

export interface Message { role: 'user' | 'ai' | 'assistant' | 'system'; text: string }

export interface MethodInfo {
  id: string
  name: string
  summary: string
  howAIUsesIt: string
}

export const HINT_LADDER = ["What do you think the first step is?", "Can you explain your reasoning so far?"]

export type AIMode = 'tutor' | 'method' | 'feedback' | 'quiz' | 'flashcards' | 'grade'
export type AIResult = { ok: boolean; text: string; error: string }
export type Material = { fileName: string; content: string }

const MATERIAL_TAG = 'MATERIAL THE STUDENT UPLOADED'
const MATERIAL_CHARS = 12000

// The most recent uploaded file for the signed-in student.
export async function loadMaterial(): Promise<Material | null> {
  try {
    const user = await getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('study_materials')
      .select('file_name, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error || !data?.[0]?.content) return null
    return { fileName: data[0].file_name, content: data[0].content }
  } catch {
    return null
  }
}

// Adds the uploaded material to a teaching prompt, unless it is already there.
async function withMaterial(prompt: string): Promise<string> {
  if (prompt.includes(MATERIAL_TAG)) return prompt
  const m = await loadMaterial()
  if (!m) return prompt
  return `${MATERIAL_TAG} (${m.fileName}):
"""
${m.content.slice(0, MATERIAL_CHARS)}
"""

Base your teaching on this material. Ask questions about it, and say so when the student asks about something it does not cover.

Student: ${prompt}`
}

export async function callAI(
  mode: AIMode,
  prompt: string,
  history: Message[] = [],
  method?: MethodInfo
): Promise<AIResult> {
  try {
    const teaching = mode === 'tutor' || mode === 'method'
    const finalPrompt = teaching ? await withMaterial(prompt) : prompt
    const { data, error } = await supabase.functions.invoke('ai', {
      body: { prompt: finalPrompt, mode, history, model: 'openrouter/auto', method },
    })
    if (error) return { ok: false, text: '', error: error.message || 'Server error' }
    if (!data?.success) return { ok: false, text: '', error: data?.error || 'No answer from the AI' }
    return { ok: true, text: String(data.text), error: '' }
  } catch (e: any) {
    return { ok: false, text: '', error: e?.message || 'Connection error' }
  }
}

// Used by the Tutor, Own study, and God mode screens.
export async function callTutor(
  userMessage: string,
  history: Message[] = [],
  _selectedModel = 'openrouter/auto',
  method?: MethodInfo
) {
  const r = await callAI(method ? 'method' : 'tutor', userMessage, history, method)
  return r.ok ? r.text : 'The tutor is unavailable right now. Please try again.'
}

// Pulls the first JSON array or object out of a model reply.
export function parseJSON<T>(text: string): T | null {
  const cleaned = text.replace(/```json|```/gi, '').trim()
  const start = cleaned.search(/[\[{]/)
  if (start < 0) return null
  const open = cleaned[start]
  const close = open === '[' ? ']' : '}'
  const end = cleaned.lastIndexOf(close)
  if (end < 0) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T
  } catch {
    return null
  }
}
