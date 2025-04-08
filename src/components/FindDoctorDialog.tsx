
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Search, Navigation, Phone, Clock, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

interface FindDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialistType: string;
  analysisType: string;
}

// Specialist mapping based on analysis type
const specialistMapping: Record<string, string[]> = {
  'Bone Fracture Detection': ['Orthopedic Surgeon', 'Radiologist'],
  'Osteoporosis Prediction': ['Endocrinologist', 'Rheumatologist', 'Radiologist'],
  'Bone Marrow Analysis': ['Hematopathologist', 'Pathologist'],
  'Bone Cancer Detection': ['Orthopedic Oncologist', 'Pathologist', 'Radiologist'],
  'Bone Age Assessment': ['Pediatric Endocrinologist', 'Radiologist'],
  'Bone Health Analysis': ['Orthopedic Specialist', 'Primary Care Physician'],
  'Osteoarthritis Grading': ['Orthopedic Surgeon', 'Radiologist'],
  'Bone Infection Detection': ['Orthopedic Surgeon', 'Infectious Disease Specialist'],
  'Spine Analysis': ['Orthopedic Spine Surgeon', 'Neurosurgeon', 'Radiologist'],
};

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  distance: string;
  phone: string;
  hours: string;
  rating: number;
  image: string;
}

// Mock data for doctors by specialty
const mockDoctorsBySpecialty: Record<string, Doctor[]> = {
  'Orthopedic Surgeon': [
    {
      id: 'dr1',
      name: 'Dr. Jane Smith',
      specialty: 'Orthopedic Surgeon',
      address: '123 Medical Center Dr, Boston, MA 02115',
      distance: '0.8 miles',
      phone: '(617) 555-1234',
      hours: 'Mon-Fri: 8am-5pm',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=1000'
    },
    {
      id: 'dr2',
      name: 'Dr. Robert Johnson',
      specialty: 'Orthopedic Surgeon',
      address: '456 Hospital Way, Boston, MA 02116',
      distance: '1.2 miles',
      phone: '(617) 555-5678',
      hours: 'Mon-Fri: 9am-6pm',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=1000'
    },
  ],
  'Radiologist': [
    {
      id: 'dr3',
      name: 'Dr. Michael Chen',
      specialty: 'Radiologist',
      address: '789 Imaging Center, Boston, MA 02118',
      distance: '1.5 miles',
      phone: '(617) 555-9012',
      hours: 'Mon-Sat: 7am-8pm',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1000'
    },
  ],
  'Endocrinologist': [
    {
      id: 'dr4',
      name: 'Dr. Sarah Williams',
      specialty: 'Endocrinologist',
      address: '321 Specialist Blvd, Boston, MA 02120',
      distance: '0.6 miles',
      phone: '(617) 555-3456',
      hours: 'Mon-Fri: 8:30am-4:30pm',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1000'
    },
  ],
  'Rheumatologist': [
    {
      id: 'dr5',
      name: 'Dr. Elizabeth Taylor',
      specialty: 'Rheumatologist',
      address: '555 Arthritis Care St, Boston, MA 02119',
      distance: '2.1 miles',
      phone: '(617) 555-7890',
      hours: 'Mon-Thu: 9am-5pm, Fri: 9am-3pm',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?q=80&w=1000'
    },
  ],
  'Orthopedic Oncologist': [
    {
      id: 'dr6',
      name: 'Dr. James Wilson',
      specialty: 'Orthopedic Oncologist',
      address: '888 Cancer Center Dr, Boston, MA 02215',
      distance: '3.2 miles',
      phone: '(617) 555-2345',
      hours: 'Mon-Fri: 8am-6pm',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1000'
    },
  ],
  'Pathologist': [
    {
      id: 'dr7',
      name: 'Dr. Thomas Brown',
      specialty: 'Pathologist',
      address: '777 Laboratory Ave, Boston, MA 02127',
      distance: '1.8 miles',
      phone: '(617) 555-6789',
      hours: 'Mon-Fri: 7am-7pm',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1612349316228-5942a9b489c2?q=80&w=1000'
    },
  ],
  'Hematopathologist': [
    {
      id: 'dr8',
      name: 'Dr. Anna Martinez',
      specialty: 'Hematopathologist',
      address: '444 Blood Center Blvd, Boston, MA 02125',
      distance: '2.5 miles',
      phone: '(617) 555-0123',
      hours: 'Mon-Fri: 8am-5pm',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=1000'
    },
  ],
  'Pediatric Endocrinologist': [
    {
      id: 'dr9',
      name: 'Dr. Lisa Garcia',
      specialty: 'Pediatric Endocrinologist',
      address: '222 Children\'s Hospital Way, Boston, MA 02115',
      distance: '0.9 miles',
      phone: '(617) 555-4567',
      hours: 'Mon-Fri: 9am-5pm',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1000'
    },
  ],
  'Orthopedic Specialist': [
    {
      id: 'dr10',
      name: 'Dr. David Anderson',
      specialty: 'Orthopedic Specialist',
      address: '999 Bone Center Dr, Boston, MA 02116',
      distance: '1.0 miles',
      phone: '(617) 555-8901',
      hours: 'Mon-Fri: 8am-6pm, Sat: 9am-1pm',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?q=80&w=1000'
    },
  ],
  'Primary Care Physician': [
    {
      id: 'dr11',
      name: 'Dr. Rachel Lee',
      specialty: 'Primary Care Physician',
      address: '111 Family Practice St, Boston, MA 02118',
      distance: '0.7 miles',
      phone: '(617) 555-2345',
      hours: 'Mon-Fri: 8:30am-5:30pm',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?q=80&w=1000'
    },
  ],
  'Neurosurgeon': [
    {
      id: 'dr12',
      name: 'Dr. Mark Thompson',
      specialty: 'Neurosurgeon',
      address: '666 Brain & Spine Center, Boston, MA 02120',
      distance: '1.7 miles',
      phone: '(617) 555-6789',
      hours: 'Mon-Fri: 7:30am-4:30pm',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1000'
    },
  ],
  'Infectious Disease Specialist': [
    {
      id: 'dr13',
      name: 'Dr. Katherine White',
      specialty: 'Infectious Disease Specialist',
      address: '333 Infection Control Rd, Boston, MA 02119',
      distance: '2.3 miles',
      phone: '(617) 555-0123',
      hours: 'Mon-Fri: 9am-5pm',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1000'
    },
  ],
  'Orthopedic Spine Surgeon': [
    {
      id: 'dr14',
      name: 'Dr. Christopher Davis',
      specialty: 'Orthopedic Spine Surgeon',
      address: '444 Spine Center, Boston, MA 02215',
      distance: '1.4 miles',
      phone: '(617) 555-4567',
      hours: 'Mon-Fri: 8am-5pm',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1000'
    },
  ]
};

