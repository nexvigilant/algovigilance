'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { DungeonGrid, type Tile } from './dungeon-grid';
import { GameHud, type GameStats } from './game-hud';
import { CodeOutput } from './code-output';
import { PayoffMatrix, type PayoffEntry } from './payoff-matrix';

// ── Constants ──────────────────────────────

const MAP_W = 40;
const MAP_H = 20;
const MAX_FLOORS = 5;
const PRIMS_PER_FLOOR = 3;

const PRIMITIVES = [
  { sym: 'σ', name: 'Sequence', color: '#00ccff', atkBonus: 2, defBonus: 0, hpBonus: 0 },
  { sym: 'μ', name: 'Mapping', color: '#4488ff', atkBonus: 0, defBonus: 2, hpBonus: 0 },
  { sym: 'ς', name: 'State', color: '#00cc66', atkBonus: 0, defBonus: 0, hpBonus: 8 },
  { sym: 'ρ', name: 'Recursion', color: '#cc66ff', atkBonus: 0, defBonus: 0, hpBonus: 0 },
  { sym: '∅', name: 'Void', color: '#666666', atkBonus: 0, defBonus: 1, hpBonus: 0 },
  { sym: '∂', name: 'Boundary', color: '#ffcc00', atkBonus: 0, defBonus: 3, hpBonus: 0 },
  { sym: 'ν', name: 'Frequency', color: '#008888', atkBonus: 1, defBonus: 1, hpBonus: 0 },
  { sym: '∃', name: 'Existence', color: '#ffffff', atkBonus: 1, defBonus: 0, hpBonus: 0 },
  { sym: 'π', name: 'Persistence', color: '#006633', atkBonus: 0, defBonus: 0, hpBonus: 12 },
  { sym: '→', name: 'Causality', color: '#ff4444', atkBonus: 4, defBonus: 0, hpBonus: 0 },
  { sym: 'κ', name: 'Comparison', color: '#cc8800', atkBonus: 2, defBonus: 1, hpBonus: 0 },
  { sym: 'N', name: 'Quantity', color: '#00ccff', atkBonus: 0, defBonus: 0, hpBonus: 5 },
  { sym: 'λ', name: 'Location', color: '#8800cc', atkBonus: 1, defBonus: 1, hpBonus: 0 },
  { sym: '∝', name: 'Irreversibility', color: '#880000', atkBonus: 3, defBonus: 0, hpBonus: 0 },
  { sym: 'Σ', name: 'Sum', color: '#00cc66', atkBonus: 2, defBonus: 0, hpBonus: 5 },
  { sym: '×', name: 'Product', color: '#ffcc00', atkBonus: 2, defBonus: 2, hpBonus: 0 },
];

interface Enemy {
  x: number;
  y: number;
  glyph: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  color: string;
}

interface PrimItem {
  x: number;
  y: number;
  primIdx: number;
}

interface GameState {
  map: number[][]; // 0=wall, 1=floor, 2=stairs
  playerX: number;
  playerY: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  floor: number;
  turn: number;
  collected: string[];
  enemies: Enemy[];
  prims: PrimItem[];
  log: string[];
  gameOver: boolean;
  won: boolean;
  payoffEntries: PayoffEntry[];
  nashEq: string;
  generatedCode: string;
}

type Action =
  | { type: 'MOVE'; dx: number; dy: number }
  | { type: 'RESET' };

