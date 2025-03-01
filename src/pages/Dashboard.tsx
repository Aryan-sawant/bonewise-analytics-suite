
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Clock, CalendarCheck, PlusCircle } from "lucide-react";
import { useAuthContext } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuthContext();
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  
  useEffect(() => {
    // In a real app, this would fetch user's recent analyses from the backend
    // For now, just using empty state
  }, []);
  
  return (
    <div className="container page-transition max-w-6xl py-16 px-4 md:px-6">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome to BoneHealthAI</h1>
            <p className="text-muted-foreground mt-1">
              Your personal bone health analysis dashboard
            </p>
          </div>
          <Link to="/analysis">
            <Button className="gap-2">
              <PlusCircle size={16} />
              New Analysis
            </Button>
          </Link>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total Analyses</CardTitle>
            <CardDescription>Your medical scans analyzed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Last Analysis</CardTitle>
            <CardDescription>Most recent scan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground italic">No analyses yet</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account Status</CardTitle>
            <CardDescription>Current user level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {user?.userType === 'doctor' ? 'Medical Professional' : 'Standard User'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="recent">
        <TabsList className="mb-6">
          <TabsTrigger value="recent">Recent Analyses</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent">
          {recentAnalyses.length === 0 ? (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle>No analyses yet</CardTitle>
                <CardDescription>
                  You haven't performed any bone health analyses yet
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Clock size={32} className="text-muted-foreground" />
                </div>
                <p className="text-center text-muted-foreground max-w-md">
                  Get started by creating your first bone health analysis. Upload
                  a medical image and let our AI analyze it for you.
                </p>
              </CardContent>
              <CardFooter className="justify-center pb-8">
                <Link to="/analysis">
                  <Button className="gap-2">
                    Start Your First Analysis
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Recent analyses would be mapped here */}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="saved">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle>No saved reports</CardTitle>
              <CardDescription>
                You haven't saved any analysis reports yet
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <CalendarCheck size={32} className="text-muted-foreground" />
              </div>
              <p className="text-center text-muted-foreground max-w-md">
                After completing an analysis, you can save the report for future reference.
                Saved reports will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
