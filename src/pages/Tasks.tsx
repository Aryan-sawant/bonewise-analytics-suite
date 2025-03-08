import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bone, PlusCircle, ArrowRight, Home, User, History, LogOut } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground animate-slide-in">Dashboard</h1> {/* Re-added text-primary-foreground */}
          <p className="text-muted-foreground animate-fade-in">Manage your tasks and bone health analyses</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 bg-primary-foreground text-primary rounded-lg"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>

          <Button onClick={() => navigate('/bone-analysis')} variant="outline"  className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 bg-primary-foreground text-primary rounded-lg">
            <Bone className="mr-2 h-4 w-4" />
            Bone Analysis
          </Button>

          <Button variant="outline" onClick={handleLogout}  className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-105 bg-primary-foreground text-primary rounded-lg">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-primary text-primary-foreground transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Bone Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-primary-foreground/90 mb-4 text-base font-bold">
              Access AI-powered bone health analysis tools
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg" onClick={() => navigate('/bone-analysis')}>
              Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-primary text-primary-foreground transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-primary-foreground/90 mb-4">
              {recentActivities.length > 0
                ? `You have ${recentActivities.length} recent activities`
                : 'View your most recent activities'}
            </p>
            {recentActivities.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="text-sm bg-primary-foreground/10 p-2 rounded-lg transition-all duration-200 hover:bg-primary-foreground/20">
                    <p className="font-medium text-primary-foreground">{activity.title}</p>
                    <p className="text-xs text-primary-foreground/80">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg" onClick={() => navigate('/analysis-history')}>
              <History className="mr-2 h-4 w-4" />
              View History
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-primary text-primary-foreground transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103 rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">My Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-primary-foreground/90 mb-4">
              {user.userType === 'doctor' ? 'Doctor Account' : 'User Account'}: {user.email}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-primary-foreground/10 p-2 rounded-lg transition-all duration-200 hover:bg-primary-foreground/20">
                <User className="h-4 w-4" />
                <span className="text-sm">Profile: {user.name || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary-foreground/10 p-2 rounded-lg transition-all duration-200 hover:bg-primary-foreground/20">
                <span className="text-sm">Account type: {user.userType}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105 rounded-lg" onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Account Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Tasks;
