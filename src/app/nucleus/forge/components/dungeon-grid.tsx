'use client';

import { useMemo } from 'react';

export interface Tile {
  char: string;
  color: string;
  bg?: string;
}

export interface DungeonGridProps {
  grid: Tile[][];
  width: number;
  height: number;
}

const TILE_SIZE = 20;

export function DungeonGrid({ grid, width, height }: DungeonGridProps) {
  const rows = useMemo(() => {
    return grid.map((row, y) => (
      <div key={y} className="flex" style={{ height: TILE_SIZE }}>
        {row.map((tile, x) => (
          <span
            key={`${x}-${y}`}
            className="inline-flex items-center justify-center font-mono text-xs leading-none"
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              color: tile.color,
              backgroundColor: tile.bg || 'transparent',
            }}
          >
            {tile.char}
          </span>
        ))}
      </div>
    ));
  }, [grid]);

  return (
    <div
      className="intel-scanlines bg-black/60 border border-nex-light/30 overflow-hidden relative"
      style={{ width: width * TILE_SIZE, height: height * TILE_SIZE }}
    >
      {rows}
    </div>
  );
}
