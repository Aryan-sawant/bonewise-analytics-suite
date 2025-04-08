
import { Home, User, FlaskConical, History, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import FindDoctorDialog from './FindDoctorDialog';

const NavBar = () => {
  const { user } = useAuthContext();
  const location = useLocation();
  const [findDoctorOpen, setFindDoctorOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Listen for scroll events to change navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Different navigation items based on user role or client type
  const getNavItems = () => {
    if (!user) {
      return [
        { name: 'Home', url: '/', icon: Home },
      ];
    }
    
    return [
      { name: 'Home', url: '/', icon: Home },
      { name: 'Tasks', url: '/tasks', icon: User },
      { name: 'Analysis', url: '/bone-analysis', icon: FlaskConical },
      { name: 'Find Doctor', url: '/find-doctor', icon: MapPin },
      { name: 'History', url: '/analysis-history', icon: History },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      <motion.nav 
        className={cn(
          "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-2",
          isScrolled && "bottom-4 transition-all duration-300"
        )}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="flex items-center gap-1 sm:gap-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md py-2 px-3 sm:px-6 rounded-full shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.url || 
                            (item.url !== '/' && location.pathname.startsWith(item.url));
            
            if (item.name === 'Find Doctor') {
              return (
                <Button 
                  key={item.name}
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFindDoctorOpen(true)}
                  className={cn(
                    "flex items-center gap-1 sm:gap-2 rounded-full hover:bg-white/20 transition-all duration-300",
                    isActive && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline font-medium">{item.name}</span>
                </Button>
              );
            }
            
            return (
              <Link key={item.name} to={item.url}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "flex items-center gap-1 sm:gap-2 rounded-full hover:bg-white/20 transition-all duration-300",
                    isActive && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline font-medium">{item.name}</span>
                </Button>
              </Link>
            );
          })}
          
          {user && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setFindDoctorOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-full ml-1"
            >
              <MapPin size={16} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline font-medium">Consult Doctor</span>
              <span className="sm:hidden">Consult</span>
            </Button>
          )}
        </div>
      </motion.nav>
      
      <FindDoctorDialog 
        open={findDoctorOpen} 
        onOpenChange={setFindDoctorOpen} 
        specialistType={user ? "Orthopedic Specialist" : ""}
        analysisType="Bone Health Analysis"
      />
    </>
  );
};

export default NavBar;
