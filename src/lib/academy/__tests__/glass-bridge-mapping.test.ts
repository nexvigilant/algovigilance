import {
  GLASS_BRIDGE_MAP,
  DEFAULT_GLASS_CONFIG,
  getGlassBridgeConfig,
  type GlassBridgeConfig,
  type GlassTool,
} from '../glass-bridge-mapping';

describe('glass-bridge-mapping', () => {
  // All 15 PDC domains
  const ALL_DOMAINS = Array.from({ length: 15 }, (_, i) =>
    `D${String(i + 1).padStart(2, '0')}`
  );

  describe('domain coverage', () => {
    it('maps all 15 PDC domains (D01–D15)', () => {
      for (const domain of ALL_DOMAINS) {
        expect(GLASS_BRIDGE_MAP[domain]).toBeDefined();
      }
    });

    it('has no extra keys beyond D01–D15', () => {
      const keys = Object.keys(GLASS_BRIDGE_MAP);
      expect(keys).toHaveLength(15);
      for (const key of keys) {
        expect(ALL_DOMAINS).toContain(key);
      }
    });
  });

  describe('config structure', () => {
    it.each(ALL_DOMAINS)('%s has a headline and at least one tool', (domain) => {
      const config = GLASS_BRIDGE_MAP[domain];
      expect(config.headline).toBeTruthy();
      expect(config.tools.length).toBeGreaterThanOrEqual(1);
    });

    it.each(ALL_DOMAINS)('%s tools have required fields', (domain) => {
      for (const tool of GLASS_BRIDGE_MAP[domain].tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.example).toBeTruthy();
        expect(tool.href).toBeTruthy();
        expect(['cyan', 'gold', 'copper']).toContain(tool.color);
      }
    });

    it('all tools link to /station/demo', () => {
      for (const domain of ALL_DOMAINS) {
        for (const tool of GLASS_BRIDGE_MAP[domain].tools) {
          expect(tool.href).toBe('/station/demo');
        }
      }
    });
  });

  describe('getGlassBridgeConfig', () => {
    it('returns mapped config for known domains', () => {
      const config = getGlassBridgeConfig('D01');
      expect(config).toBe(GLASS_BRIDGE_MAP['D01']);
      expect(config.headline).toContain('PV computations');
    });

    it('returns default config for unknown domains', () => {
      const config = getGlassBridgeConfig('D99');
      expect(config).toBe(DEFAULT_GLASS_CONFIG);
    });

    it('returns default config for empty string', () => {
      expect(getGlassBridgeConfig('')).toBe(DEFAULT_GLASS_CONFIG);
    });

    it('default config has at least 2 tools', () => {
      expect(DEFAULT_GLASS_CONFIG.tools.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Move 0 bridge integrity', () => {
    // The Academy→Glass bridge is the Move 0 gate.
    // Every domain must route to at least one Station tool so learners
    // can transition from theory (Academy) to practice (Glass/Station).

    it('every domain has a Station href (no dead-end domains)', () => {
      for (const domain of ALL_DOMAINS) {
        const config = getGlassBridgeConfig(domain);
        const hasStationLink = config.tools.some((t) => t.href.length > 0);
        expect(hasStationLink).toBe(true);
      }
    });

    it('signal detection domain (D08) maps PRR/ROR and IC/EBGM', () => {
      const d08 = getGlassBridgeConfig('D08');
      const toolNames = d08.tools.map((t) => t.name);
      expect(toolNames).toContain('PRR / ROR');
      expect(toolNames).toContain('IC / EBGM');
    });

    it('causality domain (D02) maps Naranjo and WHO-UMC', () => {
      const d02 = getGlassBridgeConfig('D02');
      const toolNames = d02.tools.map((t) => t.name);
      expect(toolNames).toContain('Naranjo Causality');
      expect(toolNames).toContain('WHO-UMC Assessment');
    });

    it('benefit-risk domain (D10) maps calculator and NNH', () => {
      const d10 = getGlassBridgeConfig('D10');
      const toolNames = d10.tools.map((t) => t.name);
      expect(toolNames).toContain('Benefit-Risk Calculator');
      expect(toolNames).toContain('Number Needed to Harm');
    });
  });
});
