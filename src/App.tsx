import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { Navigation } from "./components/Navigation";
import HomePage from "./pages/HomePage";
import SortingPage from "./pages/SortingPage";
import PathfindingPage from "./pages/PathfindingPage";
import DataStructuresPage from "./pages/DataStructuresPage";
import RecursionPage from "./pages/RecursionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navigation />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/sorting" element={<SortingPage />} />
              <Route path="/pathfinding" element={<PathfindingPage />} />
              <Route path="/data-structures" element={<DataStructuresPage />} />
              <Route path="/recursion" element={<RecursionPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
