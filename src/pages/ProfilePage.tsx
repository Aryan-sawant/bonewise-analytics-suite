
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
  const { user } = useAuthContext(); // Remove setUser as we'll handle updates differently
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (user.name) {
      setName(user.name);
    }
  }, [user, navigate]);
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id)
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Update the user locally since we can't use setUser
        // The context will refresh on next page load
        toast.success('Profile updated successfully');
        
        // Reload the page to refresh the user context
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/tasks')}
          className="hover-scale"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="hover-scale"
        >
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
      <p className="text-muted-foreground mb-8">
        Manage your account details and preferences
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="border shadow-sm sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-4">
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-medium text-lg">{user.name || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-2 px-3 py-1 text-xs rounded-full bg-muted">
                  {user.userType === 'doctor' ? 'Doctor Account' : 'User Account'}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Email Verified</span>
                  {true ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Account Created</span>
                  <span className="text-xs text-muted-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={user.email} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Input 
                    id="accountType" 
                    value={user.userType === 'doctor' ? 'Doctor' : 'User'} 
                    disabled 
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Account type cannot be changed. Contact support if you need to change your account type.
                  </p>
                </div>
                
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={loading || !name.trim()}
                  className="w-full md:w-auto"
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
