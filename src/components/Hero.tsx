
import React from 'react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface HeroProps {
  onTryNow?: () => void; // Make it optional with ?
}

const Hero = ({ onTryNow }: HeroProps) => {
  return (
    <div className="flex-1 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          AI-Powered <span className="text-indigo-500">Bone Analysis</span> for Better Healthcare
        </h1>
      </motion.div>
      
      <motion.p 
        className="text-lg md:text-xl text-muted-foreground max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Upload bone X-rays and scans to get instant AI analysis for fractures, 
        osteoporosis, arthritis, and more. Connect with specialists based on your results.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="pt-4"
      >
        <Button 
          className="text-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          size="lg"
          onClick={onTryNow}
        >
          Try Now
        </Button>
        <Button 
          variant="link" 
          className="ml-4 text-lg"
        >
          Learn More
        </Button>
      </motion.div>
    </div>
  );
};

export default Hero;