const FindDoctorDialog = ({ open, onOpenChange, specialistType, analysisType }: FindDoctorDialogProps) => {
  const [location, setLocation] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [specialists, setSpecialists] = useState<string[]>([]);
  const [activeSpecialty, setActiveSpecialty] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Initialize specialists and active specialty based on analysis type
  useEffect(() => {
    if (analysisType) {
      const relevantSpecialists = specialistMapping[analysisType] || ['Orthopedic Specialist'];
      setSpecialists(relevantSpecialists);
      setActiveSpecialty(specialistType || relevantSpecialists[0]);
    }
  }, [analysisType, specialistType]);

  // Fetch doctors when specialty changes
  useEffect(() => {
    if (activeSpecialty) {
      setIsLoading(true);
      // Simulate API call with setTimeout
      setTimeout(() => {
        setDoctors(mockDoctorsBySpecialty[activeSpecialty] || []);
        setIsLoading(false);
      }, 800);
    }
  }, [activeSpecialty]);

  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would reverse geocode the coordinates
          // For this example, we'll just set a fixed location
          setLocation('Boston, MA 02215');
          setIsGettingLocation(false);
          toast.success('Location detected');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation('');
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
    // For this example, we'll just toast a message
    toast.info(`Searching for "${searchQuery}" near ${location || 'your location'}`);
  };

  const handleSpecialistClick = (specialty: string) => {
    setActiveSpecialty(specialty);
    setSelectedDoctor(null);
  };

  const handleBookAppointment = (doctor: Doctor) => {
    toast.success(`Appointment request sent to ${doctor.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-500" />
            Find Specialists for {analysisType}
          </DialogTitle>
          <DialogDescription>
            Connect with medical specialists who can provide professional care based on your analysis results
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 overflow-hidden flex-1">
          {/* Left sidebar - specialties */}
          <div className="w-full md:w-64 flex-shrink-0 border-r pr-4">
            <div className="mb-4">
              <Label htmlFor="location" className="text-sm font-medium">Your Location</Label>
              <div className="flex mt-1">
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
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
            
            <form onSubmit={handleSearch} className="relative mb-6">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search specialists..."
                className="pl-9"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </form>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommended Specialists</h3>
              {specialists.map((specialty) => (
                <Button
                  key={specialty}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    specialty === activeSpecialty && "bg-indigo-50 text-indigo-700"
                  )}
                  onClick={() => handleSpecialistClick(specialty)}
                >
                  {specialty}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Right side - doctor list */}
          <div className="flex-1 overflow-y-auto">
            {selectedDoctor ? (
              <div className="h-full">
                <div className="flex justify-between mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1 text-muted-foreground"
                    onClick={() => setSelectedDoctor(null)}
                  >
                    <X size={16} />
                    Back to List
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-full md:w-1/3 aspect-square overflow-hidden rounded-lg">
                      <img 
                        src={selectedDoctor.image} 
                        alt={selectedDoctor.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedDoctor.name}</h2>
                        <p className="text-indigo-600 font-medium">{selectedDoctor.specialty}</p>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {Array(5).fill(0).map((_, i) => (
                          <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path 
                              d="M8 1.5L10.163 5.77735L15 6.46498L11.5 9.79248L12.326 14.5L8 12.2773L3.674 14.5L4.5 9.79248L1 6.46498L5.837 5.77735L8 1.5Z" 
                              fill={i < Math.floor(selectedDoctor.rating) ? "#FBBF24" : "#E5E7EB"}
                              stroke={i < Math.floor(selectedDoctor.rating) ? "#FBBF24" : "#E5E7EB"}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ))}
                        <span className="text-sm font-medium ml-1">{selectedDoctor.rating}</span>
                      </div>
                      
                      <div className="space-y-2 pt-2">
                        <div className="flex items-start gap-2">
                          <MapPin size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{selectedDoctor.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={18} className="text-muted-foreground flex-shrink-0" />
                          <span>{selectedDoctor.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={18} className="text-muted-foreground flex-shrink-0" />
                          <span>{selectedDoctor.hours}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2 space-y-2">
                        <h3 className="font-medium">About</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedDoctor.name} is a highly qualified {selectedDoctor.specialty.toLowerCase()} with extensive experience in treating conditions related to {analysisType.toLowerCase()}. They provide comprehensive care and work with patients to develop personalized treatment plans.
                        </p>
                      </div>
                      
                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        <Button 
                          className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
                          onClick={() => handleBookAppointment(selectedDoctor)}
                        >
                          Book Appointment
                        </Button>
                        <Button variant="outline" className="flex-1 gap-1">
                          <ExternalLink size={16} />
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-medium mb-4">{activeSpecialty}s near {location || 'you'}</h2>
                
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin mb-4"></div>
                    <p className="text-muted-foreground">Finding specialists in your area...</p>
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-muted/30 p-4 rounded-full mb-4">
                      <MapPin size={24} className="text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No specialists found</h3>
                    <p className="text-muted-foreground max-w-md">
                      We couldn't find any {activeSpecialty.toLowerCase()}s in this area. Try another specialty or update your location.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {doctors.map((doctor) => (
                      <div 
                        key={doctor.id} 
                        className="border rounded-lg overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedDoctor(doctor)}
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-1/4 aspect-video sm:aspect-square">
                            <img 
                              src={doctor.image} 
                              alt={doctor.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4 flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <h3 className="font-medium">{doctor.name}</h3>
                                <p className="text-sm text-indigo-600">{doctor.specialty}</p>
                              </div>
                              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">{doctor.distance}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1 mb-3">
                              {Array(5).fill(0).map((_, i) => (
                                <svg key={i} width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path 
                                    d="M8 1.5L10.163 5.77735L15 6.46498L11.5 9.79248L12.326 14.5L8 12.2773L3.674 14.5L4.5 9.79248L1 6.46498L5.837 5.77735L8 1.5Z" 
                                    fill={i < Math.floor(doctor.rating) ? "#FBBF24" : "#E5E7EB"}
                                    stroke={i < Math.floor(doctor.rating) ? "#FBBF24" : "#E5E7EB"}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ))}
                              <span className="text-xs font-medium ml-1">{doctor.rating}</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <MapPin size={14} className="mr-1" />
                              {doctor.address}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs bg-muted px-2 py-1 rounded-full">{doctor.hours}</span>
                              <span className="text-xs bg-muted px-2 py-1 rounded-full">{doctor.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="border-t pt-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FindDoctorDialog;
