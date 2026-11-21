import type { ReactNode } from 'react';

export function StatGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border">{children}</dl>;
}

export function Stat({ label, value, total, hint }: { label: string; value: number | string; total?: number | string; hint?: string }) {
  return (
    <div className="bg-card px-3 py-2.5" title={hint}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-lg tabular leading-tight">
        {value}
        {total !== undefined && <span className="text-xs text-muted-foreground"> / {total}</span>}
      </dd>
    </div>
  );
}

export function ComplexityTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-b last:border-0">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal text-muted-foreground">
              {k}
            </th>
            <td className="py-1.5 text-right font-mono">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
