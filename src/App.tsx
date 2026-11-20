import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ThemeProvider";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SiteFooter } from "./components/layout/SiteFooter";
import HomePage from "./pages/HomePage";
import SortingPage from "./pages/SortingPage";
import PathfindingPage from "./pages/PathfindingPage";
import DataStructuresPage from "./pages/DataStructuresPage";
import GraphPage from "./pages/GraphPage";
import RecursionPage from "./pages/RecursionPage";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <ThemeProvider>
      <Toaster />
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-background">
          <SiteHeader />
          <main id="main" className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/sorting" element={<SortingPage />} />
              <Route path="/pathfinding" element={<PathfindingPage />} />
              <Route path="/data-structures" element={<DataStructuresPage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/recursion" element={<RecursionPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <SiteFooter />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  </TooltipProvider>
);

export default App;
