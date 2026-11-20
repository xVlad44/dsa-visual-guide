import { ArrowUpRight } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Built by{' '}
          <a href="https://xvlad.dev" className="text-foreground underline-offset-4 hover:text-ink hover:underline">
            Vlad Plastin
          </a>
          . Every frame is replayed from a recorded, tested trace.
        </p>
        <ul className="flex items-center gap-5 font-mono text-xs">
          <li>
            <a href="https://github.com/xVlad44/dsa-visual-guide" className="inline-flex min-h-10 items-center gap-1 hover:text-ink">
              source <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </li>
          <li>
            <a href="https://xvlad.dev" className="inline-flex min-h-10 items-center gap-1 hover:text-ink">
              xvlad.dev <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
