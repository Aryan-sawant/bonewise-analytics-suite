
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin } from 'lucide-react';
import FindDoctorDialog from './FindDoctorDialog';

interface ConsultDoctorSectionProps {
  specialistType: string;
  analysisType: string;
}

const ConsultDoctorSection = ({ specialistType, analysisType }: ConsultDoctorSectionProps) => {
  const [findDoctorOpen, setFindDoctorOpen] = useState(false);
  
  return (
    <>
      <div className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-lg p-6 border">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="md:w-1/2">
            <h3 className="text-xl font-bold mb-2">Need Professional Help?</h3>
            <p className="text-muted-foreground mb-4">
              Based on your analysis, we recommend consulting with a {specialistType.toLowerCase()}. 
              They can provide professional medical advice and treatment options for your condition.
            </p>
            <Button 
              className="gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
              onClick={() => setFindDoctorOpen(true)}
              size="lg"
            >
              <MapPin size={18} className="text-white" />
              <span className="text-white font-medium">Find a {specialistType} Near You</span>
            </Button>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1622902046580-2b47f47f5471?q=80&w=800" 
              alt="Doctor consultation" 
              className="rounded-lg object-cover h-48 w-full md:h-36 md:w-auto"
            />
          </div>
        </div>
      </div>
      
      <FindDoctorDialog 
        open={findDoctorOpen} 
        onOpenChange={setFindDoctorOpen} 
        specialistType={specialistType} 
        analysisType={analysisType}
      />
    </>
  );
};

export default ConsultDoctorSection;
