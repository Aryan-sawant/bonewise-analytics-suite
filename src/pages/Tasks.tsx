import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bone, PlusCircle, ArrowRight } from 'lucide-react';
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
const Tasks = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
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
        const {
          data,
          error
        } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', {
          ascending: false
        });
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
    fetchTasks();
  }, [user]);
  const handleCreateTask = () => {
    // For now, just navigate to tasks page
    navigate('/tasks');
  };
  const handleViewTask = (taskId: string) => {
    navigate(`/task-details/${taskId}`);
  };
  const filteredTasks = activeTab === 'completed' ? tasks.filter(task => task.completed) : activeTab === 'pending' ? tasks.filter(task => !task.completed) : tasks;
  if (!user) {
    return null;
  }
  return <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your tasks and bone health analyses</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleCreateTask}>
            <PlusCircle className="mr-2 h-4 w-4" /> 
            New Task
          </Button>
          <Button onClick={() => navigate('/bone-analysis')} variant="outline">
            <Bone className="mr-2 h-4 w-4" />
            Bone Analysis
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
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View your most recent bone health analysis results
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/analysis')}>
              View History
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">My Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {user.userType === 'doctor' ? 'Doctor Account' : 'User Account'}: {user.email}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Account Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-4">Tasks</h2>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {loading ? <div className="text-center py-8">
                <p>Loading tasks...</p>
              </div> : filteredTasks.length === 0 ? <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No tasks found</p>
                <Button variant="outline" className="mt-4" onClick={handleCreateTask}>
                  <PlusCircle className="mr-2 h-4 w-4" /> 
                  Create a task
                </Button>
              </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.map(task => <Card key={task.id} className="transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className={`text-lg ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {task.description && <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>}
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewTask(task.id)}>
                        View
                      </Button>
                    </CardFooter>
                  </Card>)}
              </div>}
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default Tasks;