import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CheckSquare, 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Edit, 
  Save, 
  Trash, 
  X
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  deadline?: string;
  user_id: string;
  created_at?: string;
}

const TaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setTask(data);
          setEditedTask(data);
        } else {
          toast.error('Task not found');
          navigate('/tasks');
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
        toast.error('Failed to load task details');
        navigate('/tasks');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskDetails();
  }, [id, user, navigate]);

  const handleToggleComplete = async () => {
    if (!task) return;
    
    try {
      const updatedTask = { ...task, completed: !task.completed };
      
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);
      
      if (error) {
        throw error;
      }
      
      setTask(updatedTask);
      toast.success(`Task ${updatedTask.completed ? 'completed' : 'marked as incomplete'}`);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Task deleted successfully');
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleSaveChanges = async () => {
    if (!task || !editedTask) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update(editedTask)
        .eq('id', task.id);
      
      if (error) {
        throw error;
      }
      
      setTask({ ...task, ...editedTask });
      setEditing(false);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleCancelEdit = () => {
    setEditedTask(task || {});
    setEditing(false);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        Loading task details...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        Task not found.
        <Button variant="link" onClick={() => navigate('/tasks')}>
          Return to tasks
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="outline" 
        className="mb-6" 
        onClick={() => navigate('/tasks')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
      </Button>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                {editing ? (
                  <Input 
                    value={editedTask.title || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                    className="text-2xl font-bold h-auto py-1"
                  />
                ) : (
                  <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                    {task.title}
                  </span>
                )}
              </CardTitle>
              {task.created_at && (
                <CardDescription>
                  Created on {format(new Date(task.created_at), 'MMM d, yyyy')}
                </CardDescription>
              )}
            </div>
            {!editing ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEditing(true)}
              >
                <Edit className="mr-1 h-4 w-4" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelEdit}
                >
                  <X className="mr-1 h-4 w-4" /> Cancel
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSaveChanges}
                >
                  <Save className="mr-1 h-4 w-4" /> Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center">
            <Button 
              variant={task.completed ? "default" : "outline"} 
              className={task.completed ? "bg-green-500 hover:bg-green-600" : ""}
              onClick={handleToggleComplete}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              {task.completed ? 'Completed' : 'Mark as Complete'}
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1 block">Description</Label>
              {editing ? (
                <Textarea 
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  placeholder="Add a description"
                  className="min-h-[100px]"
                />
              ) : (
                <div className="p-3 border rounded-md bg-muted/30 min-h-[100px]">
                  {task.description || 'No description provided.'}
                </div>
              )}
            </div>

            {editing ? (
              <div>
                <Label className="text-sm font-medium mb-1 block">Deadline (optional)</Label>
                <Input 
                  type="date" 
                  value={editedTask.deadline ? new Date(editedTask.deadline).toISOString().slice(0, 10) : ''}
                  onChange={(e) => setEditedTask({ 
                    ...editedTask, 
                    deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                  })}
                />
              </div>
            ) : task.deadline && (
              <div className="flex items-center">
                <Clock className="text-muted-foreground mr-2 h-4 w-4" />
                <span>Due: {format(new Date(task.deadline), 'MMMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-between border-t pt-6">
          <Button 
            variant="destructive" 
            onClick={handleDeleteTask}
          >
            <Trash className="mr-2 h-4 w-4" /> Delete Task
          </Button>
          
          {task.completed && (
            <div className="flex items-center text-green-500">
              <CheckSquare className="mr-2 h-5 w-5" />
              <span className="font-medium">Task Completed</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default TaskDetails;
