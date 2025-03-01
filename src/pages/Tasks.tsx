
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckSquare, Clock, List, PlusSquare, Trash } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  deadline?: string;
}

const Tasks = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Schedule bone density scan', completed: false, deadline: '2023-07-15' },
    { id: '2', title: 'Take calcium supplements', completed: true },
    { id: '3', title: 'Follow up with orthopedic doctor', completed: false, deadline: '2023-07-22' },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) {
      toast.error('Task title cannot be empty');
      return;
    }
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    toast.success('Task added successfully');
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    toast.success('Task deleted successfully');
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
                      onClick={() => toggleTaskCompletion(task.id)}
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
                          <Clock className="w-3 h-3" /> Due: {task.deadline}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteTask(task.id)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tasks;