// ── Map Generation ──────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFloor(floor: number): Pick<GameState, 'map' | 'playerX' | 'playerY' | 'enemies' | 'prims'> {
  const map: number[][] = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(0));

  // Carve rooms
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const w = rand(4, 8);
    const h = rand(3, 5);
    const x = rand(1, MAP_W - w - 1);
    const y = rand(1, MAP_H - h - 1);
    const overlap = rooms.some(
      (r) => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y
    );
    if (!overlap) {
      rooms.push({ x, y, w, h });
      for (let ry = y; ry < y + h; ry++)
        for (let rx = x; rx < x + w; rx++) map[ry][rx] = 1;
    }
  }

  // Connect rooms with corridors
  for (let i = 1; i < rooms.length; i++) {
    const cx1 = Math.floor(rooms[i - 1].x + rooms[i - 1].w / 2);
    const cy1 = Math.floor(rooms[i - 1].y + rooms[i - 1].h / 2);
    const cx2 = Math.floor(rooms[i].x + rooms[i].w / 2);
    const cy2 = Math.floor(rooms[i].y + rooms[i].h / 2);

    let x = cx1;
    while (x !== cx2) { map[cy1][x] = 1; x += x < cx2 ? 1 : -1; }
    let y = cy1;
    while (y !== cy2) { map[y][cx2] = 1; y += y < cy2 ? 1 : -1; }
  }

  // Place stairs in last room (unless final floor)
  if (floor < MAX_FLOORS && rooms.length > 1) {
    const lastRoom = rooms[rooms.length - 1];
    const sx = Math.floor(lastRoom.x + lastRoom.w / 2);
    const sy = Math.floor(lastRoom.y + lastRoom.h / 2);
    map[sy][sx] = 2;
  }

  // Player starts in first room
  const startRoom = rooms[0];
  const playerX = Math.floor(startRoom.x + startRoom.w / 2);
  const playerY = Math.floor(startRoom.y + startRoom.h / 2);

  // Place enemies
  const enemyNames = [
    { glyph: 'g', name: 'Unwrap Goblin', color: '#00cc66' },
    { glyph: 'o', name: 'Clone Orc', color: '#ff4444' },
    { glyph: 's', name: 'Leak Spider', color: '#cc66ff' },
    { glyph: 'D', name: 'Deadlock Drake', color: '#ffcc00' },
  ];
  const enemies: Enemy[] = [];
  for (let i = 0; i < 3 + floor; i++) {
    const room = rooms[rand(1, rooms.length - 1)] || rooms[0];
    const ex = rand(room.x, room.x + room.w - 1);
    const ey = rand(room.y, room.y + room.h - 1);
    if (ex === playerX && ey === playerY) continue;
    const tmpl = enemyNames[rand(0, enemyNames.length - 1)];
    const baseHp = 6 + floor * 3;
    enemies.push({
      x: ex, y: ey, glyph: tmpl.glyph, name: tmpl.name,
      hp: baseHp, maxHp: baseHp, atk: 2 + floor, def: floor, color: tmpl.color,
    });
  }

  // Place primitives
  const prims: PrimItem[] = [];
  const available = [...Array(PRIMITIVES.length).keys()];
  for (let i = 0; i < PRIMS_PER_FLOOR && available.length > 0; i++) {
    const room = rooms[rand(0, rooms.length - 1)];
    const px = rand(room.x, room.x + room.w - 1);
    const py = rand(room.y, room.y + room.h - 1);
    const idx = available.splice(rand(0, available.length - 1), 1)[0];
    prims.push({ x: px, y: py, primIdx: idx });
  }

  return { map, playerX, playerY, enemies, prims };
}

function generateCode(collected: string[]): string {
  if (collected.length === 0) return '';
  const lines = ['// Forged from collected primitives', ''];

  if (collected.includes('σ')) lines.push('/// Pipeline: σ Sequence');
  if (collected.includes('ς')) lines.push('/// State machine: ς State');
  if (collected.includes('∂')) lines.push('/// Boundary protection: ∂ Boundary');

  lines.push(`pub struct ForgedType {`);
  if (collected.includes('ς')) lines.push('    state: ForgeState,');
  if (collected.includes('N')) lines.push('    count: u64,');
  if (collected.includes('π')) lines.push('    persisted: bool,');
  if (collected.includes('λ')) lines.push('    location: (f64, f64),');
  lines.push('}');
  lines.push('');

  if (collected.includes('ς')) {
    lines.push('pub enum ForgeState {');
    lines.push('    Active,');
    lines.push('    Processing,');
    lines.push('    Complete,');
    lines.push('}');
    lines.push('');
  }

  lines.push('impl ForgedType {');
  if (collected.includes('σ')) {
    lines.push('    pub fn process(&mut self) -> Result<(), ForgeError> {');
    lines.push('        // σ Sequence: ordered pipeline');
    lines.push('        self.validate()?;');
    lines.push('        self.transform()?;');
    lines.push('        self.finalize()');
    lines.push('    }');
  }
  if (collected.includes('κ')) {
    lines.push('    pub fn compare(&self, other: &Self) -> std::cmp::Ordering {');
    lines.push('        // κ Comparison');
    lines.push('        self.count.cmp(&other.count)');
    lines.push('    }');
  }
  if (collected.includes('∂')) {
    lines.push('    pub fn validate(&self) -> Result<(), ForgeError> {');
    lines.push('        // ∂ Boundary: input validation');
    lines.push('        if self.count == 0 { return Err(ForgeError::Empty); }');
    lines.push('        Ok(())');
    lines.push('    }');
  }
  lines.push('}');

  lines.push('');
  lines.push(`// Primitives collected: ${collected.join(' ')}`);
  lines.push(`// Total: ${collected.length}/${PRIMITIVES.length}`);

  return lines.join('\n');
}

