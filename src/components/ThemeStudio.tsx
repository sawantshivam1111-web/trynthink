import { useState } from 'react'
import { Card, Button, TextArea } from './ui'
import { PRESETS, DEFAULT_ID } from '../lib/themePresets'
import type { ThemeStyle } from '../lib/themePresets'
import {
  applyPreset,
  applyStyle,
  deleteCustom,
  generateFromPrompt,
  getActiveId,
  getCustom,
  presetById,
  saveCustom,
} from '../lib/themeEngine'

const currentStyle = (): ThemeStyle => getCustom() ?? presetById(getActiveId())

export default function ThemeStudio() {
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<ThemeStyle | null>(null)
  const [active, setActive] = useState<string>(getActiveId())
  const [hasCustom, setHasCustom] = useState<boolean>(!!getCustom())

  const generate = async () => {
    if (!prompt.trim() || busy) return
    setBusy(true)
    setError('')
    const r = await generateFromPrompt(prompt.trim(), currentStyle())
    setBusy(false)
    if (!r.ok || !r.style) {
      setError(r.error || 'Could not create the theme.')
      return
    }
    setDraft(r.style)
    applyStyle(r.style) // preview only until you keep it
  }

  const keep = async () => {
    if (!draft) return
    await saveCustom(draft)
    setHasCustom(true)
    setActive('custom')
    setDraft(null)
  }

  const discard = () => {
    setDraft(null)
    applyStyle(currentStyle())
  }

  const choosePreset = (id: string) => {
    applyPreset(id)
    setDraft(null)
    setActive(id)
    setHasCustom(false)
  }

  const remove = async () => {
    await deleteCustom()
    setDraft(null)
    setHasCustom(false)
    setActive(DEFAULT_ID)
  }

  const shown = draft ?? currentStyle()

  return (
    <Card title="Customise your app">
      <p className="muted" style={{ marginBottom: 10 }}>Pick a preset, or describe the look you want.</p>

      <div className="row-wrap" style={{ marginBottom: 12 }}>
        {PRESETS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => choosePreset(p.id)}
            style={{
              padding: '8px 12px',
              border: active === p.id ? `2px solid ${p.primaryDark}` : '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: p.primary, marginRight: 6 }} />
            {p.name}
          </button>
        ))}
      </div>

      <TextArea
        rows={2}
        value={prompt}
        onChange={(e: any) => setPrompt(e.target.value)}
        placeholder='For example: "calm ocean blue, rounded cards, serif font"'
      />
      <div className="row-wrap" style={{ marginTop: 8 }}>
        <Button onClick={generate} disabled={busy || !prompt.trim()}>
          {busy ? 'Designing...' : 'Design my theme'}
        </Button>
        {hasCustom ? <Button variant="ghost" onClick={remove}>Delete my theme</Button> : null}
      </div>

      {error ? <p className="error-text" style={{ marginTop: 10 }}>{error}</p> : null}

      {draft ? (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: '1px solid #e5e7eb' }}>
          <p><strong>Preview: {draft.name}</strong></p>
          <div className="row-wrap" style={{ marginTop: 8 }}>
            {[draft.primary, draft.primaryDark, draft.background, draft.text].map((c, i) => (
              <span key={i} style={{ width: 22, height: 22, borderRadius: 6, background: c, border: '1px solid #ccc', display: 'inline-block' }} />
            ))}
          </div>
          <div className="row-wrap" style={{ marginTop: 12 }}>
            <Button onClick={keep}>Keep this theme</Button>
            <Button variant="secondary" onClick={discard}>Discard</Button>
          </div>
        </div>
      ) : null}

      <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
        Current: {shown.name}
      </p>
    </Card>
  )
}