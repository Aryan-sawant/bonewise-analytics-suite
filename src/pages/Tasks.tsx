
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, History, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const Tasks = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    async function fetchUserData() {
      setLoading(true);
      
      try {
        // Fetch recent tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (tasksError) throw tasksError;
        setRecentTasks(tasksData || []);
        
        // Fetch recent analyses
        const { data: analysesData, error: analysesError } = await supabase
          .from('analyses')
          .select('id, task_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (analysesError) throw analysesError;
        setRecentAnalyses(analysesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [user, navigate]);
  
  const handleNewAnalysis = () => {
    navigate('/tasks/analyze');
  };
  
  const handleViewHistory = () => {
    navigate('/history');
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        {user.userType === 'doctor' ? 'Manage your analyses and patients' : 'Manage your bone health analyses'}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        <div className="md:col-span-5">
          <Tabs defaultValue="recent">
            <TabsList>
              <TabsTrigger value="recent">Recent Activity</TabsTrigger>
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
            </TabsList>
            <TabsContent value="recent">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Analyses</CardTitle>
                  <CardDescription>View your recently performed bone analyses</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center p-6">
                      <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentAnalyses.length > 0 ? (
                    <div className="space-y-4">
                      {recentAnalyses.map((analysis) => (
                        <div key={analysis.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/50">
                          <div>
                            <h3 className="font-medium">{analysis.task_name}</h3>
                            <p className="text-sm text-muted-foreground">{formatDate(analysis.created_at)}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/result/${analysis.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 border rounded-md border-dashed">
                      <p className="text-muted-foreground mb-4">No recent analyses found</p>
                      <Button onClick={handleNewAnalysis}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Analysis
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" onClick={handleViewHistory}>
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="recommended">
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Analyses</CardTitle>
                  <CardDescription>Analyses recommended based on your profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md border-dashed flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Annual Bone Density Scan</h3>
                        <p className="text-sm text-muted-foreground">Recommended for monitoring bone health over time</p>
                        <Button size="sm" variant="link" className="p-0 h-auto mt-1" onClick={() => navigate('/analysis/osteoporosis')}>
                          Start Analysis
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-md border-dashed flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Joint Health Assessment</h3>
                        <p className="text-sm text-muted-foreground">Evaluate knee joints for early signs of osteoarthritis</p>
                        <Button size="sm" variant="link" className="p-0 h-auto mt-1" onClick={() => navigate('/analysis/osteoarthritis')}>
                          Start Analysis
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full" onClick={handleNewAnalysis}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Analysis
                </Button>
                
                <Button variant="outline" className="w-full" onClick={handleViewHistory}>
                  <History className="mr-2 h-4 w-4" />
                  View History
                </Button>
                
                <Separator />
                
                <div className="text-sm text-center text-muted-foreground">
                  {user.userType === 'doctor' ? 
                    'Access advanced tools for clinical assessment' : 
                    'Track your bone health journey over time'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
