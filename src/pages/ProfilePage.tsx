import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Home, User, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'; // UserRound might be intended here based on usage

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [titleFadeIn, setTitleFadeIn] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (user.name) {
      setName(user.name);
    }

    // Set title fade-in effect
    setTimeout(() => {
      setTitleFadeIn(true);
    }, 100);
  }, [user, navigate]);

  const handleSaveProfile = async () => {
    if (!user || !name.trim()) { // Ensure name is not just whitespace
        toast.error('Name cannot be empty.');
        return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name: name.trim() }) // Trim name before saving
        .eq('id', user.id)
        .select(); // Select to confirm update

      if (error) throw error;

      if (data && data.length > 0) {
        toast.success('Profile updated successfully!');
        // Optionally update context or state instead of reload for smoother UX
        // e.g., updateUserContext({ ...user, name: name.trim() });
         window.location.reload(); // Reload to reflect changes globally (simpler approach)
      } else {
         toast.warn('No changes detected or profile not found.');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/tasks'); // Navigate to dashboard (assuming /tasks is dashboard)
  };

  const handleGoToHome = () => {
    navigate('/'); // Navigate to home page
  };

  const handleConsultSpecialist = () => {
    // Function remains the same...
     if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps/search/orthopedic+doctor+near+me/@${latitude},${longitude},14z`;
        window.open(mapsUrl, '_blank');
      }, () => {
        const mapsUrl = `https://www.google.com/maps/search/orthopedic+doctor+near+me`;
        window.open(mapsUrl, '_blank');
        toast.info("Could not get location. Searching nationwide.");
      });
    } else {
      const mapsUrl = `https://www.google.com/maps/search/orthopedic+doctor+near+me`;
      window.open(mapsUrl, '_blank');
      toast.info("Geolocation not supported. Searching nationwide.");
    }
  };

  if (!user) return null; // Or a loading component

  return (
    <div className="container mx-auto px-4 py-12">
      <style>
        {`
        .hover-scale { transition: transform 0.2s ease-out; }
        .hover-scale:hover { transform: scale(1.05); }
        .hover-card { transition: transform 0.3s ease-out, box-shadow 0.3s ease-out; }
        .hover-card:hover { transform: translateZ(5px) translateY(-3px); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); }
        .hover-title { transition: color 0.2s ease-out, text-decoration 0.2s ease-out; }
        .hover-title:hover { color: var(--primary); text-decoration: underline; text-underline-offset: 3px; }
        .fade-in-title { opacity: 0; transform: translateY(-10px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
        .fade-in-title.visible { opacity: 1; transform: translateY(0); }
        .animate-fade-in { animation: fadeInAnimation 0.5s ease-out forwards; }
        @keyframes fadeInAnimation { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>

      {/* --- Top Navigation Buttons --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <Button
          variant="gradient"
          onClick={handleGoToDashboard}
          className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="gradient"
            onClick={handleGoToHome}
            className="flex-1 sm:flex-none hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          {/* Consult specialist button might be more relevant on analysis pages */}
          {/* <Button
            variant="gradient"
            onClick={handleConsultSpecialist}
            className="flex-1 sm:flex-none hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
          >
            <User className="mr-2 h-4 w-4" />
            Consult a Specialist
          </Button> */}
        </div>
      </div>

      {/* --- MODIFIED TITLE SECTION --- */}
      <div className={`bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl mb-8 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>
        <h1 className="text-3xl font-bold mb-2">
          Account Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account details and preferences
        </p>
      </div>
      {/* --- END OF MODIFIED TITLE SECTION --- */}


      {/* --- Profile Content Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* --- Left Card: Profile Summary --- */}
        <div className="md:col-span-1 animate-fade-in">
           <Card className="border shadow-md sticky top-20 hover-card transition-transform rounded-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-xl"> {/* Added gradient to header */}
               <CardTitle className="flex items-center hover-title text-gray-800 dark:text-white">
                <User className="mr-2 h-5 w-5 text-primary" /> {/* Use primary color */}
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4"> {/* Adjusted padding */}
              <div className="flex flex-col items-center justify-center pt-4"> {/* Removed extra padding */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
                  {name ? name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-medium text-lg truncate max-w-[200px]">{name || 'User'}</h3> {/* Added truncate */}
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">{user.email}</p>
                <div className="mt-2 px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium capitalize">
                   {user.userType || 'User'} Account {/* Made capitalize */}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 px-2"> {/* Added padding */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Email Verified</span>
                  {/* Assuming email is always verified after signup in Supabase Auth */}
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Account Created</span>
                  <span className="text-xs text-muted-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Right Card: Personal Information Form --- */}
        <div className="md:col-span-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
           <Card className="border shadow-md hover-card transition-transform rounded-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-t-xl"> {/* Added gradient to header */}
              <CardTitle className="hover-title text-gray-800 dark:text-white">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6"> {/* Adjusted padding */}
              <div className="space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary" // Use primary color
                  />
                </div>

                {/* Email Input (Disabled) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium">Email</Label>
                  <Input
                    id="email"
                    value={user.email || ''} // Handle potential undefined email
                    disabled
                    className="bg-gray-100 rounded-lg border-gray-300 cursor-not-allowed"
                  />
                </div>

                {/* Account Type (Disabled) */}
                <div className="space-y-2">
                  <Label htmlFor="accountType" className="font-medium">Account Type</Label>
                  <Input
                    id="accountType"
                    value={user.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'User'} // Capitalize
                    disabled
                    className="bg-gray-100 rounded-lg border-gray-300 cursor-not-allowed capitalize"
                  />
                   {/* Informative text removed as it's generally not changeable */}
                   {/* <p className="text-xs text-muted-foreground mt-1"> ... </p> */}
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading || !name.trim() || name.trim() === user.name} // Disable if no changes or empty
                  className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
