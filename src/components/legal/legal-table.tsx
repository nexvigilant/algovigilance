import type { ReactNode } from 'react';

interface LegalTableColumn {
  header: string;
  /** Optional: render cells in this column with monospace font */
  mono?: boolean;
}

interface LegalTableProps {
  columns: LegalTableColumn[];
  rows: (string | ReactNode)[][];
}

/**
 * Reusable table for legal pages.
 * Matches the Tailwind pattern used across the privacy and terms pages:
 * overflow-x-auto wrapper, slate-dim borders, nex-surface header row, cyan header text.
 */
export function LegalTable({ columns, rows }: LegalTableProps) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full text-sm border border-slate-dim">
        <thead>
          <tr className="bg-nex-surface">
            {columns.map((col) => (
              <th
                key={col.header}
                className="px-4 py-2 text-left text-cyan border-b border-slate-dim"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={
                    columns[colIndex]?.mono
                      ? 'px-4 py-2 font-mono text-xs border-b border-slate-dim'
                      : 'px-4 py-2 border-b border-slate-dim'
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
