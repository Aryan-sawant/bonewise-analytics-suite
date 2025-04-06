
import { Home, User, FlaskConical, History } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

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

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md py-3 px-6 rounded-full shadow-xl border border-white/20">
        {navItems.map((item) => {
          const Icon = item.icon
          
          return (
            <Link key={item.name} to={item.url}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2 rounded-full hover:bg-white/20 transition-all duration-300"
              >
                <Icon size={18} />
                <span className="hidden md:inline font-medium">{item.name}</span>
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
