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
import { Home, User, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

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

    setTimeout(() => {
      setTitleFadeIn(true);
    }, 100);
  }, [user, navigate]);

  // --- Functions (handleSaveProfile, handleGoToDashboard, handleGoToHome, handleConsultSpecialist) remain the same ---
    const handleSaveProfile = async () => {
        if (!user || !name.trim()) {
            toast.error('Name cannot be empty.');
            return;
        }

        setLoading(true);
        try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ name: name.trim() })
            .eq('id', user.id)
            .select();

        if (error) throw error;

        if (data && data.length > 0) {
            toast.success('Profile updated successfully!');
            window.location.reload();
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
        navigate('/tasks');
    };

    const handleGoToHome = () => {
        navigate('/');
    };

    const handleConsultSpecialist = () => {
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
  // --- End of Functions ---

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <style>
        {`
        .hover-scale { transition: transform 0.2s ease-out; }
        .hover-scale:hover { transform: scale(1.05); }
        .hover-card { transition: transform 0.3s ease-out, box-shadow 0.3s ease-out; }
        .hover-card:hover { transform: translateZ(5px) translateY(-3px); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); }
        .hover-title { transition: color 0.2s ease-out, text-decoration 0.2s ease-out; }
        /* Removed hover-title styles as it conflicts with white header text */
        /* .hover-title:hover { color: var(--primary); text-decoration: underline; text-underline-offset: 3px; } */
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
            className="flex-1 sm:flex-none hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl" // This is the target style
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>
      </div>

      {/* --- Page Title Block --- */}
      <div className={`bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl mb-8 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>
        <h1 className="text-3xl font-bold mb-2">
          Account Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account details and preferences
        </p>
      </div>

      {/* --- Profile Content Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* --- Left Card: Profile Summary --- */}
        <div className="md:col-span-1 animate-fade-in">
           <Card className="border shadow-md sticky top-20 hover-card transition-transform rounded-xl bg-white/90 backdrop-blur-sm overflow-hidden"> {/* Added overflow-hidden */}
            {/* Apply gradient style here */}
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground rounded-t-xl"> {/* <<<< MODIFIED STYLE */}
               <CardTitle className="flex items-center text-primary-foreground"> {/* Ensured text color */}
                <User className="mr-2 h-5 w-5" /> {/* Removed explicit color */}
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center pt-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
                  {name ? name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-medium text-lg truncate max-w-[200px]">{name || 'User'}</h3>
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">{user.email}</p>
                <div className="mt-2 px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium capitalize">
                   {user.userType || 'User'} Account
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 px-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Email Verified</span>
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
           <Card className="border shadow-md hover-card transition-transform rounded-xl bg-white/90 backdrop-blur-sm overflow-hidden"> {/* Added overflow-hidden */}
            {/* Apply gradient style here */}
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-primary-foreground rounded-t-xl"> {/* <<<< MODIFIED STYLE */}
              <CardTitle className="text-primary-foreground">Personal Information</CardTitle> {/* Ensured text color */}
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium">Email</Label>
                  <Input
                    id="email"
                    value={user.email || ''}
                    disabled
                    className="bg-gray-100 rounded-lg border-gray-300 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType" className="font-medium">Account Type</Label>
                  <Input
                    id="accountType"
                    value={user.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'User'}
                    disabled
                    className="bg-gray-100 rounded-lg border-gray-300 cursor-not-allowed capitalize"
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading || !name.trim() || name.trim() === user.name}
                  className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed" // Keep save button gradient
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
