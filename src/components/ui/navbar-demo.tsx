
import { Home, User, FlaskConical, History, MapPin } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { motion } from 'framer-motion'
import { useState } from 'react'
import FindDoctorDialog from '@/components/FindDoctorDialog'

export function NavBarDemo() {
  const location = useLocation()
  const [findDoctorOpen, setFindDoctorOpen] = useState(false)
  
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Dashboard', url: '/tasks', icon: User },
    { name: 'Analysis', url: '/bone-analysis', icon: FlaskConical },
    { name: 'Find Doctor', url: '/find-doctor', icon: MapPin },
    { name: 'History', url: '/analysis-history', icon: History }
  ]

  // Only show the navbar on the landing page
  if (location.pathname !== '/') {
    return null
  }

  return (
    <>
      <motion.div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
      >
        <div className="flex items-center gap-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md py-3 px-6 rounded-full shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
          {navItems.map((item) => {
            const Icon = item.icon
            
            if (item.name === 'Find Doctor') {
              return (
                <Button 
                  key={item.name}
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFindDoctorOpen(true)}
                  className="flex items-center gap-2 rounded-full hover:bg-white/20 transition-all duration-300"
                >
                  <Icon size={18} />
                  <span className="hidden md:inline font-medium">{item.name}</span>
                </Button>
              )
            }
            
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
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setFindDoctorOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-full ml-1"
          >
            <MapPin size={16} className="mr-2" />
            <span className="font-medium">Consult Doctor</span>
          </Button>
        </div>
      </motion.div>
      
      <FindDoctorDialog 
        open={findDoctorOpen} 
        onOpenChange={setFindDoctorOpen} 
        specialistType="Orthopedic Specialist"
        analysisType="Bone Health Analysis"
      />
    </>
  )
}
