import { Link } from 'react-router-dom';
import { ArrowRight, Code, BarChart3, GitBranch, Grid3x3, PlayCircle, Clock, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const features = [
  {
    icon: BarChart3,
    title: 'Sorting Algorithms',
    description: 'Visualize Bubble, Merge, Quick, and other sorting algorithms with step-by-step animations.',
    href: '/sorting',
    color: 'text-blue-500'
  },
  {
    icon: GitBranch,
    title: 'Pathfinding',
    description: 'Explore BFS, DFS, A*, and Dijkstra algorithms through interactive grid visualizations.',
    href: '/pathfinding',
    color: 'text-green-500'
  },
  {
    icon: Grid3x3,
    title: 'Data Structures',
    description: 'Learn about Trees, Graphs, Stacks, and Queues with dynamic visual representations.',
    href: '/data-structures',
    color: 'text-purple-500'
  },
  {
    icon: Code,
    title: 'Recursion & Backtracking',
    description: 'Understand recursive algorithms like N-Queens, Sudoku solver, and Tower of Hanoi.',
    href: '/recursion',
    color: 'text-orange-500'
  }
];

const highlights = [
  {
    icon: PlayCircle,
    title: 'Interactive Controls',
    description: 'Play, pause, step through, and control the speed of algorithm execution.'
  },
  {
    icon: Clock,
    title: 'Complexity Analysis',
    description: 'Learn about time and space complexity for each algorithm.'
  },
  {
    icon: Zap,
    title: 'Real-time Visualization',
    description: 'Watch algorithms work in real-time with beautiful animations.'
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="bg-gradient-hero rounded-2xl p-3 w-20 h-20 mx-auto mb-6 shadow-glow">
              <Code className="h-14 w-14 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent animate-fade-in">
              Learn DSA Visually
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
              Master Data Structures and Algorithms through interactive visualizations and step-by-step explanations. 
              Make complex concepts simple and intuitive.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" variant="gradient" asChild>
              <Link to="/sorting">
                Start Learning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/sorting">
                Try Bubble Sort
                <PlayCircle className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Explore Algorithm Categories</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dive deep into different types of algorithms with interactive visualizations designed to enhance your understanding.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="p-6 bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Link to={feature.href} className="block">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg bg-gradient-primary group-hover:shadow-glow transition-all duration-300`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-4 text-primary font-medium group-hover:underline">
                      Learn more →
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Learn Visually?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our interactive approach makes abstract concepts concrete and helps you develop intuitive understanding.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => (
            <Card 
              key={highlight.title}
              className="p-6 text-center bg-gradient-card shadow-soft animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="bg-gradient-accent rounded-lg p-3 w-12 h-12 mx-auto mb-4 shadow-glow">
                <highlight.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{highlight.title}</h3>
              <p className="text-muted-foreground">{highlight.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="p-12 bg-gradient-primary text-white shadow-glow">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 opacity-90">
            Begin your journey with our interactive Bubble Sort visualization.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/sorting">
              Start with Sorting Algorithms
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}