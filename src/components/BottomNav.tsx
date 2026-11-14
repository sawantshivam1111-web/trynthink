import { Link, useLocation } from "react-router-dom"
import { Home, Target, Users, BarChart3, User } from "lucide-react"

const tabs = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/challenges", label: "Challenges", Icon: Target },
  { to: "/community", label: "Community", Icon: Users },
  { to: "/progress", label: "Progress", Icon: BarChart3 },
  { to: "/profile", label: "Profile", Icon: User },
]

export default function BottomNav() {
  const loc = useLocation()

  return (
    <nav className="nav">
      {tabs.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className={loc.pathname === to ? "active" : ""}
          aria-current={loc.pathname === to ? "page" : undefined}
        >
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}