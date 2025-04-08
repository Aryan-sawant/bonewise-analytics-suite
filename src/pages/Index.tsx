
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AnimatedHero } from '@/components/ui/component';
import { useAuthContext } from '@/contexts/AuthContext';
import Hero from '@/components/Hero';
import ChatbotButton from '@/components/ChatbotButton';
import FindDoctorDialog from '@/components/FindDoctorDialog';
import { MapPin } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [findDoctorOpen, setFindDoctorOpen] = useState(false);

  const handleTryNow = () => {
    if (!user) {
      navigate('/auth');
    } else {
      navigate('/bone-analysis');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col text-center sm:text-left relative overflow-hidden">
      <div className="flex-1 container max-w-6xl py-12 px-4 md:px-6 flex flex-col justify-between relative z-10">
        <div className="flex flex-col sm:flex-row items-center mt-16 sm:mt-20 relative">
          <Hero onTryNow={handleTryNow} />
          <AnimatedHero className="w-full max-w-lg mx-auto sm:mx-0 mt-8 sm:mt-0" />
        </div>

        <div className="flex justify-center sm:justify-start items-center gap-4 py-12">
          <Button 
            onClick={handleTryNow} 
            size="lg" 
            className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-lg font-semibold"
          >
            {user ? 'Start Analysis' : 'Get Started'}
          </Button>
          
          <Button 
            onClick={() => setFindDoctorOpen(true)} 
            size="lg" 
            variant="outline" 
            className="border-2 text-lg font-semibold flex items-center gap-2"
          >
            <MapPin className="h-5 w-5 text-indigo-500" />
            Consult Doctor
          </Button>
        </div>
      </div>
      
      <FindDoctorDialog 
        open={findDoctorOpen} 
        onOpenChange={setFindDoctorOpen} 
        specialistType="Orthopedic Specialist"
        analysisType="Bone Health Analysis"
      />
      
      <ChatbotButton 
        analysisContext="general"
        taskTitle="General Inquiry"
        analysisId="landing-page"
      />
    </div>
  );
};

export default Index;
