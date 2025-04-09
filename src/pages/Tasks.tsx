
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bone, PlusCircle, ArrowRight, Home, User, History, LogOut, FileChart, Search, Calendar, Settings } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuroraBackground } from "@/components/ui/aurora-background";

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean | null;
  deadline: string | null;
  created_at: string | null;
}

interface RecentActivity {
  id: string;
  title: string;
  created_at: string;
}

const Tasks = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [titleFadeIn, setTitleFadeIn] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentActivities = async () => {
      if (!user) return;
      try {
        const { data: analysesData, error: analysesError } = await supabase
          .from('analyses')
          .select('id, task_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!analysesError && analysesData && analysesData.length > 0) {
          const activities: RecentActivity[] = analysesData.map(analysis => ({
            id: analysis.id,
            title: analysis.task_name,
            created_at: analysis.created_at,
          }));

          setRecentActivities(activities);
          return;
        }

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (tasksError) {
          throw tasksError;
        }

        const taskActivities: RecentActivity[] = (tasksData || []).map(task => ({
          id: task.id,
          title: task.title,
          created_at: task.created_at || new Date().toISOString(),
        }));

        setRecentActivities(taskActivities);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      }
    };

    fetchTasks();
    fetchRecentActivities();

    setTimeout(() => {
      setTitleFadeIn(true);
    }, 100);
  }, [user]);

  const handleCreateTask = () => {
    navigate('/tasks');
  };

  const handleViewTask = (taskId: string) => {
    navigate(`/task-details/${taskId}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const filteredTasks = activeTab === 'completed'
    ? tasks.filter(task => task.completed)
    : activeTab === 'pending'
      ? tasks.filter(task => !task.completed)
      : tasks;

  if (!user) {
    return null;
  }

  return (
    <AuroraBackground>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className={`text-3xl font-bold text-primary-foreground ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`} style={{ color: 'black' }}>Dashboard</h1>
            <p className="text-muted-foreground animate-fade-in">Manage your tasks and bone health analyses</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="gradient"
              onClick={() => navigate('/')}
              className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>

            <Button 
              onClick={() => navigate('/bone-analysis')} 
              variant="gradient" 
              className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
            >
              <Bone className="mr-2 h-4 w-4" />
              Bone Analysis
            </Button>

            <Button 
              variant="gradient"
              onClick={handleLogout}  
              className="hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white transition-all duration-300 hover-card hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-xl border-none animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl font-semibold hover-title">Bone Health Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 mb-4 text-base font-bold">
                Access AI-powered bone health analysis tools
              </p>
              <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg mb-3">
                <FileChart className="h-4 w-4 text-white" />
                <span className="text-sm">Create detailed analysis with our AI</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg">
                <Search className="h-4 w-4 text-white" />
                <span className="text-sm">Detect bone conditions accurately</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full hover-scale transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-xl bg-white/20 text-white hover:bg-white/30" onClick={() => navigate('/bone-analysis')}>
                Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white transition-all duration-300 hover-card hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-xl border-none animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl font-semibold hover-title">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 mb-4">
                {recentActivities.length > 0
                  ? `You have ${recentActivities.length} recent activities`
                  : 'View your most recent activities'}
              </p>
              {recentActivities.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="text-sm bg-white/10 p-2 rounded-lg transition-all duration-200 hover:bg-white/20">
                      <p className="font-medium text-white">{activity.title}</p>
                      <p className="text-xs text-white/80">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg">
                    <Calendar className="h-4 w-4 text-white" />
                    <span className="text-sm">Past analyses will appear here</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg">
                    <History className="h-4 w-4 text-white" />
                    <span className="text-sm">Track your health progress</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full hover-scale transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-xl bg-white/20 text-white hover:bg-white/30" onClick={() => navigate('/analysis-history')}>
                <History className="mr-2 h-4 w-4" />
                View History
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white transition-all duration-300 hover-card hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-xl border-none animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl font-semibold hover-title">My Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 mb-4">
                {user.userType === 'doctor' ? 'Doctor Account' : 'User Account'}: {user.email}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg transition-all duration-200 hover:bg-white/20">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Profile: {user.name || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg transition-all duration-200 hover:bg-white/20">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm">Account type: {user.userType}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full hover-scale transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-xl bg-white/20 text-white hover:bg-white/30" onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Account Settings
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover-card transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-xl border border-gray-100 bg-white/90 backdrop-blur-sm animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl font-semibold hover-title">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="gradient" 
                className="w-full py-6 hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl flex flex-col items-center justify-center"
                onClick={() => navigate('/bone-analysis')}
              >
                <Bone className="h-8 w-8 mb-2" />
                <span>Start New Analysis</span>
              </Button>
              
              <Button 
                variant="gradient" 
                className="w-full py-6 hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl flex flex-col items-center justify-center"
                onClick={() => navigate('/analysis-history')}
              >
                <History className="h-8 w-8 mb-2" />
                <span>View Analysis History</span>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover-card transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-xl border border-gray-100 bg-white/90 backdrop-blur-sm animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl font-semibold hover-title">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Consult with specialists or get support with our AI-powered tools
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                  onClick={() => {
                    const mapsUrl = "https://www.google.com/maps/search/orthopedic+doctor+near+me";
                    window.open(mapsUrl, '_blank');
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Consult a Specialist
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full hover-scale transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 gap-2 rounded-xl border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                  onClick={() => navigate('/profile')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuroraBackground>
  );
};

export default Tasks;
