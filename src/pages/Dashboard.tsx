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
    <div className="container page-transition max-w-6xl py-16 px-4 md:px-6 animate-fade-in">
      <header className="mb-12">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground animate-slide-in mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              ✨ Welcome to <span className="text-primary">BoneHealthAI</span> ✨
            </h1>
            <p className="text-muted-foreground mt-1 animate-fade-in">
              Your intelligent bone health analysis dashboard
            </p>
          </div>
          <Link to="/analysis">
            <Button className="gap-2 transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105">
              <PlusCircle size={16} />
              New Analysis
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Total Analyses</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Your medical scans analyzed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-foreground">0</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Last Analysis</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Most recent scan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground italic">No analyses yet</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Account Status</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Current user level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium flex items-center gap-2 text-primary-foreground">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {user?.userType === 'doctor' ? 'Medical Professional' : 'Standard User'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="recent" className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-103">Recent Analyses</TabsTrigger>
          <TabsTrigger value="saved" className="transition-all duration-300 hover:shadow-md active:scale-95 transform hover:translate-z-0 hover:scale-103">Saved Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          {recentAnalyses.length === 0 ? (
            <Card className="bg-muted/30 transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103">
              <CardHeader>
                <CardTitle className="font-semibold">No analyses yet</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  You haven't performed any bone health analyses yet
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4 transition-all duration-300 hover:scale-110">
                  <Clock size={32} className="text-muted-foreground" />
                </div>
                <p className="text-center text-muted-foreground max-w-md">
                  Get started by creating your first bone health analysis. Upload
                  a medical image and let our AI analyze it for you.
                </p>
              </CardContent>
              <CardFooter className="justify-center pb-8">
                <Link to="/analysis">
                  <Button className="gap-2 transition-all duration-300 hover:shadow-lg active:scale-95 transform hover:translate-z-0 hover:scale-105">
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
          <Card className="bg-muted/30 transition-all duration-300 hover:shadow-xl transform hover:translate-z-0 hover:scale-103">
            <CardHeader>
              <CardTitle className="font-semibold">No saved reports</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                You haven't saved any analysis reports yet
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4 transition-all duration-300 hover:scale-110">
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