// ── Reducer ──────────────────────────────

function initState(): GameState {
  const { map, playerX, playerY, enemies, prims } = generateFloor(1);
  return {
    map, playerX, playerY,
    hp: 30, maxHp: 30, atk: 5, def: 2,
    floor: 1, turn: 0,
    collected: [], enemies, prims,
    log: ['Entering the Primitive Depths...'],
    gameOver: false, won: false,
    payoffEntries: [], nashEq: '',
    generatedCode: '',
  };
}

function gameReducer(state: GameState, action: Action): GameState {
  if (action.type === 'RESET') return initState();
  if (state.gameOver) return state;

  const { dx, dy } = action;
  const nx = state.playerX + dx;
  const ny = state.playerY + dy;

  if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) return state;
  if (state.map[ny][nx] === 0) return state;

  const newState = { ...state, turn: state.turn + 1, log: [...state.log] };

  // Check enemy collision
  const enemyIdx = newState.enemies.findIndex(e => e.x === nx && e.y === ny);
  if (enemyIdx >= 0) {
    const enemy = { ...newState.enemies[enemyIdx] };
    const playerDmg = Math.max(1, newState.atk - enemy.def);
    const enemyDmg = Math.max(1, enemy.atk - newState.def);

    enemy.hp -= playerDmg;
    newState.hp -= enemyDmg;

    // Generate payoff matrix for this combat
    newState.payoffEntries = [
      { playerAction: 'Attack', enemyAction: 'Attack', playerPayoff: -enemyDmg, enemyPayoff: -playerDmg },
      { playerAction: 'Attack', enemyAction: 'Defend', playerPayoff: -Math.floor(playerDmg / 2), enemyPayoff: -Math.floor(playerDmg / 2) },
      { playerAction: 'Defend', enemyAction: 'Attack', playerPayoff: -Math.floor(enemyDmg / 2), enemyPayoff: -Math.floor(enemyDmg / 2) },
      { playerAction: 'Defend', enemyAction: 'Defend', playerPayoff: 0, enemyPayoff: 0 },
    ];
    newState.nashEq = `(Attack, Attack) → ${-enemyDmg}/${-playerDmg}`;

    if (enemy.hp <= 0) {
      newState.enemies = newState.enemies.filter((_, i) => i !== enemyIdx);
      newState.log.push(`Neutralized ${enemy.name} [DMG ${playerDmg} / RCV ${enemyDmg}]`);
    } else {
      const updatedEnemies = [...newState.enemies];
      updatedEnemies[enemyIdx] = enemy;
      newState.enemies = updatedEnemies;
      newState.log.push(`Engaged ${enemy.name} [DMG ${playerDmg} / RCV ${enemyDmg} / TGT HP: ${enemy.hp}]`);
    }

    if (newState.hp <= 0) {
      newState.hp = 0;
      newState.gameOver = true;
      newState.log.push('GAME OVER — better luck next time.');
      return newState;
    }
    return newState;
  }

  // Move player
  newState.playerX = nx;
  newState.playerY = ny;

  // Check primitive pickup
  const primIdx = newState.prims.findIndex(p => p.x === nx && p.y === ny);
  if (primIdx >= 0) {
    const prim = PRIMITIVES[newState.prims[primIdx].primIdx];
    newState.collected = [...newState.collected, prim.sym];
    newState.atk += prim.atkBonus;
    newState.def += prim.defBonus;
    newState.maxHp += prim.hpBonus;
    if (prim.sym === 'ρ') newState.hp = newState.maxHp; // Recursion = full heal
    else newState.hp = Math.min(newState.hp + prim.hpBonus, newState.maxHp);
    newState.prims = newState.prims.filter((_, i) => i !== primIdx);
    newState.log.push(`Extracted ${prim.sym} ${prim.name}`);
    newState.generatedCode = generateCode(newState.collected);
  }

  // Check stairs
  if (state.map[ny][nx] === 2) {
    if (newState.floor >= MAX_FLOORS) {
      newState.won = true;
      newState.gameOver = true;
      newState.log.push('ALL FLOORS CLEARED — Forge synthesis complete.');
    } else {
      newState.floor += 1;
      const next = generateFloor(newState.floor);
      newState.map = next.map;
      newState.playerX = next.playerX;
      newState.playerY = next.playerY;
      newState.enemies = next.enemies;
      newState.prims = next.prims;
      newState.log.push(`Descending to depth ${newState.floor}...`);
    }
  }

  return newState;
}

