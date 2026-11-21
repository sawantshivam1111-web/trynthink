import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import OfflineBanner from './OfflineBanner'
import NamePrompt from '../screens/NamePrompt'
import { getUser, supabase } from '../lib/db'

const WIDTH = 240
const WIDE = 768

export default function Layout() {
  const [wide, setWide] = useState(typeof window !== 'undefined' ? window.innerWidth >= WIDE : false)
  const [open, setOpen] = useState(false)
  const [needsName, setNeedsName] = useState(false)

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= WIDE)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    (async () => {
      const user = await getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
      if (!data?.display_name || !data.display_name.trim()) setNeedsName(true)
    })()
  }, [])

  if (needsName) return <NamePrompt onDone={() => setNeedsName(false)} />

  if (!wide) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <main style={{ padding: '16px 16px 90px' }}>
          <OfflineBanner />
          <Outlet />
        </main>
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#fff', borderTop: '1px solid #e5e7eb' }}>
          <BottomNav />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Hide menu' : 'Show menu'}
        style={{
          position: 'fixed', top: 12, left: open ? WIDTH + 12 : 12, zIndex: 60,
          width: 40, height: 40, borderRadius: 10, border: '1px solid #e5e7eb',
          background: '#fff', cursor: 'pointer', fontSize: 18, transition: 'left 0.25s',
        }}
      >
        {open ? '‹' : '☰'}
      </button>
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: WIDTH,
          background: '#fff', borderRight: '1px solid #e5e7eb', overflowY: 'auto',
          paddingTop: 60, zIndex: 50,
          transform: open ? 'translateX(0)' : `translateX(-${WIDTH + 20}px)`,
          transition: 'transform 0.25s',
        }}
      >
        <BottomNav />
      </aside>
      <main style={{ marginLeft: open ? WIDTH : 0, transition: 'margin-left 0.25s', padding: '60px 24px 24px' }}>
        <OfflineBanner />
        <Outlet />
      </main>
    </div>
  )
}