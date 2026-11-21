import React from 'react'

// Turns **bold**, ## headings, and "- " bullets into real formatting.
export default function Rich({ text }: { text: string }) {
  const lines = text.split('\n')
  const out: React.ReactNode[] = []
  lines.forEach((line, i) => {
    if (/^#{1,3}\s/.test(line)) {
      out.push(<h4 key={i} style={{ margin: '10px 0 4px', fontWeight: 800 }}>{line.replace(/^#{1,3}\s/, '')}</h4>)
    } else if (/^\s*[-*]\s/.test(line)) {
      out.push(<div key={i} style={{ paddingLeft: 14 }}>• {inline(line.replace(/^\s*[-*]\s/, ''))}</div>)
    } else if (line.trim() === '') {
      out.push(<div key={i} style={{ height: 6 }} />)
    } else {
      out.push(<p key={i} style={{ margin: '2px 0' }}>{inline(line)}</p>)
    }
  })
  return <div>{out}</div>
}

function inline(s: string): React.ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{part}</React.Fragment>
  )
}