
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";

const FindDoctor = () => {
  const { user } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Get specialty type from URL if available
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const specialtyFromUrl = searchParams.get('specialty');
    if (specialtyFromUrl) {
      setSelectedSpecialty(specialtyFromUrl);
    } else {
      setSelectedSpecialty('Orthopedic Specialist');
    }
  }, [location]);

  // Common specialties for bone health
  const specialties = [
    'Orthopedic Surgeon',
    'Radiologist',
    'Endocrinologist',
    'Rheumatologist',
    'Pathologist',
    'Orthopedic Oncologist',
    'Hematopathologist',
    'Pediatric Endocrinologist',
    'Orthopedic Specialist',
    'Primary Care Physician',
    'Neurosurgeon',
    'Infectious Disease Specialist',
    'Orthopedic Spine Surgeon'
  ];

  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would reverse geocode the coordinates
          // For this example, we'll just set a fixed location
          setUserLocation('Boston, MA 02215');
          setIsGettingLocation(false);
          toast.success('Location detected');
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation('');
          setIsGettingLocation(false);
          toast.error('Unable to get your location. Please enter it manually.');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would search based on the search query
    // For this example, we'll just open the FindDoctorDialog
    openFindDoctorDialog();
  };

  const openFindDoctorDialog = () => {
    // For now, we'll use the existing dialog by navigating to results page with params
    navigate(`/result?type=consultation&specialty=${encodeURIComponent(selectedSpecialty)}`);
  };

  return (
    <div className="container page-transition max-w-6xl py-16 px-4 md:px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Find a Specialist</h1>
        <p className="text-muted-foreground">
          Connect with medical specialists who can provide professional care based on your bone health needs
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-6 rounded-xl border">
            <h2 className="text-xl font-semibold mb-4">Find a Doctor</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="location" className="text-sm font-medium">Your Location</Label>
                <div className="flex mt-1">
                  <Input
                    id="location"
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    placeholder="Enter your location"
                    className="rounded-r-none"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={getLocation} 
                    disabled={isGettingLocation}
                    className="rounded-l-none"
                  >
                    {isGettingLocation ? (
                      <span className="h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    ) : (
                      <Navigation size={16} />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="specialty" className="text-sm font-medium">Specialty</Label>
                <select
                  id="specialty"
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>
              
              <form onSubmit={handleSearch} className="relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by doctor name or condition..."
                  className="pl-9"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </form>
              
              <Button 
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
                onClick={openFindDoctorDialog}
              >
                Find Specialists
              </Button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-6 rounded-xl border">
            <h2 className="text-xl font-semibold mb-4">Why See a Specialist?</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="mt-1 text-indigo-500">•</div>
                <span>Get expert diagnosis and treatment options for your specific condition</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 text-indigo-500">•</div>
                <span>Access specialized treatments not available through general practitioners</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 text-indigo-500">•</div>
                <span>Receive personalized care plans tailored to your needs</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 text-indigo-500">•</div>
                <span>Connect your analysis results directly with qualified professionals</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-6 rounded-xl border">
            <h2 className="text-xl font-semibold mb-4">Common Specialists for Bone Health</h2>
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h3 className="font-medium">Orthopedic Surgeon</h3>
                <p className="text-sm text-muted-foreground">Diagnoses and treats bone fractures, joint issues, and other musculoskeletal conditions</p>
              </div>
              <div className="border-b pb-3">
                <h3 className="font-medium">Rheumatologist</h3>
                <p className="text-sm text-muted-foreground">Specializes in diseases that affect the joints, muscles, and bones</p>
              </div>
              <div className="border-b pb-3">
                <h3 className="font-medium">Endocrinologist</h3>
                <p className="text-sm text-muted-foreground">Treats hormone-related conditions that can affect bone health, such as osteoporosis</p>
              </div>
              <div>
                <h3 className="font-medium">Radiologist</h3>
                <p className="text-sm text-muted-foreground">Interprets medical images to diagnose bone conditions and fractures</p>
              </div>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-xl border">
            <img 
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1000" 
              alt="Doctor consultation" 
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
              <h3 className="text-white text-xl font-semibold mb-2">Get Personalized Care</h3>
              <p className="text-white/80 text-sm mb-4">After your bone analysis, our system can match you with the right specialist for your condition</p>
              <Button 
                className="w-fit bg-white text-indigo-700 hover:bg-white/90"
                onClick={openFindDoctorDialog}
              >
                Find a Specialist
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindDoctor;
