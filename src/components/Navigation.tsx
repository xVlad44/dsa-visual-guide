import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Code, BarChart3, GitBranch, Grid3x3 } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    name: 'Sorting',
    href: '/sorting',
    icon: BarChart3,
    description: 'Bubble, Merge, Quick Sort'
  },
  {
    name: 'Pathfinding', 
    href: '/pathfinding',
    icon: GitBranch,
    description: 'BFS, DFS, A*, Dijkstra'
  },
  {
    name: 'Data Structures',
    href: '/data-structures', 
    icon: Grid3x3,
    description: 'Trees, Graphs, Lists'
  },
  {
    name: 'Graph Algorithms',
    href: '/graph',
    icon: GitBranch,
    description: 'Interactive Graph Editor'
  },
  {
    name: 'Recursion',
    href: '/recursion',
    icon: Code,
    description: 'Backtracking, N-Queens'
  }
];

export function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-gradient-hero rounded-lg p-2">
              <Code className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Learn DSA Visually
              </h1>
              <p className="text-xs text-muted-foreground">Interactive Algorithms</p>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}
