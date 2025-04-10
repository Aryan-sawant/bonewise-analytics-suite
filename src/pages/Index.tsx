
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import Hero from '@/components/Hero';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from '@/contexts/AuthContext';
import { NavBarDemo } from '@/components/ui/navbar-demo';
import { UserRound } from 'lucide-react';
import { isDoctor } from "@/types/auth";

const Index = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuthContext();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleConsultSpecialist = () => {
    // Use the user's current location to search for bone specialists in Google Maps
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        // Create Google Maps URL with search query for orthopedic doctors near me
        const mapsUrl = `https://www.google.com/maps/search/orthopedic+doctor+near+me/@${latitude},${longitude},14z`;
        // Open in a new tab
        window.open(mapsUrl, '_blank');
      }, () => {
        // If geolocation fails, open with just the search term
        const mapsUrl = `https://www.google.com/maps/search/orthopedic+doctor+near+me`;
        window.open(mapsUrl, '_blank');
      });
    } else {
      // Fallback if geolocation is not supported
      const mapsUrl = `https://www.google.com/maps/search/orthopedic+doctor+near+me`;
      window.open(mapsUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <NavBar />
      
      {/* Demo navbar (only shows on landing page) */}
      <NavBarDemo />
      
      {/* Main Content */}
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <Hero />
        
        {/* About Section */}
        <section className="py-12 md:py-20 px-4 md:px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base px-2 sm:px-0 leading-relaxed">
                BoneHealthAISuite simplifies the process of analyzing bone health through advanced AI technology
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
              <Card className="border-none bg-white shadow-card hover:shadow-lg transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 hover:rotate-y-2" 
                style={{ transformStyle: 'preserve-3d', perspective: '800px' }}>
                <CardContent className="p-4 md:p-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 md:mb-4">
                    <span className="font-bold text-base md:text-lg">1</span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold mb-2">Upload Medical Image</h3>
                  <p className="text-muted-foreground text-sm">
                    Simply upload your bone-related medical image (X-ray, MRI, CT scan)
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none bg-white shadow-card hover:shadow-lg transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 hover:rotate-y-2"
                style={{ transformStyle: 'preserve-3d', perspective: '800px' }}>
                <CardContent className="p-4 md:p-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 md:mb-4">
                    <span className="font-bold text-base md:text-lg">2</span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold mb-2">AI Analysis</h3>
                  <p className="text-muted-foreground text-sm">
                    Our advanced AI analyzes the image for various bone health conditions
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none bg-white shadow-card hover:shadow-lg transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 hover:rotate-y-2"
                style={{ transformStyle: 'preserve-3d', perspective: '800px' }}>
                <CardContent className="p-4 md:p-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 md:mb-4">
                    <span className="font-bold text-base md:text-lg">3</span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold mb-2">Receive Results</h3>
                  <p className="text-muted-foreground text-sm">
                    Get detailed results with explanations tailored to your user profile
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-12 md:py-20 px-4 md:px-6 relative overflow-hidden bg-gradient-to-br from-medical-800 to-medical-900">
          <div className="absolute inset-0 bg-bone-pattern opacity-5"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">
              Ready to get insights about your bone health?
            </h2>
            <p className="text-white/80 mb-6 md:mb-8 max-w-2xl mx-auto text-sm md:text-base px-3 sm:px-0 leading-relaxed">
              Join BoneHealthAISuite today and gain access to AI-powered bone health analysis 
              that can help you understand more about your bone condition.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? 
                <Button 
                  size="lg" 
                  onClick={() => navigate('/tasks')} 
                  className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                >
                  Go to Dashboard
                </Button> 
              : 
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth?tab=signup')} 
                  className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                >
                  Sign Up for Free
                </Button>
              }
              {user && !isDoctor(user) ? (
                <Button 
                  size="lg" 
                  onClick={handleConsultSpecialist}
                  className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                >
                  <UserRound className="mr-2 h-5 w-5" />
                  Consult a Specialist
                </Button>
              ) : !user ? (
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')} 
                  className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                >
                  Log In
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-100 py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">B</span>
                </div>
                <span className="text-lg font-semibold">BoneHealthAISuite</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2">
                AI-Powered Bone Health Analysis
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 w-full md:w-auto">
              <div>
                <h4 className="text-sm font-medium mb-3 md:mb-4">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">FAQ</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 md:mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 md:mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Disclaimer</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 md:mt-12 pt-6 md:pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} BoneHealthAISuite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Fixed CTA Button */}
      {isScrolled && !user && 
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 animate-fade-in">
          <Button 
            size="lg" 
            className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white" 
            onClick={() => navigate('/auth?tab=signup')}
          >
            Get Started
          </Button>
        </div>
      }
      {isScrolled && user && !isDoctor(user) && 
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 animate-fade-in">
          <Button 
            size="lg" 
            className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            onClick={handleConsultSpecialist}
          >
            <UserRound className="mr-2 h-5 w-5" />
            Consult a Specialist
          </Button>
        </div>
      }
    </div>
  );
};

export default Index;
