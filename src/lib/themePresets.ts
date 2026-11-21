export type ThemeStyle = {
  id: string
  name: string
  primary: string
  primaryDark: string
  background: string
  text: string
  radius: number
  font: string
  shadow: number
  motionMs: number
}

export const FONTS: Record<string, string> = {
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  rounded: '"Trebuchet MS", system-ui, sans-serif',
  mono: 'ui-monospace, Menlo, Consolas, monospace',
}

export const DEFAULT_ID = 'green'

export const PRESETS: ThemeStyle[] = [
  { id: 'green', name: 'Green', primary: '#10b981', primaryDark: '#0f766e', background: '#f3f7f6', text: '#1f2937', radius: 14, font: 'system', shadow: 1, motionMs: 250 },
  { id: 'blue', name: 'Blue', primary: '#60a5fa', primaryDark: '#2563eb', background: '#f0f6ff', text: '#172554', radius: 14, font: 'system', shadow: 1, motionMs: 250 },
  { id: 'purple', name: 'Purple', primary: '#c084fc', primaryDark: '#7e22ce', background: '#f7f4ff', text: '#2e1065', radius: 14, font: 'rounded', shadow: 1, motionMs: 250 },
  { id: 'orange', name: 'Orange', primary: '#f97316', primaryDark: '#c2410c', background: '#fff7ed', text: '#431407', radius: 14, font: 'system', shadow: 1, motionMs: 250 },
  { id: 'dark', name: 'Dark', primary: '#7dd3c0', primaryDark: '#2dd4bf', background: '#1a1a22', text: '#e9e6dd', radius: 14, font: 'system', shadow: 0, motionMs: 250 },
]