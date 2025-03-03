
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Tasks from "./pages/Tasks";
import TaskDetails from "./pages/TaskDetails";
import TaskSelector from "./pages/TaskSelector";
import AnalysisPage from "./pages/AnalysisPage";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/task-details/:id" element={<TaskDetails />} />
      <Route path="/bone-analysis" element={<TaskSelector />} />
      <Route path="/analysis/:taskId" element={<AnalysisPage />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </TooltipProvider>
);

export default App;
