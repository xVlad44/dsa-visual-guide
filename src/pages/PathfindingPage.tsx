import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';

/** Old route kept so existing links still land somewhere useful. */
export default function PathfindingPage() {
  return (
    <div className="container">
      <PageHeader index="02" eyebrow="Pathfinding" title="Pathfinding lives on the graph page">
        Breadth-first search, depth-first search and Dijkstra’s shortest paths run on any graph you type or draw. A grid view and A* are not
        built yet.
      </PageHeader>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/graph?algo=dijkstra">
            Open Dijkstra on the graph page <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
