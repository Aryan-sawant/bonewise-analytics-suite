
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import AuroraWrapper from "./components/AuroraWrapper";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Tasks from "./pages/Tasks";
import TaskDetails from "./pages/TaskDetails";
import TaskSelector from "./pages/TaskSelector";
import AnalysisPage from "./pages/AnalysisPage";
import AnalysisHistory from "./pages/AnalysisHistory";
import ProfilePage from "./pages/ProfilePage";
import Result from "./pages/Result";
import NotFound from "./pages/NotFound";
import FindDoctor from "./pages/FindDoctor";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <Routes>
      <Route path="/" element={
        <AuroraWrapper>
          <Index />
        </AuroraWrapper>
      } />
      <Route path="/auth" element={<Auth />} />
      <Route path="/tasks" element={
        <AuroraWrapper>
          <Tasks />
        </AuroraWrapper>
      } />
      <Route path="/task-details/:id" element={
        <AuroraWrapper>
          <TaskDetails />
        </AuroraWrapper>
      } />
      <Route path="/bone-analysis" element={
        <AuroraWrapper>
          <TaskSelector />
        </AuroraWrapper>
      } />
      <Route path="/analysis/:taskId" element={
        <AuroraWrapper>
          <AnalysisPage />
        </AuroraWrapper>
      } />
      <Route path="/analysis-history" element={
        <AuroraWrapper>
          <AnalysisHistory />
        </AuroraWrapper>
      } />
      <Route path="/profile" element={
        <AuroraWrapper>
          <ProfilePage />
        </AuroraWrapper>
      } />
      <Route path="/result" element={
        <AuroraWrapper>
          <Result />
        </AuroraWrapper>
      } />
      <Route path="/find-doctor" element={
        <AuroraWrapper>
          <FindDoctor />
        </AuroraWrapper>
      } />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={
        <AuroraWrapper>
          <NotFound />
        </AuroraWrapper>
      } />
    </Routes>
  </TooltipProvider>
);

export default App;
