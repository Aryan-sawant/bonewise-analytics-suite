
import { Home, User, FlaskConical, History } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import { useLocation } from 'react-router-dom'

export function NavBarDemo() {
  const location = useLocation()
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Dashboard', url: '/tasks', icon: User },
    { name: 'Analysis', url: '/bone-analysis', icon: FlaskConical },
    { name: 'History', url: '/analysis-history', icon: History }
  ]

  // Only show the navbar on the landing page
  if (location.pathname !== '/') {
    return null
  }

  return <NavBar items={navItems} />
}
