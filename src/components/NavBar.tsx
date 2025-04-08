
import { Home, User, FlaskConical, History, MapPin } from 'lucide-react';
import { NavBar as TubelightNavbar } from "@/components/ui/tubelight-navbar";
import { useAuthContext } from '@/contexts/AuthContext';

const NavBar = () => {
  const { user } = useAuthContext();
  
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
  
  return (
    <TubelightNavbar items={getNavItems()} />
  );
};

export default NavBar;
