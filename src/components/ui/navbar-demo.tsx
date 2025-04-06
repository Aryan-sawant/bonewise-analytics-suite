
import { Home, User, FlaskConical, History } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"

export function NavBarDemo() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Dashboard', url: '/tasks', icon: User },
    { name: 'Analysis', url: '/bone-analysis', icon: FlaskConical },
    { name: 'History', url: '/analysis-history', icon: History }
  ]

  return <NavBar items={navItems} />
}
