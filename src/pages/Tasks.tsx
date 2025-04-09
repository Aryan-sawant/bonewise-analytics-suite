import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bone, PlusCircle, ArrowRight, Home, User, History, LogOut } from 'lucide-react';
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
        // Keep setLoading true initially if fetching both tasks and activities
        // setLoading(true);
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
        // setLoading(false); // Set loading false after both fetches complete (in fetchRecentActivities)
      }
    };

    const fetchRecentActivities = async () => {
      if (!user) return;
      setLoading(true); // Set loading true here before fetches start
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
            return; // Return early if analyses found
        }

        // Fallback to tasks only if analyses fetch failed or returned empty
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (tasksError) {
           if(analysesError) console.error('Also error fetching tasks:', tasksError);
           else throw tasksError; // Throw only if analysis didn't fail
        }

        const taskActivities: RecentActivity[] = (tasksData || []).map(task => ({
          id: task.id,
          title: task.title,
          created_at: task.created_at || new Date().toISOString(),
        }));
        setRecentActivities(taskActivities);

      } catch (error) {
        console.error('Error fetching recent activities:', error);
      } finally {
          setLoading(false); // Set loading false after all attempts
      }
    };

    fetchTasks(); // Fetch tasks regardless
    fetchRecentActivities(); // Fetch activities and handle loading state

    setTimeout(() => {
      setTitleFadeIn(true);
    }, 100);
  }, [user]);


  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  if (!user) {
    return null;
  }

  return (
      <div className="container mx-auto px-4 py-12">
        <style>
        {`
        .hover-scale {
          transition: transform 0.2s ease-out;
        }

        .hover-scale:hover {
          transform: scale(1.05);
        }

        .hover-card {
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }

        .hover-card:hover {
          transform: translateZ(5px) translateY(-3px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .hover-title {
          transition: color 0.2s ease-out, text-decoration 0.2s ease-out;
        }

        /* Keep hover-title effect subtle if needed, or remove if card hover is enough */
        /* .hover-title:hover {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 3px;
        } */

        .fade-in-title {
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }

        .fade-in-title.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        `}
        </style>

        {/* --- Title Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl flex-grow">
            <h1 className={`text-3xl font-bold mb-2 ${titleFadeIn ? 'fade-in-title visible' : 'fade-in-title'}`}>Dashboard</h1>
            <p className="text-muted-foreground">Manage your tasks and bone health analyses</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
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
        {/* --- END OF Title Section --- */}


        {/* --- Cards Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Bone Health Analysis */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white transition-all duration-300 hover-card hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-xl border-none animate-fade-in flex flex-col"> {/* Added flex flex-col */}
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Bone Health Analysis</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow"> {/* Added flex-grow */}
              <p className="text-white/90 mb-4 text-base font-bold">
                Access AI-powered bone health analysis tools
              </p>
            </CardContent>
            <CardFooter>
              {/* --- MODIFIED BUTTON --- */}
              <Button
                className="w-full hover-scale transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-xl bg-white hover:bg-gray-100 font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-600"
                onClick={() => navigate('/bone-analysis')}
              >
                 {/* Keep icon inside span if needed, or directly in button */}
                Start Analysis <ArrowRight className="ml-2 h-4 w-4 inline" /> {/* Added inline */}
              </Button>
            </CardFooter>
          </Card>

          {/* Card 2: Recent Activities */}
           <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white transition-all duration-300 hover-card hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-xl border-none animate-fade-in flex flex-col"> {/* Added flex flex-col */}
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow"> {/* Added flex-grow */}
              <p className="text-white/90 mb-4">
                {loading ? 'Loading activities...' :
                 recentActivities.length > 0
                  ? `Latest Activities:` // Changed text slightly
                  : 'No recent activities found.'}
              </p>
              {!loading && recentActivities.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="text-sm bg-white/10 p-2 rounded-lg transition-all duration-200 hover:bg-white/20 cursor-pointer" onClick={() => navigate('/analysis-history')}>
                      <p className="font-medium text-white truncate">{activity.title}</p>
                      <p className="text-xs text-white/80">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
               {!loading && recentActivities.length === 0 && ( // Show message when loaded but empty
                   <p className="text-white/70 text-sm">Perform an analysis to see history here.</p>
               )}
            </CardContent>
            <CardFooter>
              {/* --- MODIFIED BUTTON --- */}
              <Button
                className="w-full hover-scale transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-xl bg-white hover:bg-gray-100 font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-600"
                onClick={() => navigate('/analysis-history')}
              >
                <History className="mr-2 h-4 w-4 inline" /> {/* Added inline */}
                View All History
              </Button>
            </CardFooter>
          </Card>

          {/* Card 3: My Account */}
          <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white transition-all duration-300 hover-card hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-xl border-none animate-fade-in flex flex-col"> {/* Added flex flex-col */}
            <CardHeader>
              <CardTitle className="text-xl font-semibold">My Account</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow"> {/* Added flex-grow */}
              <p className="text-white/90 mb-4 truncate">
                 {user.email}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg transition-all duration-200 hover:bg-white/20">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm truncate">Profile: {user.name || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg transition-all duration-200 hover:bg-white/20">
                   <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${user.userType === 'doctor' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>
                    {user.userType}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {/* --- MODIFIED BUTTON --- */}
              <Button
                className="w-full hover-scale transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-xl bg-white hover:bg-gray-100 font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-600"
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-4 w-4 inline" /> {/* Added inline */}
                Account Settings
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
  );
};

export default Tasks;
