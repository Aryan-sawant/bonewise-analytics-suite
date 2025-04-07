
// Hero.tsx
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, useMemo } from 'react';
import { AuroraBackground } from "@/components/ui/aurora-background"; 
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

const Hero = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Add state for title animation
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Artificial Intelligence", "Assistance Intelligence"],
    []
  );

  // Animation timer effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber(titleNumber === 0 ? 1 : 0);
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber]);
  
  const features = [{
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path>
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path>
    <circle cx="20" cy="10" r="2"></circle>
    </svg>,
    title: "Fracture Detection",
    description: "Identify bone fractures from X-ray images with high accuracy"
  }, {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="m4.9 4.9 14.2 14.2"></path>
    </svg>,
    title: "Bone Marrow Analysis",
    description: "Analyze bone marrow cell classifications and distributions"
  }, {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
    <path d="M17 18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12Z"></path>
    <path d="M12 6v10"></path>
    <path d="M10 6v1"></path>
    <path d="M14 6v1"></path>
    <path d="M10 15v1"></path>
    <path d="M14 15v1"></path>
    </svg>,
    title: "Osteoarthritis Analysis",
    description: "Predict osteoarthritis stages and calculate bone mineral density"
  }, {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    </svg>,
    title: "Osteoporosis Analysis",
    description: "Evaluate bone density and osteoporosis staging"
  }, {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
    <path d="M16 18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8"></path>
    <path d="m12 8 4-4 4 4"></path>
    <path d="M8 9h4"></path>
    <path d="M8 13h8"></path>
    <path d="M8 17h8"></path>
    </svg>,
    title: "Bone Age Detection",
    description: "Accurately determine bone age from hand X-rays"
  }, {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
    <path d="m9 9-2 2 2 2"></path>
    <path d="m15 9 2 2-2 2"></path>
    <circle cx="12" cy="12" r="10"></circle>
    </svg>,
    title: "Spine Fracture Detection",
    description: "Identify fractures in the cervical spine"
  }, {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="m15 9-6 6"></path>
    <path d="m9 9 6 6"></path>
    </svg>,
    title: "Bone Tumor Detection",
    description: "Identify potential bone tumors and classify their characteristics"
  }, {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
    <path d="M8 2v4"></path>
    <path d="M16 2v4"></path>
    <rect width="16" height="16" x="4" y="4" rx="2"></rect>
    <path d="M10 16H8v-5a2 2 0 1 1 4 0"></path>
    <path d="M16 11h-2"></path>
    <path d="M16 16h-2"></path>
    </svg>,
    title: "Bone Infection Detection",
    description: "Detect signs of osteomyelitis or bone infection"
  }];

  // Auto-scroll features every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Scroll to active feature
  useEffect(() => {
    if (featuresRef.current) {
      const cardWidth = isMobile ? 280 : 320; // Approximate width of each card + gap
      const scrollPosition = activeFeature * cardWidth;
      featuresRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [activeFeature, isMobile]);

  return (
    <AuroraBackground>
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center px-4 md:px-6 overflow-hidden">
        {/* Content */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-4 md:mb-6 inline-block">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-medium animate-pulse-subtle">
              AI-Powered Bone Health Analysis
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3 md:mb-4 animate-fade-in-up" style={{
            animationDelay: '0.1s'
          }}>
            Advanced Bone Analysis with
            <br className="hidden sm:block" /> 
            <span className="relative flex w-full justify-center overflow-hidden text-center">
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute font-bold"
                  initial={{ opacity: 0, y: "-50px" }}
                  transition={{ type: "spring", stiffness: 50 }}
                  animate={
                    titleNumber === index
                      ? {
                          y: 0,
                          opacity: 1,
                        }
                      : {
                          y: titleNumber > index ? -50 : 50,
                          opacity: 0,
                        }
                  }
                >
                  {title}
                </motion.span>
              ))}
              <span className="opacity-0">{titles[0]}</span> {/* Invisible placeholder for layout */}
            </span>
          </h1>

          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto animate-fade-in-up px-2 sm:px-0 leading-relaxed" style={{
            animationDelay: '0.2s'
          }}>
            BoneHealthAISuite provides cutting-edge analysis of bone health conditions through advanced AI, making medical insights accessible and understandable.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center animate-fade-in-up" style={{
            animationDelay: '0.3s'
          }}>
            <Link to="/auth?tab=signup">
              <Button size="lg" className="gap-2 px-4 md:px-6 w-full sm:w-auto transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 text-sm md:text-base">
                Get Started
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 w-full sm:w-auto text-sm md:text-base">
                Log in
              </Button>
            </Link>
          </div>

          {/* New Heading and Description */}
          <div className="mt-8 md:mt-12 animate-fade-in-up px-3 sm:px-0" style={{ animationDelay: '0.35s' }}>
            <h2 className="text-xl md:text-2xl font-bold text-black mb-2">The Analyses We Provide</h2>
            <p className="text-muted-foreground text-center max-w-xl mx-auto mb-4 text-sm md:text-base px-2 sm:px-0 leading-relaxed">
              Explore our wide range of AI-powered analysis options, each designed to provide detailed insights into different aspects of bone health.
            </p>
          </div>

          {/* Features - Now with horizontal scrolling */}
          <div className="mt-3 md:mt-4 animate-fade-in-up" style={{
            animationDelay: '0.4s'
          }}>
            <div ref={featuresRef} className="flex overflow-x-auto pb-4 pt-2 scrollbar-hide snap-x snap-mandatory scroll-smooth" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <div className="flex space-x-4 md:space-x-6 px-4">
                {features.map((feature, index) => (
                  <div 
                    key={index} 
                    className={`p-4 md:p-6 min-w-[280px] md:min-w-[320px] rounded-xl shadow-sm backdrop-blur-xs snap-center transition-all
                      ${activeFeature === index ? 'border-primary/30 bg-primary/5' : 'border border-transparent'}
                    `} 
                    onClick={() => setActiveFeature(index)}
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg bg-primary/10 mb-2 mx-auto">
                      {feature.icon}
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-1 text-center">{feature.title}</h3>
                    <p className="text-muted-foreground text-center text-xs md:text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation dots */}
            <div className="hidden md:flex justify-center space-x-2 mt-4">
              {features.map((_, index) => (
                <button 
                  key={index} 
                  className={`w-2 h-2 rounded-full transition-all duration-300
                    ${activeFeature === index ? 'bg-primary w-4' : 'bg-primary/30'}`} 
                  onClick={() => setActiveFeature(index)} 
                  aria-label={`View feature ${index + 1}`} 
                />
              ))}
            </div>
            
            {/* Mobile indicator */}
            <div className="flex md:hidden justify-center mt-4">
              <span className="text-xs text-muted-foreground">
                {activeFeature + 1} of {features.length}
              </span>
            </div>
          </div>
        </div>
      </section>
    </AuroraBackground>
  );
};

export default Hero;
