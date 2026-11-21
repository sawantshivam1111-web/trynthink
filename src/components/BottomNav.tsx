import { NavLink } from 'react-router-dom'
import { Home, Target, Users, BarChart3, Trophy, User } from 'lucide-react'

const ITEMS = [
  { to: '/home', label: 'Home', Icon: Home },
  { to: '/challenges', label: 'Challenges', Icon: Target },
  { to: '/community', label: 'Community', Icon: Users },
  { to: '/progress', label: 'Progress', Icon: BarChart3 },
  { to: '/leaderboard', label: 'Ranks', Icon: Trophy },
  { to: '/profile', label: 'Profile', Icon: User },
]

export default function BottomNav() {
  const vertical = typeof window !== 'undefined' && window.innerWidth >= 768
  return (
    <nav
      aria-label="Main"
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        justifyContent: vertical ? 'flex-start' : 'space-around',
        alignItems: vertical ? 'stretch' : 'center',
        gap: vertical ? 4 : 0,
        padding: vertical ? '12px' : '6px 4px',
        background: '#ffffff',
      }}
    >
      {ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: vertical ? 'row' : 'column',
            alignItems: 'center',
            gap: vertical ? 10 : 2,
            padding: vertical ? '10px 12px' : '6px 4px',
            minWidth: vertical ? undefined : 52,
            borderRadius: 12,
            textDecoration: 'none',
            fontSize: vertical ? 15 : 11,
            fontWeight: 600,
            color: isActive ? 'var(--primary-dark, #0f766e)' : '#5f7370',
            background: isActive ? 'var(--accent-soft, #e6f6ef)' : 'transparent',
          })}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}