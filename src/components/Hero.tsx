
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 bg-gradient-radial from-blue-50 to-background opacity-70"></div>
      <div className="absolute inset-0 -z-10 bg-bone-pattern opacity-5"></div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-6 inline-block">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium animate-pulse-subtle">
            AI-Powered Bone Health Analysis
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Advanced Bone Analysis with Artificial Intelligence
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          BoneHealthAI provides cutting-edge analysis of bone health conditions through advanced AI, making medical insights accessible and understandable.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link to="/auth?tab=signup">
            <Button size="lg" className="gap-2 px-6">
              Get Started
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="lg">
              Log in
            </Button>
          </Link>
        </div>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 mt-20 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="p-6 rounded-xl glass-card backdrop-blur-xs hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path><circle cx="20" cy="10" r="2"></circle></svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center">Fracture Detection</h3>
            <p className="text-muted-foreground text-center">
              Identify bone fractures from X-ray images with high accuracy
            </p>
          </div>
          
          <div className="p-6 rounded-xl glass-card backdrop-blur-xs hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M17 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12Z"></path><path d="M12 6v10"></path><path d="M10 6v1"></path><path d="M14 6v1"></path><path d="M10 15v1"></path><path d="M14 15v1"></path></svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center">Osteoporosis Analysis</h3>
            <p className="text-muted-foreground text-center">
              Predict osteoporosis stages and calculate bone mineral density
            </p>
          </div>
          
          <div className="p-6 rounded-xl glass-card backdrop-blur-xs hover:shadow-md transition-all duration-300">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-center">Medical-Grade Results</h3>
            <p className="text-muted-foreground text-center">
              Receive detailed analysis with simple explanations for everyone
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
