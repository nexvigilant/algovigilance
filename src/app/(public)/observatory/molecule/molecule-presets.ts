/**
 * Molecule preset data — curated 3D molecular structures for the molecule explorer.
 *
 * Extracted from use-molecule-data.ts to keep the hook under 500 lines.
 */

// ─── Internal Atom / Bond Types ──────────────────────────────────────────────

export interface MoleculeAtomDef {
  id: string
  element: string
  position: [number, number, number]
  charge: number
  hybridization: string
}

export interface MoleculeBondDef {
  source: string
  target: string
  order: 1 | 2 | 3
  rotatable: boolean
}

export interface MoleculePreset {
  name: string
  formula: string
  molecular_weight: number
  atoms: MoleculeAtomDef[]
  bonds: MoleculeBondDef[]
}

// ─── Demo Presets ────────────────────────────────────────────────────────────

export const DEMO_PRESETS: MoleculePreset[] = [
  // ── Aspirin C9H8O4 ─────────────────────────────────────────────────────────
  {
    name: 'aspirin',
    formula: 'C9H8O4',
    molecular_weight: 180.16,
    atoms: [
      { id: 'C1', element: 'C', position: [  0.00,  1.40,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C2', element: 'C', position: [  1.21,  0.70,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C3', element: 'C', position: [  1.21, -0.70,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C4', element: 'C', position: [  0.00, -1.40,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C5', element: 'C', position: [ -1.21, -0.70,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C6', element: 'C', position: [ -1.21,  0.70,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C7', element: 'C', position: [  0.00,  2.85,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'O1', element: 'O', position: [  1.12,  3.45,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'O2', element: 'O', position: [ -1.12,  3.45,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'O3', element: 'O', position: [  2.45,  1.30,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'C8', element: 'C', position: [  3.65,  0.65,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'O4', element: 'O', position: [  4.70,  1.30,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C9', element: 'C', position: [  3.65, -0.80,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'H1', element: 'H', position: [  2.15, -1.20,  0.00], charge:  0, hybridization: 's'   },
      { id: 'H2', element: 'H', position: [  0.00, -2.50,  0.00], charge:  0, hybridization: 's'   },
      { id: 'H3', element: 'H', position: [ -2.15, -1.20,  0.00], charge:  0, hybridization: 's'   },
      { id: 'H4', element: 'H', position: [ -2.15,  1.20,  0.00], charge:  0, hybridization: 's'   },
      { id: 'H5', element: 'H', position: [ -1.92,  3.88,  0.00], charge:  0, hybridization: 's'   },
      { id: 'H6', element: 'H', position: [  3.10, -1.30,  0.85], charge:  0, hybridization: 's'   },
      { id: 'H7', element: 'H', position: [  3.10, -1.30, -0.85], charge:  0, hybridization: 's'   },
      { id: 'H8', element: 'H', position: [  4.70, -1.10,  0.00], charge:  0, hybridization: 's'   },
    ],
    bonds: [
      { source: 'C1', target: 'C2', order: 2, rotatable: false },
      { source: 'C2', target: 'C3', order: 1, rotatable: false },
      { source: 'C3', target: 'C4', order: 2, rotatable: false },
      { source: 'C4', target: 'C5', order: 1, rotatable: false },
      { source: 'C5', target: 'C6', order: 2, rotatable: false },
      { source: 'C6', target: 'C1', order: 1, rotatable: false },
      { source: 'C1', target: 'C7', order: 1, rotatable: true  },
      { source: 'C7', target: 'O1', order: 2, rotatable: false },
      { source: 'C7', target: 'O2', order: 1, rotatable: false },
      { source: 'C2', target: 'O3', order: 1, rotatable: true  },
      { source: 'O3', target: 'C8', order: 1, rotatable: true  },
      { source: 'C8', target: 'O4', order: 2, rotatable: false },
      { source: 'C8', target: 'C9', order: 1, rotatable: true  },
      { source: 'C3', target: 'H1', order: 1, rotatable: false },
      { source: 'C4', target: 'H2', order: 1, rotatable: false },
      { source: 'C5', target: 'H3', order: 1, rotatable: false },
      { source: 'C6', target: 'H4', order: 1, rotatable: false },
      { source: 'O2', target: 'H5', order: 1, rotatable: false },
      { source: 'C9', target: 'H6', order: 1, rotatable: false },
      { source: 'C9', target: 'H7', order: 1, rotatable: false },
      { source: 'C9', target: 'H8', order: 1, rotatable: false },
    ],
  },

  // ── Caffeine C8H10N4O2 ────────────────────────────────────────────────────
  {
    name: 'caffeine',
    formula: 'C8H10N4O2',
    molecular_weight: 194.19,
    atoms: [
      { id: 'N1', element: 'N', position: [  0.00,  1.38,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C2', element: 'C', position: [  1.20,  0.69,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'N3', element: 'N', position: [  1.20, -0.69,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C4', element: 'C', position: [  0.00, -1.38,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C5', element: 'C', position: [ -1.20, -0.69,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C6', element: 'C', position: [ -1.20,  0.69,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'N7', element: 'N', position: [ -2.40, -1.38,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C8', element: 'C', position: [ -2.40, -2.76,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'O1', element: 'O', position: [  2.40,  1.38,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'O2', element: 'O', position: [  2.40, -1.38,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C1m', element: 'C', position: [  0.00,  2.76,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'C3m', element: 'C', position: [  0.00, -2.76,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'C7m', element: 'C', position: [ -3.60, -0.69,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'H8',  element: 'H', position: [ -3.30, -3.30,  0.00], charge:  0, hybridization: 's'   },
      { id: 'H1a', element: 'H', position: [  0.52,  3.20,  0.85], charge:  0, hybridization: 's'   },
      { id: 'H1b', element: 'H', position: [  0.52,  3.20, -0.85], charge:  0, hybridization: 's'   },
      { id: 'H1c', element: 'H', position: [ -1.04,  3.20,  0.00], charge:  0, hybridization: 's'   },
      { id: 'H3a', element: 'H', position: [  0.52, -3.20,  0.85], charge:  0, hybridization: 's'   },
      { id: 'H3b', element: 'H', position: [  0.52, -3.20, -0.85], charge:  0, hybridization: 's'   },
      { id: 'H3c', element: 'H', position: [ -1.04, -3.20,  0.00], charge:  0, hybridization: 's'   },
    ],
    bonds: [
      { source: 'N1', target: 'C2',  order: 1, rotatable: false },
      { source: 'C2', target: 'N3',  order: 1, rotatable: false },
      { source: 'N3', target: 'C4',  order: 1, rotatable: false },
      { source: 'C4', target: 'C5',  order: 2, rotatable: false },
      { source: 'C5', target: 'C6',  order: 1, rotatable: false },
      { source: 'C6', target: 'N1',  order: 2, rotatable: false },
      { source: 'C5', target: 'N7',  order: 1, rotatable: false },
      { source: 'N7', target: 'C8',  order: 2, rotatable: false },
      { source: 'C8', target: 'C4',  order: 1, rotatable: false },
      { source: 'C2', target: 'O1',  order: 2, rotatable: false },
      { source: 'C6', target: 'O2',  order: 2, rotatable: false },
      { source: 'N1', target: 'C1m', order: 1, rotatable: true  },
      { source: 'N3', target: 'C3m', order: 1, rotatable: true  },
      { source: 'N7', target: 'C7m', order: 1, rotatable: true  },
      { source: 'C8', target: 'H8',  order: 1, rotatable: false },
      { source: 'C1m', target: 'H1a', order: 1, rotatable: false },
      { source: 'C1m', target: 'H1b', order: 1, rotatable: false },
      { source: 'C1m', target: 'H1c', order: 1, rotatable: false },
      { source: 'C3m', target: 'H3a', order: 1, rotatable: false },
      { source: 'C3m', target: 'H3b', order: 1, rotatable: false },
      { source: 'C3m', target: 'H3c', order: 1, rotatable: false },
    ],
  },

  // ── Ibuprofen C13H18O2 ────────────────────────────────────────────────────
  {
    name: 'ibuprofen',
    formula: 'C13H18O2',
    molecular_weight: 206.28,
    atoms: [
      { id: 'C1', element: 'C', position: [  0.00,  1.40,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C2', element: 'C', position: [  1.21,  0.70,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C3', element: 'C', position: [  1.21, -0.70,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C4', element: 'C', position: [  0.00, -1.40,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C5', element: 'C', position: [ -1.21, -0.70,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C6', element: 'C', position: [ -1.21,  0.70,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'C7', element: 'C', position: [  0.00, -2.86,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'C8', element: 'C', position: [  0.00, -4.30,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'O1', element: 'O', position: [  1.12, -4.90,  0.00], charge:  0, hybridization: 'sp2' },
      { id: 'O2', element: 'O', position: [ -1.12, -4.90,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'C9',  element: 'C', position: [  0.00,  2.86,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'C10', element: 'C', position: [  0.00,  4.30,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'C11', element: 'C', position: [  1.25,  4.90,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'C12', element: 'C', position: [ -1.25,  4.90,  0.00], charge:  0, hybridization: 'sp3' },
      { id: 'C13', element: 'C', position: [  1.30, -2.86,  0.60], charge:  0, hybridization: 'sp3' },
      { id: 'H2', element: 'H', position: [  2.15,  1.20,  0.00], charge:  0, hybridization: 's'   },
      { id: 'H3', element: 'H', position: [  2.15, -1.20,  0.00], charge:  0, hybridization: 's'   },
      { id: 'H5', element: 'H', position: [ -2.15, -1.20,  0.00], charge:  0, hybridization: 's'   },
      { id: 'H6', element: 'H', position: [ -2.15,  1.20,  0.00], charge:  0, hybridization: 's'   },
    ],
    bonds: [
      { source: 'C1', target: 'C2',  order: 2, rotatable: false },
      { source: 'C2', target: 'C3',  order: 1, rotatable: false },
      { source: 'C3', target: 'C4',  order: 2, rotatable: false },
      { source: 'C4', target: 'C5',  order: 1, rotatable: false },
      { source: 'C5', target: 'C6',  order: 2, rotatable: false },
      { source: 'C6', target: 'C1',  order: 1, rotatable: false },
      { source: 'C4', target: 'C7',  order: 1, rotatable: true  },
      { source: 'C7', target: 'C8',  order: 1, rotatable: true  },
      { source: 'C8', target: 'O1',  order: 2, rotatable: false },
      { source: 'C8', target: 'O2',  order: 1, rotatable: false },
      { source: 'C7', target: 'C13', order: 1, rotatable: true  },
      { source: 'C1', target: 'C9',  order: 1, rotatable: true  },
      { source: 'C9', target: 'C10', order: 1, rotatable: true  },
      { source: 'C10', target: 'C11', order: 1, rotatable: true },
      { source: 'C10', target: 'C12', order: 1, rotatable: true },
      { source: 'C2', target: 'H2',  order: 1, rotatable: false },
      { source: 'C3', target: 'H3',  order: 1, rotatable: false },
      { source: 'C5', target: 'H5',  order: 1, rotatable: false },
      { source: 'C6', target: 'H6',  order: 1, rotatable: false },
    ],
  },

  // ── Water H2O ─────────────────────────────────────────────────────────────
  {
    name: 'water',
    formula: 'H2O',
    molecular_weight: 18.02,
    atoms: [
      { id: 'O1', element: 'O', position: [ 0.00,  0.00,  0.00], charge: -0.83, hybridization: 'sp3' },
      { id: 'H1', element: 'H', position: [ 0.96,  0.00,  0.00], charge:  0.42, hybridization: 's'   },
      { id: 'H2', element: 'H', position: [-0.24,  0.93,  0.00], charge:  0.42, hybridization: 's'   },
    ],
    bonds: [
      { source: 'O1', target: 'H1', order: 1, rotatable: false },
      { source: 'O1', target: 'H2', order: 1, rotatable: false },
    ],
  },
]
