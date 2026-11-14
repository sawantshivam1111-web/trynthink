import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import OfflineBanner from './OfflineBanner'

const WIDTH = 240

export default function Layout() {
  const [open, setOpen] = useState(typeof window === 'undefined' ? true : window.innerWidth >= 768)

  return (
    <div style={{ minHeight: '100vh' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Hide menu' : 'Show menu'}
        style={{
          position: 'fixed',
          top: 12,
          left: open ? WIDTH + 12 : 12,
          zIndex: 60,
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          background: '#fff',
          cursor: 'pointer',
          fontSize: 18,
          transition: 'left 0.25s',
        }}
      >
        {open ? '‹' : '☰'}
      </button>

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: WIDTH,
          background: '#fff',
          borderRight: '1px solid #e5e7eb',
          overflowY: 'auto',
          paddingTop: 60,
          zIndex: 50,
          transform: open ? 'translateX(0)' : `translateX(-${WIDTH + 20}px)`,
          transition: 'transform 0.25s',
        }}
      >
        <BottomNav />
      </aside>

      <main
        style={{
          marginLeft: open ? WIDTH : 0,
          transition: 'margin-left 0.25s',
          padding: '60px 16px 24px',
        }}
      >
        <OfflineBanner />
        <Outlet />
      </main>
    </div>
  )
}
