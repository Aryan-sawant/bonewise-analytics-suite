// Hero.tsx
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from 'react';
import { AuroraBackground } from "@/components/ui/component"; // Import AuroraBackground
import Image from 'next/image'; // Import Image component for optimized images

const Hero = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);
  const features = [{
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path>
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path>
      <circle cx="20" cy="10" r="2"></circle>
    </svg>,
    title: "Fracture Detection",
    description: "Identify bone fractures from X-ray images with high accuracy"
  }, {
    icon: <svg xmlns="http://www.w3.org/24000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="m4.9 4.9 14.2 14.2"></path>
    </svg>,
    title: "Bone Marrow Analysis",
    description: "Analyze bone marrow cell classifications and distributions"
  }, {
    icon: <svg xmlns="http://www.w3.org/24000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
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
    icon: <svg xmlns="http://www.w3.org/24000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    </svg>,
    title: "Osteoporosis Analysis",
    description: "Evaluate bone density and osteoporosis staging"
  }, {
    icon: <svg xmlns="http://www.w3.org/24000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M16 18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h8"></path>
      <path d="m12 8 4-4 4 4"></path>
      <path d="M8 9h4"></path>
      <path d="M8 13h8"></path>
      <path d="M8 17h8"></path>
    </svg>,
    title: "Bone Age Detection",
    description: "Accurately determine bone age from hand X-rays"
  }, {
    icon: <svg xmlns="http://www.w3.org/24000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="m9 9-2 2 2 2"></path>
      <path d="m15 9 2 2-2 2"></path>
      <circle cx="12" cy="12" r="10"></circle>
    </svg>,
    title: "Spine Fracture Detection",
    description: "Identify fractures in the cervical spine"
  }, {
    icon: <svg xmlns="http://www.w3.org/24000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="m15 9-6 6"></path>
      <path d="m9 9 6 6"></path>
    </svg>,
    title: "Bone Tumor Detection",
    description: "Identify potential bone tumors and classify their characteristics"
  }, {
    icon: <svg xmlns="http://www.w3.org/24000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
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

  const certificates = [
    {
      name: "Dr. John Smith",
      credentials: "MD, Orthopedic Surgeon",
      imageUrl: "/certificates/dr_john_smith_certificate.png", // Path to your certificate image in public folder
      testimonial: "\"BoneHealthAISuite has significantly improved my diagnostic workflow. The AI analysis is remarkably accurate and saves valuable time.\""
    },
    {
      name: "Dr. Emily Chen",
      credentials: "PhD, Radiologist",
      imageUrl: "/certificates/dr_emily_chen_certificate.png", // Path to your certificate image in public folder
      testimonial: "\"The level of detail and insight provided by BoneHealthAISuite is exceptional. It's a game-changer for bone health analysis.\""
    },
    // Add more certificate data here
  ];


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
      const scrollPosition = activeFeature * 320; // Approximate width of each card + gap
      featuresRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [activeFeature]);
  return (
    <AuroraBackground> {/* Wrap the Hero content with AuroraBackground */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 md:px-6 overflow-hidden"> {/* Adjusted px-4 md:px-6 for container padding */}
        {/* Background Elements - These are now inside AuroraBackground and might be redundant */}
        {/* <div className="absolute inset-0 -z-10 bg-gradient-radial from-blue-50 to-background opacity-70"></div>
        <div className="absolute inset-0 -z-10 bg-bone-pattern opacity-5"></div> */}

        {/* Content */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 inline-block">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium animate-pulse-subtle">
              AI-Powered Bone Health Analysis
            </span>
          </div>

          <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4 animate-fade-in-up" style={{ // Reduced mt-4 and font size slightly
          animationDelay: '0.1s',
          whiteSpace: 'pre-line' // Added whiteSpace: 'pre-line'
        }}>
            Advanced Bone Analysis with{`\n`}Artificial Intelligence {/* Line break using newline character */}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{ // Reduced mb-8
          animationDelay: '0.2s'
        }}>BoneHealthAISuite provides cutting-edge analysis of bone health conditions through advanced AI, making medical insights accessible and understandable.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{
          animationDelay: '0.3s'
        }}>
            <Link to="/auth?tab=signup">
              <Button size="lg" className="gap-2 px-6 transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105"> {/* 3D Hover Effect */}
                Get Started
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105"> {/* 3D Hover Effect */}
                Log in
              </Button>
            </Link>
          </div>

          {/* New Heading and Description for Analyses */}
          <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '0.35s' }}> {/* Reduced mt-12 */}
            <h2 className="text-2xl font-bold text-black mb-2">The Analyses We Provide</h2>
            <p className="text-muted-foreground text-center max-w-xl mx-auto mb-4"> {/* Reduced mb-4 */}
              Explore our wide range of AI-powered analysis options, each designed to provide detailed insights into different aspects of bone health.
            </p>
          </div>

          {/* Features - Now with horizontal scrolling */}
          <div className="mt-4 animate-fade-in-up overflow-hidden" style={{ // Reduced mt-4
          animationDelay: '0.4s'
        }}>
            <div ref={featuresRef} className="flex overflow-x-auto pb-4 pt-2 scrollbar-hide snap-x snap-mandatory scroll-smooth" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
              <div className="flex space-x-6 px-4">
                {features.map((feature, index) => (
                  <div key={index} className={`p-6 min-w-[280px] rounded-xl shadow-sm backdrop-blur-xs snap-center transition-all
                      ${activeFeature === index ? 'border-primary/30 bg-primary/5' : 'border border-transparent'}
                    `} onClick={() => setActiveFeature(index)}>
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 mb-2 mx-auto">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-1 text-center">{feature.title}</h3>
                    <p className="text-muted-foreground text-center text-sm leading-relaxed"> {/* Feature Description is here - Reduced font-sm, Added leading-relaxed */}
                      {feature.description}
                    </p>
                  </div>))}
              </div>
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center space-x-2 mt-4">
              {features.map((_, index) => <button key={index} className={`w-2 h-2 rounded-full transition-all duration-300
                    ${activeFeature === index ? 'bg-primary w-4' : 'bg-primary/30'}`} onClick={() => setActiveFeature(index)} aria-label={`View feature ${index + 1}`} />)}
            </div>
          </div>

          {/* Evidence Section */}
          <div className="mt-20 animate-fade-in-up" style={{ animationDelay: '0.5s' }}> {/* Added mt-20 */}
            <h2 className="text-2xl font-bold text-black mb-6 text-center">Trusted and Expert-Approved</h2> {/* Centered heading */}
            <p className="text-muted-foreground text-center max-w-xl mx-auto mb-8"> {/* Centered description */}
              Our AI-driven analysis is validated and trusted by medical professionals. See what doctors and specialists are saying about BoneHealthAISuite.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto px-4"> {/* Responsive grid, max-width, centered */}
              {certificates.map((certificate, index) => (
                <div key={index} className="p-4 rounded-xl shadow-md bg-card dark:bg-card-dark border"> {/* Card for each certificate */}
                  <div className="relative h-64 w-full mb-4 overflow-hidden rounded-md"> {/* Container for Image, adjust h-64 as needed */}
                    <Image
                      src={certificate.imageUrl}
                      alt={`Certificate for ${certificate.name}`}
                      fill
                      style={{ objectFit: 'contain' }} // or 'cover' depending on your certificate image aspect ratio
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Responsive sizes
                      className="rounded-md"
                    />
                  </div>
                  <h4 className="text-lg font-semibold text-center text-foreground dark:text-card-foreground-dark">{certificate.name}</h4> {/* Doctor Name */}
                  <p className="text-sm text-muted-foreground text-center mb-2">{certificate.credentials}</p> {/* Credentials */}
                  {certificate.testimonial && (
                    <blockquote className="text-sm italic text-gray-600 dark:text-gray-400 text-center">
                      {certificate.testimonial}
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AuroraBackground>
  );
};
export default Hero;
