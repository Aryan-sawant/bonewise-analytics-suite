
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

interface Analysis {
  id: string;
  task_id: string;
  task_name: string;
  created_at: string;
}

const Tasks = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  // Fetch tasks from Supabase
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
    
    // Fetch recent analyses
    const fetchRecentAnalyses = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) {
          throw error;
        }
        setRecentAnalyses(data || []);
      } catch (error) {
        console.error('Error fetching analyses:', error);
      }
    };
    
    fetchTasks();
    fetchRecentAnalyses();
  }, [user]);

  const handleCreateTask = () => {
    navigate('/tasks');
  };
  
  const handleViewTask = (taskId: string) => {
    navigate(`/task-details/${taskId}`);
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
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
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your tasks and bone health analyses</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="hover-scale"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          
          <Button onClick={() => navigate('/bone-analysis')} variant="outline">
            <Bone className="mr-2 h-4 w-4" />
            Bone Analysis
          </Button>
          
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-xl">Bone Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-primary-foreground/90 mb-4 text-base font-bold">
              Access AI-powered bone health analysis tools
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/bone-analysis')}>
              Start Analysis <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-xl">Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-primary-foreground/90 mb-4">
              {recentAnalyses.length > 0 
                ? `You have ${recentAnalyses.length} recent analysis results` 
                : 'View your most recent bone health analysis results'}
            </p>
            {recentAnalyses.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="text-sm bg-primary-foreground/10 p-2 rounded">
                    <p className="font-medium text-primary-foreground">{analysis.task_name}</p>
                    <p className="text-xs text-primary-foreground/80">
                      {new Date(analysis.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/analysis-history')}>
              <History className="mr-2 h-4 w-4" />
              View History
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-xl">My Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-primary-foreground/90 mb-4">
              {user.userType === 'doctor' ? 'Doctor Account' : 'User Account'}: {user.email}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-primary-foreground/10 p-2 rounded">
                <User className="h-4 w-4" />
                <span className="text-sm">Profile: {user.name || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary-foreground/10 p-2 rounded">
                <span className="text-sm">Account type: {user.userType}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/profile')}>
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
