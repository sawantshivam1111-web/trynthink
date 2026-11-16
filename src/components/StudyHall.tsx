import { useEffect, useState } from 'react'
import { getUser, supabase } from '../lib/db'

type Member = { id: string; name: string; status: string; left: number }

const css = `
.sh-wrap { margin: 18px 0 8px; border-radius: 20px; padding: 18px; background: linear-gradient(180deg, #3a2a1c, #241a12); border: 1px solid rgba(201,166,107,.28); color: #f3e6cc; }
.sh-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.sh-title { font-family: Georgia, serif; font-size: 18px; color: #f3e1b0; }
.sh-count { font-size: 13px; color: #c9a66b; }
.sh-room { position: relative; border-radius: 14px; padding: 18px 12px; background: radial-gradient(ellipse at 50% 0%, rgba(255,180,90,.18), transparent 60%), repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0 2px, transparent 2px 60px), linear-gradient(180deg, #5a4330, #3d2c1e); }
.sh-desks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.sh-desk { height: 56px; border-radius: 10px; background: linear-gradient(180deg, #7a5a3a, #5a4128); border: 1px solid rgba(0,0,0,.35); box-shadow: 0 6px 12px rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; gap: 6px; }
.sh-seat { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; background: #2a2018; color: #c9a66b; border: 2px solid #6b5538; position: relative; }
.sh-seat.focus { background: linear-gradient(180deg, #e8b04e, #c48a2c); color: #1a120a; border-color: #ffd98a; box-shadow: 0 0 12px rgba(255,170,70,.6); }
.sh-name { position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); font-size: 11px; white-space: nowrap; color: #e8d7b5; }
.sh-empty { text-align: center; color: #bfa77f; font-size: 14px; padding: 20px 0; }
.sh-legend { margin-top: 26px; font-size: 12px; color: #bfa77f; display: flex; gap: 14px; flex-wrap: wrap; }
`

export default function StudyHall({ running, minutesLeft, plannedMinutes }: { running: boolean; minutesLeft: number; plannedMinutes: number }) {
  const [members, setMembers] = useState<Member[]>([])
  const [me, setMe] = useState<any>(null)
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    let ch: any = null
    let cancelled = false
    getUser().then(user => {
      if (!user || cancelled) return
      setMe(user)
      ch = supabase.channel('study-hall', { config: { presence: { key: user.id } } })
      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState() as Record<string, any[]>
        const list: Member[] = Object.entries(state).map(([key, metas]) => {
          const m = metas[0] || {}
          return { id: key, name: m.name || 'Student', status: m.status || 'resting', left: m.left || 0 }
        })
        setMembers(list)
      })
      ch.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') setChannel(ch)
      })
    })
    return () => {
      cancelled = true
      if (ch) supabase.removeChannel(ch)
    }
  }, [])

  useEffect(() => {
    if (!channel || !me) return
    channel.track({
      name: String(me.email || 'Student').split('@')[0].slice(0, 12),
      status: running ? 'focusing' : 'resting',
      left: running ? Math.ceil(minutesLeft / 60) : 0,
      planned: plannedMinutes,
    })
  }, [channel, me, running, minutesLeft, plannedMinutes])

  const focusing = members.filter(m => m.status === 'focusing').length

  return (
    <div className="sh-wrap">
      <style>{css}</style>
      <div className="sh-head">
        <div className="sh-title">Study hall</div>
        <div className="sh-count">{members.length} online · {focusing} focusing</div>
      </div>
      <div className="sh-room">
        {members.length === 0 ? (
          <div className="sh-empty">Connecting to the study hall...</div>
        ) : (
          <div className="sh-desks">
            {members.slice(0, 12).map(m => (
              <div key={m.id} className="sh-desk">
                <div className={`sh-seat ${m.status === 'focusing' ? 'focus' : ''}`}>
                  {m.name.charAt(0).toUpperCase()}
                  <span className="sh-name">{m.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="sh-legend">
        <span>● Glowing seat = focusing</span>
        <span>● Dim seat = resting</span>
      </div>
    </div>
  )
}