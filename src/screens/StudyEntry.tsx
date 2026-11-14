import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { getUser, supabase } from '../lib/db'
import { extractText } from '../lib/extract'

const MAX_MB = 10
const ALLOWED = ['.pdf', '.docx', '.txt']

export default function StudyEntry() {
  const nav = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const pickFile = (f: File | null) => {
    setError('')
    if (!f) return
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED.includes(ext)) {
      setError('Please choose a PDF, Word (.docx), or text (.txt) file.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB} MB.`)
      return
    }
    setFile(f)
  }

  const upload = async () => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const user = await getUser()
      if (!user) throw new Error('Please sign in to upload study material.')

      setStatus('Reading the text...')
      const content = await extractText(file)
      if (!content) throw new Error('No readable text found in this file. Try a text-based PDF or a .txt file.')

      setStatus('Uploading...')
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${user.id}/${Date.now()}-${safeName}`
      const { error: upErr } = await supabase.storage.from('study-materials').upload(path, file)
      if (upErr) throw upErr

      const { error: rowErr } = await supabase.from('study_materials').insert({
        user_id: user.id,
        file_name: file.name,
        storage_path: path,
        size_bytes: file.size,
        content,
      })
      if (rowErr) throw rowErr

      setUploadedName(file.name)
      setFile(null)
    } catch (e: any) {
      setError(e.message || 'Upload failed. Please try again.')
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  const ready = !!uploadedName

  return (
    <div>
      <div className="hero">
        <span className="tag">Step 1 of your study</span>
        <h1 style={{ marginTop: 12 }}>Upload your study material</h1>
        <p className="muted">Choose a PDF, Word file, or text file. Then pick how you want to study it.</p>
      </div>

      <Card title="Upload">
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => pickFile(e.target.files?.[0] || null)}
          style={{ marginBottom: 12 }}
        />
        {file ? <p className="muted">Selected: {file.name}</p> : null}
        {file ? (
          <Button onClick={upload} disabled={busy}>
            {busy ? (status || 'Working...') : 'Upload material'}
          </Button>
        ) : null}
        {uploadedName ? <p style={{ color: 'var(--primary-dark)', marginTop: 8 }}>Uploaded: {uploadedName}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </Card>

      <Card title="Choose how to study">
        {!ready ? <p className="muted">Upload a file to unlock these options.</p> : null}
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <h3 style={{ color: 'var(--text)' }}>Study by your own (with AI)</h3>
            <p className="muted">Study your material on your own and get AI help when you ask.</p>
            <Button disabled={!ready} onClick={() => nav('/study/own')}>Start own study</Button>
          </div>
          <div>
            <h3 style={{ color: 'var(--text)' }}>Socratic uni study</h3>
            <p className="muted">The AI tutor asks questions and guides you to the answer.</p>
            <Button disabled={!ready} onClick={() => nav('/tutor')}>Start Socratic study</Button>
          </div>
          <div>
            <h3 style={{ color: 'var(--text)' }}>God mode</h3>
            <p className="muted">Learn using a research-based university method.</p>
            <Button disabled={!ready} onClick={() => nav('/study/god')}>Start God mode</Button>
          </div>
          <div>
            <h3 style={{ color: 'var(--text)' }}>Take a test</h3>
            <p className="muted">Answer 5 questions from your material and get a score.</p>
            <Button disabled={!ready} onClick={() => nav('/test')}>Start test</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
