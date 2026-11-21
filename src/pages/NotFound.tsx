import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SECTIONS } from '@/components/layout/sections';

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="container py-16 md:py-24">
      <p className="eyebrow">
        <span className="text-ink">404</span>
        <span className="mx-2" aria-hidden>
          ·
        </span>
        Not found
      </p>
      <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Nothing recorded at this address.</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        <code className="font-mono text-sm text-foreground">{pathname}</code> is not a page here. Try one of these:
      </p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {SECTIONS.map(s => (
          <li key={s.href}>
            <Button asChild variant="outline">
              <Link to={s.href}>
                <span className="font-mono text-xs text-ink">{s.index}</span> {s.short}
              </Link>
            </Button>
          </li>
        ))}
        <li>
          <Button asChild variant="ghost">
            <Link to="/">Home</Link>
          </Button>
        </li>
      </ul>
    </div>
  );
}
