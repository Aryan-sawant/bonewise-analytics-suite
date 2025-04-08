
import { useState, useEffect, useRef } from 'react';
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
  rating: number;
  placeId: string;
  vicinity: string;
}

const FindDoctorDialog = ({ open, onOpenChange, specialistType, analysisType }: FindDoctorDialogProps) => {
  const [location, setLocation] = useState<string>('');
  const [userCoordinates, setUserCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [specialists, setSpecialists] = useState<string[]>([]);
  const [activeSpecialty, setActiveSpecialty] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  
  // Initialize specialists and active specialty based on analysis type
  useEffect(() => {
    if (analysisType) {
      const relevantSpecialists = specialistMapping[analysisType] || ['Orthopedic Specialist'];
      setSpecialists(relevantSpecialists);
      setActiveSpecialty(specialistType || relevantSpecialists[0]);
    }
  }, [analysisType, specialistType]);

  // Get user location immediately when dialog opens
  useEffect(() => {
    if (open) {
      getLocation();
    }
  }, [open]);

  // Load Google Maps API
  useEffect(() => {
    if (!window.google && !document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBfRRgBujn9Gf6JZUgjz8fIn7UwA1oBJ8k&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (userCoordinates && mapRef.current) {
          initMap();
        }
      };
      document.head.appendChild(script);
    } else if (window.google && userCoordinates && mapRef.current) {
      initMap();
    }
  }, [userCoordinates, mapRef.current]);

  // Fetch doctors when specialty or location changes
  useEffect(() => {
    if (userCoordinates && activeSpecialty) {
      searchNearbyDoctors();
    }
  }, [userCoordinates, activeSpecialty]);

  const initMap = () => {
    if (!mapRef.current || !userCoordinates) return;
    
    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: userCoordinates,
      zoom: 13,
      mapTypeControl: false,
    });
    
    // Add user location marker
    new google.maps.Marker({
      position: userCoordinates,
      map: googleMapRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#4338ca",
        fillOpacity: 0.4,
        strokeWeight: 1,
        strokeColor: "#4338ca",
      },
      title: "Your location",
    });
  };

  const getLocation = () => {
    setIsGettingLocation(true);
    setDoctors([]);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserCoordinates(coords);
          
          // Reverse geocode to get address
          if (window.google && window.google.maps) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: coords }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                setLocation(results[0].formatted_address);
              } else {
                setLocation(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
              }
              setIsGettingLocation(false);
            });
          } else {
            setLocation(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
            setIsGettingLocation(false);
          }
          toast.success('Location detected');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation('');
          setUserCoordinates(null);
          setIsGettingLocation(false);
          toast.error('Unable to get your location. Please try again.');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
    }
  };

  const searchNearbyDoctors = () => {
    if (!window.google || !userCoordinates || !googleMapRef.current) {
      toast.error('Google Maps not loaded. Please try again later.');
      return;
    }

    setIsLoading(true);
    setDoctors([]);
    
    // Clear previous markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    const service = new google.maps.places.PlacesService(googleMapRef.current);
    const searchTerm = `${activeSpecialty} doctor`;
    
    service.nearbySearch({
      location: userCoordinates,
      radius: 5000, // 5km radius
      type: 'doctor',
      keyword: searchTerm,
    }, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const foundDoctors: Doctor[] = [];
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(userCoordinates);
        
        results.forEach((place, index) => {
          if (!place.geometry || !place.geometry.location) return;
          
          // Create marker for each result
          const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: googleMapRef.current || null,
            title: place.name,
            animation: google.maps.Animation.DROP,
          });
          
          markersRef.current.push(marker);
          bounds.extend(place.geometry.location);
          
          // Add click listener to marker
          marker.addListener('click', () => {
            const doctor = foundDoctors.find(d => d.placeId === place.place_id);
            if (doctor) {
              setSelectedDoctor(doctor);
            }
          });
          
          // Calculate distance from user location
          const distance = google.maps.geometry
            ? google.maps.geometry.spherical.computeDistanceBetween(
                userCoordinates, 
                place.geometry.location
              )
            : 0;
          
          const distanceInMiles = distance ? (distance / 1609.34).toFixed(1) : 'unknown';
          
          foundDoctors.push({
            id: `doc-${index}`,
            name: place.name || `Doctor #${index + 1}`,
            specialty: activeSpecialty,
            address: place.vicinity || 'Address unavailable',
            vicinity: place.vicinity || '',
            distance: `${distanceInMiles} miles`,
            phone: place.formatted_phone_number || 'Phone unavailable',
            rating: place.rating || 0,
            placeId: place.place_id || '',
          });
        });
        
        // Sort by distance
        foundDoctors.sort((a, b) => {
          const distA = parseFloat(a.distance);
          const distB = parseFloat(b.distance);
          return distA - distB;
        });
        
        setDoctors(foundDoctors);
        
        // Fit map to markers
        if (googleMapRef.current && markersRef.current.length > 0) {
          googleMapRef.current.fitBounds(bounds);
        }
      } else {
        console.error('Google Places API error:', status);
        toast.error('Could not find doctors in your area. Please try a different specialty.');
      }
      
      setIsLoading(false);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (userCoordinates) {
      searchNearbyDoctors();
    } else {
      toast.error('Please allow location access to search for doctors');
      getLocation();
    }
  };

  const handleSpecialistClick = (specialty: string) => {
    setActiveSpecialty(specialty);
    setSelectedDoctor(null);
  };

  const handleBookAppointment = (doctor: Doctor) => {
    // Open Google Maps with directions to the doctor
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(doctor.address)}&destination_place_id=${doctor.placeId}`;
    window.open(directionsUrl, '_blank');
    toast.success(`Opening directions to ${doctor.name}`);
  };

  const getPlaceDetails = (placeId: string) => {
    if (!window.google || !googleMapRef.current) return;
    
    const service = new google.maps.places.PlacesService(googleMapRef.current);
    
    service.getDetails({
      placeId: placeId,
      fields: ['name', 'formatted_phone_number', 'website', 'opening_hours', 'review']
    }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        console.log('Place details:', place);
        // You could update the selected doctor with more details here
      }
    });
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
                  readOnly
                  placeholder="Detecting location..."
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
                    specialty === activeSpecialty && "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400"
                  )}
                  onClick={() => handleSpecialistClick(specialty)}
                >
                  {specialty}
                </Button>
              ))}
            </div>
            
            <div className="mt-6">
              <div ref={mapRef} className="w-full h-48 bg-muted rounded-lg"></div>
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
                    <div className="w-full md:w-1/3 bg-muted rounded-lg flex items-center justify-center h-48">
                      <MapPin size={48} className="text-muted-foreground/50" />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedDoctor.name}</h2>
                        <p className="text-indigo-600 font-medium">{selectedDoctor.specialty}</p>
                      </div>
                      
                      {selectedDoctor.rating > 0 && (
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
                          <span className="text-sm font-medium ml-1">{selectedDoctor.rating.toFixed(1)}</span>
                        </div>
                      )}
                      
                      <div className="space-y-2 pt-2">
                        <div className="flex items-start gap-2">
                          <MapPin size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{selectedDoctor.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={18} className="text-muted-foreground flex-shrink-0" />
                          <span>{selectedDoctor.phone || "Contact information unavailable"}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>Contact for hours</span>
                        </div>
                      </div>
                      
                      <div className="pt-2 space-y-2">
                        <h3 className="font-medium">About</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedDoctor.name} is a {selectedDoctor.specialty.toLowerCase()} located {selectedDoctor.distance} from your location. Visit their office or contact them for more information about their practice and services related to {analysisType.toLowerCase()}.
                        </p>
                      </div>
                      
                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        <Button 
                          className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
                          onClick={() => handleBookAppointment(selectedDoctor)}
                        >
                          Get Directions
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-1"
                          onClick={() => {
                            if (selectedDoctor.placeId) {
                              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDoctor.name)}&query_place_id=${selectedDoctor.placeId}`;
                              window.open(mapsUrl, '_blank');
                            }
                          }}
                        >
                          <ExternalLink size={16} />
                          View on Google Maps
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
                          <div className="sm:w-1/4 aspect-video sm:aspect-square bg-muted flex items-center justify-center">
                            <MapPin size={36} className="text-muted-foreground/50" />
                          </div>
                          <div className="p-4 flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <h3 className="font-medium">{doctor.name}</h3>
                                <p className="text-sm text-indigo-600">{doctor.specialty}</p>
                              </div>
                              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full dark:bg-indigo-950/30">{doctor.distance}</span>
                            </div>
                            
                            {doctor.rating > 0 && (
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
                                <span className="text-xs font-medium ml-1">{doctor.rating.toFixed(1)}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <MapPin size={14} className="mr-1" />
                              {doctor.vicinity}
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
