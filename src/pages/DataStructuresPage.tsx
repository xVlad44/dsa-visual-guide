import { Construction, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function DataStructuresPage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <Card className="max-w-2xl mx-auto p-12 bg-gradient-card shadow-medium">
        <div className="bg-gradient-primary rounded-lg p-4 w-16 h-16 mx-auto mb-6">
          <Construction className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Data Structures</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Interactive data structure visualizations are in development! Soon you'll be able to explore 
          Trees, Graphs, Stacks, Queues, and more with dynamic visual operations.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="gradient" asChild>
            <Link to="/sorting">
              Try Bubble Sort
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              Back to Home
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}