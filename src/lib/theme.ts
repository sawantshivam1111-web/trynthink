import { PRESETS, DEFAULT_ID } from './themePresets'
import { applyPreset, applyStyle, getActiveId, getCustom, presetById } from './themeEngine'

// Kept for the existing Home screen colour buttons.
export const THEMES = PRESETS.map(p => ({ id: p.id, name: p.name, primary: p.primary, dark: p.primaryDark }))

export function getThemeId(): string {
  return getActiveId()
}

export function applyTheme(id: string) {
  if (id === 'custom') {
    const c = getCustom()
    if (c) applyStyle(c)
    return
  }
  applyPreset(id || DEFAULT_ID)
}

export { presetById }