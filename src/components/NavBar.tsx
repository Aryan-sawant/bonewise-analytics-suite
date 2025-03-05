import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Menu, X, Bone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const {
    user,
    logout
  } = useAuthContext();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);
  const navLinks = [{
    name: 'Home',
    path: '/'
  }, {
    name: 'Tasks',
    path: '/tasks',
    requiresAuth: true
  }, {
    name: 'Bone Analysis',
    path: '/bone-analysis',
    requiresAuth: true
  }, {
    name: 'Analysis',
    path: '/analysis',
    requiresAuth: true
  }];
  return <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-6 md:px-12", isScrolled ? "bg-white/80 backdrop-blur-sm shadow-sm" : "bg-transparent")}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Bone className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-lg md:text-xl font-semibold text-foreground">BoneHealthAISuite</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {navLinks.map(link => (!link.requiresAuth || user) && <li key={link.name}>
                  <Link to={link.path} className={cn("text-base font-medium button-transition hover:text-primary", location.pathname === link.path ? "text-primary" : "text-foreground/80")}>
                    {link.name}
                  </Link>
                </li>)}
          </ul>
          
          {user ? <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {user.userType === 'doctor' ? 'Doctor' : 'User'}: {user.name || user.email}
              </div>
              <Button variant="ghost" size="sm" className="gap-2" onClick={logout}>
                <LogOut size={16} />
                <span>Logout</span>
              </Button>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User size={18} />
              </div>
            </div> : <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>}
        </nav>
        
        {/* Mobile Menu Button */}
        <button className="md:hidden text-foreground" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && <div className="md:hidden fixed inset-0 top-[72px] bg-background z-40 animate-fade-in">
          <nav className="p-6 flex flex-col h-full">
            <ul className="flex flex-col gap-4 mb-8">
              {navLinks.map(link => (!link.requiresAuth || user) && <li key={link.name}>
                    <Link to={link.path} className={cn("text-lg font-medium block py-2 button-transition", location.pathname === link.path ? "text-primary" : "text-foreground/80")}>
                      {link.name}
                    </Link>
                  </li>)}
            </ul>
            
            {user ? <div className="mt-auto pb-8">
                <div className="mb-4 p-4 bg-muted rounded-md text-sm">
                  <p className="font-medium">{user.name || 'User'}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                  <p className="text-xs mt-1 text-primary">{user.userType === 'doctor' ? 'Doctor Account' : 'User Account'}</p>
                </div>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </Button>
              </div> : <div className="mt-auto pb-8 flex flex-col gap-3">
                <Link to="/auth">
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link to="/auth?tab=signup">
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>}
          </nav>
        </div>}
    </header>;
};
export default NavBar;