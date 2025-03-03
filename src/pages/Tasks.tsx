
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckSquare, Clock, List, PlusSquare, Trash, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  deadline?: string;
  user_id: string;
}

const Tasks = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
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
    
    fetchTasks();
  }, [user]);

  const handleAddTask = async () => {
    if (!user) return;
    if (!newTaskTitle.trim()) {
      toast.error('Task title cannot be empty');
      return;
    }
    
    try {
      const newTask = {
        user_id: user.id,
        title: newTaskTitle,
        completed: false,
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setTasks([data, ...tasks]);
        setNewTaskTitle('');
        toast.success('Task added successfully');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const updatedTask = { ...task, completed: !task.completed };
      
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);
      
      if (error) {
        throw error;
      }
      
      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
      toast.success(`Task ${updatedTask.completed ? 'completed' : 'marked as incomplete'}`);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setTasks(tasks.filter(task => task.id !== id));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const viewTaskDetails = (taskId: string) => {
    navigate(`/task-details/${taskId}`);
  };

  if (!user) {
    return null; // Don't render anything if not logged in
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Bone Health Tasks</h1>
        <p className="text-muted-foreground">
          Track and manage your bone health activities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusSquare className="text-primary" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title</Label>
                <Input 
                  id="task-title" 
                  placeholder="Enter task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddTask}>Add Task</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="text-primary" />
              Task Summary
            </CardTitle>
            <CardDescription>
              You have {tasks.filter(t => !t.completed).length} incomplete tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="text-green-500" />
                  <span>Completed Tasks</span>
                </div>
                <span className="font-medium">{tasks.filter(t => t.completed).length}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="text-orange-500" />
                  <span>Pending Tasks</span>
                </div>
                <span className="font-medium">{tasks.filter(t => !t.completed).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="text-primary" />
            Your Tasks
          </CardTitle>
          <CardDescription>
            Manage your bone health activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">
              Loading tasks...
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No tasks yet. Add your first task above.
                </div>
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-4 border rounded-md bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => toggleTaskCompletion(task)}
                        className={task.completed ? "text-green-500" : "text-muted-foreground"}
                      >
                        <CheckSquare />
                      </Button>
                      <div>
                        <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.deadline && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Due: {new Date(task.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewTaskDetails(task.id)}
                        className="text-primary mr-1"
                      >
                        View <ArrowRight className="ml-1 w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteTask(task.id)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <Trash />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Tasks;
