import { registerPlugin, Capacitor } from '@capacitor/core'

type FocusPluginType = {
  start(o: { minutes: number; apps: string[] }): Promise<{ ok: boolean; blocked: number }>
  stop(): Promise<void>
  isEnabled(): Promise<{ enabled: boolean }>
  openSettings(): Promise<void>
}

const Focus = registerPlugin<FocusPluginType>('FocusBlocker')

// Android package names. Verify each one on your phone before presenting.
export const PACKAGES: Record<string, string> = {
  ChatGPT: 'com.openai.chatgpt',
  Gemini: 'com.google.android.apps.bard',
  Claude: 'com.anthropic.claude',
  Copilot: 'com.microsoft.copilot',
  Perplexity: 'ai.perplexity.app.android',
}

export const isNative = () => Capacitor.isNativePlatform()

export async function nativeFocusReady(): Promise<boolean> {
  if (!isNative()) return true
  try {
    return (await Focus.isEnabled()).enabled
  } catch {
    return false
  }
}

export async function startNativeFocus(minutes: number, appNames: string[]) {
  if (!isNative()) return
  const apps = appNames.map(n => PACKAGES[n]).filter(Boolean)
  await Focus.start({ minutes, apps })
}

export async function stopNativeFocus() {
  if (!isNative()) return
  try { await Focus.stop() } catch {}
}

export async function openNativeFocusSettings() {
  if (isNative()) await Focus.openSettings()
}
