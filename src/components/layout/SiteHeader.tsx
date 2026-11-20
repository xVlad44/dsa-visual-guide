import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { SECTIONS } from './sections';

export function SiteHeader() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  // close the mobile menu on navigation and on Escape
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="container flex h-16 items-center gap-6">
        <Link to="/" className="group flex items-baseline gap-2 rounded-sm py-2" aria-label="DSA Visual Guide, home">
          <span className="font-semibold tracking-tight">DSA Visual Guide</span>
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">trace · replay</span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {SECTIONS.map(s => (
              <li key={s.href}>
                <NavLink
                  to={s.href}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex h-10 items-center rounded-md px-3 text-sm transition-colors',
                      isActive ? 'text-ink' : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <span className={cn('border-b py-0.5', isActive ? 'border-ink' : 'border-transparent')}>{s.short}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <a
            href="https://xvlad.dev"
            className="hidden h-10 items-center gap-1 rounded-md px-3 font-mono text-xs text-muted-foreground transition-colors hover:text-ink lg:inline-flex"
          >
            xvlad.dev
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          <button
            ref={menuButton}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t bg-background md:hidden">
          <ul className="container divide-y py-2">
            {SECTIONS.map(s => (
              <li key={s.href}>
                <NavLink
                  to={s.href}
                  className={({ isActive }) =>
                    cn('flex min-h-12 items-center justify-between gap-4 py-3', isActive ? 'text-ink' : 'text-foreground')
                  }
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-ink">{s.index}</span>
                    <span className="font-medium">{s.title}</span>
                  </span>
                  <span className="text-right text-xs text-muted-foreground">{s.blurb}</span>
                </NavLink>
              </li>
            ))}
            <li>
              <a href="https://xvlad.dev" className="flex min-h-12 items-center gap-1 py-3 font-mono text-sm text-muted-foreground">
                xvlad.dev <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
