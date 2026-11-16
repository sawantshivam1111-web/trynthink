import { supabase, getUser } from './db'
import { parseJSON } from './ai'
import { PRESETS, DEFAULT_ID, FONTS } from './themePresets'
import type { ThemeStyle } from './themePresets'

const ACTIVE_KEY = 'trynthink-theme'
const CUSTOM_KEY = 'trynthink-theme-custom'
const STYLE_ID = 'trynthink-theme-style'
const HEX = /^#[0-9a-fA-F]{6}$/

function clamp(n: any, min: number, max: number, fallback: number) {
  const v = Number(n)
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
}

function luminance(hex: string) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const l = c.map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
}

function contrast(a: string, b: string) {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// Keeps only safe values. Anything invalid falls back to the base theme.
export function sanitize(input: any, base: ThemeStyle): ThemeStyle {
  const pick = (k: string, fallback: string) =>
    typeof input?.[k] === 'string' && HEX.test(input[k]) ? input[k] : fallback
  const background = pick('background', base.background)
  let text = pick('text', base.text)
  if (contrast(text, background) < 4.5) {
    text = contrast('#111111', background) >= contrast('#ffffff', background) ? '#111111' : '#ffffff'
  }
  const font = typeof input?.font === 'string' && FONTS[input.font] ? input.font : base.font
  return {
    id: 'custom',
    name: typeof input?.name === 'string' ? input.name.slice(0, 40) : 'My theme',
    primary: pick('primary', base.primary),
    primaryDark: pick('primaryDark', base.primaryDark),
    background,
    text,
    radius: clamp(input?.radius, 0, 28, base.radius),
    font,
    shadow: clamp(input?.shadow, 0, 3, base.shadow),
    motionMs: clamp(input?.motionMs, 0, 600, base.motionMs),
  }
}

export function presetById(id: string): ThemeStyle {
  return PRESETS.find(p => p.id === id) || PRESETS[0]
}

export function getActiveId(): string {
  return localStorage.getItem(ACTIVE_KEY) || DEFAULT_ID
}

export function getCustom(): ThemeStyle | null {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    return raw ? (JSON.parse(raw) as ThemeStyle) : null
  } catch {
    return null
  }
}

export function applyStyle(s: ThemeStyle) {
  const shadows = ['none', '0 1px 3px rgba(0,0,0,0.12)', '0 4px 12px rgba(0,0,0,0.16)', '0 10px 24px rgba(0,0,0,0.22)']
  const shadow = shadows[Math.round(s.shadow)] || 'none'
  const dark = s.background === '#0f172a'
  const root = document.documentElement.style
  root.setProperty('--theme-bg', s.background)
  root.setProperty('--theme-bg2', s.background)
  root.setProperty('--theme-card', dark ? '#1e293b' : '#ffffff')
  root.setProperty('--theme-border', dark ? '#334155' : '#e5e7eb')
  root.setProperty('--theme-text', s.text)
  root.setProperty('--theme-muted', s.text)
  root.setProperty('--theme-primary', s.primary)
  root.setProperty('--theme-primary-dark', s.primaryDark)
  root.setProperty('--theme-accent', s.primary)
  root.setProperty('--theme-accent-soft', dark ? '#1e293b' : '#f0f7f5')
  root.setProperty('--radius', `${s.radius}px`)
  const css = `
html, body { font-family: ${FONTS[s.font] || FONTS.system} !important; }
button { box-shadow: ${shadow}; transition: transform ${s.motionMs}ms ease, box-shadow ${s.motionMs}ms ease; }
button:hover { transform: translateY(-1px); }
button:active { transform: translateY(1px); }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
`
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}
export function applyPreset(id: string) {
  localStorage.setItem(ACTIVE_KEY, id)
  localStorage.removeItem(CUSTOM_KEY)
  applyStyle(presetById(id))
}

export async function saveCustom(s: ThemeStyle) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(s))
  localStorage.setItem(ACTIVE_KEY, 'custom')
  applyStyle(s)
  try {
    const user = await getUser()
    if (user) {
      await supabase.from('user_themes').upsert({ user_id: user.id, theme: s, updated_at: new Date().toISOString() })
    }
  } catch {
    // Saved on this device even if the cloud copy fails
  }
}

export async function deleteCustom() {
  applyPreset(DEFAULT_ID)
  try {
    const user = await getUser()
    if (user) await supabase.from('user_themes').delete().eq('user_id', user.id)
  } catch {
    // Local reset already done
  }
}

export async function loadSavedTheme() {
  const custom = getCustom()
  if (custom) {
    applyStyle(custom)
    return
  }
  try {
    const user = await getUser()
    if (user) {
      const { data } = await supabase.from('user_themes').select('theme').eq('user_id', user.id).maybeSingle()
      if (data?.theme) {
        localStorage.setItem(CUSTOM_KEY, JSON.stringify(data.theme))
        localStorage.setItem(ACTIVE_KEY, 'custom')
        applyStyle(data.theme as ThemeStyle)
        return
      }
    }
  } catch {
    // Use the preset below
  }
  applyStyle(presetById(getActiveId()))
}

// Asks the AI designer for a theme. The result is always passed through sanitize().
export async function generateFromPrompt(userPrompt: string, base: ThemeStyle): Promise<{ ok: boolean; style?: ThemeStyle; error?: string }> {
  const ask = `Design a colour and style theme for a study app, based on this request: "${userPrompt}".
Return ONLY a JSON object with these keys and no other text:
{"name": "short name", "primary": "#rrggbb", "primaryDark": "#rrggbb", "background": "#rrggbb", "text": "#rrggbb", "radius": number from 0 to 28, "font": one of "system", "serif", "rounded", "mono", "shadow": number from 0 to 3, "motionMs": number from 0 to 600}`
  try {
    const { data, error } = await supabase.functions.invoke('ai', {
      body: { prompt: ask, mode: 'tutor', history: [], model: 'openrouter/auto' },
    })
    if (error || !data?.success) {
      return { ok: false, error: 'The designer is unavailable right now. Your current theme is unchanged.' }
    }
    const parsed = parseJSON<any>(String(data.text))
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'The designer did not return a theme. Try describing it another way.' }
    }
    return { ok: true, style: sanitize(parsed, base) }
  } catch {
    return { ok: false, error: 'Connection error. Please try again.' }
  }
}

// Start the saved theme as soon as the app loads.
if (typeof document !== 'undefined') {
  applyStyle(getCustom() ?? presetById(getActiveId()))
  void loadSavedTheme().catch(() => {})
}