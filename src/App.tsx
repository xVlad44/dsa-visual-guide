import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { SiteFooter } from './components/layout/SiteFooter';
import { SiteHeader } from './components/layout/SiteHeader';
import HomePage from './pages/HomePage';

// Each visualiser is its own chunk; the graph page alone pulls in React Flow.
const SortingPage = lazy(() => import('./pages/SortingPage'));
const GraphPage = lazy(() => import('./pages/GraphPage'));
const RecursionPage = lazy(() => import('./pages/RecursionPage'));
const DataStructuresPage = lazy(() => import('./pages/DataStructuresPage'));
const PathfindingPage = lazy(() => import('./pages/PathfindingPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageFallback() {
  return (
    <div className="container py-16" role="status">
      <p className="eyebrow">Loading…</p>
    </div>
  );
}

const App = () => (
  <ThemeProvider>
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main id="main" className="flex-1">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/sorting" element={<SortingPage />} />
              <Route path="/pathfinding" element={<PathfindingPage />} />
              <Route path="/data-structures" element={<DataStructuresPage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/recursion" element={<RecursionPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <SiteFooter />
      </div>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