// ── Component ──────────────────────────────

export function ForgeGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initState);

  const move = useCallback((dx: number, dy: number) => {
    dispatch({ type: 'MOVE', dx, dy });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': move(0, -1); break;
        case 'ArrowDown': case 's': move(0, 1); break;
        case 'ArrowLeft': case 'a': move(-1, 0); break;
        case 'ArrowRight': case 'd': move(1, 0); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [move]);

  // Build visual grid
  const grid: Tile[][] = state.map.map((row, y) =>
    row.map((cell, x): Tile => {
      // Player
      if (x === state.playerX && y === state.playerY) {
        return { char: '@', color: '#00ccff', bg: 'rgba(0,204,255,0.08)' };
      }
      // Enemies
      const enemy = state.enemies.find(e => e.x === x && e.y === y);
      if (enemy) return { char: enemy.glyph, color: enemy.color };
      // Primitives
      const prim = state.prims.find(p => p.x === x && p.y === y);
      if (prim) return { char: PRIMITIVES[prim.primIdx].sym, color: PRIMITIVES[prim.primIdx].color };
      // Terrain
      if (cell === 2) return { char: '>', color: '#ffcc00' }; // stairs
      if (cell === 1) return { char: '·', color: '#1a1a2e' }; // floor
      return { char: ' ', color: '#000' }; // wall
    })
  );

  const stats: GameStats = {
    hp: state.hp, maxHp: state.maxHp,
    atk: state.atk, def: state.def,
    floor: state.floor, maxFloors: MAX_FLOORS,
    turn: state.turn,
    primitivesCollected: state.collected,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      {/* Left: Game Area */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <DungeonGrid grid={grid} width={MAP_W} height={MAP_H} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => move(0, -1)} className="border-nex-light/30 text-slate-dim/60 h-8 w-8 p-0">
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => move(-1, 0)} className="border-nex-light/30 text-slate-dim/60 h-8 w-8 p-0">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => move(0, 1)} className="border-nex-light/30 text-slate-dim/60 h-8 w-8 p-0">
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => move(1, 0)} className="border-nex-light/30 text-slate-dim/60 h-8 w-8 p-0">
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <div className="w-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: 'RESET' })}
            className="border-nex-light/30 text-slate-dim/60 font-mono text-[10px] uppercase tracking-widest h-8 px-3"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" /> Reset
          </Button>
        </div>

        {/* Game Over Banner */}
        {state.gameOver && (
          <div className={`text-center py-4 border ${
            state.won
              ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/5 border-red-500/30 text-red-400'
          }`}>
            <p className="text-sm font-bold font-mono uppercase tracking-wide">
              {state.won ? 'You Win!' : 'Game Over'}
            </p>
            <p className="text-[10px] font-mono text-slate-dim/50 mt-1">
              {state.won
                ? `${state.collected.length} primitives extracted in ${state.turn} turns`
                : `Survived ${state.turn} turns at depth ${state.floor}`}
            </p>
          </div>
        )}

        {/* Log */}
        <div className="border border-nex-light/20 bg-black/30 p-3 max-h-28 overflow-y-auto">
          {state.log.slice(-8).map((msg, i) => (
            <div key={i} className="py-0.5 text-[10px] font-mono text-slate-dim/50">
              <span className="text-cyan/20 mr-2">&gt;</span>{msg}
            </div>
          ))}
        </div>
      </div>

      {/* Right: HUD + Code + Matrix */}
      <div className="space-y-3">
        <GameHud stats={stats} />
        <PayoffMatrix entries={state.payoffEntries} nashEquilibrium={state.nashEq} />
        <CodeOutput code={state.generatedCode} />
      </div>
    </div>
  );
}
