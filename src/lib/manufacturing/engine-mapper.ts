import { type ActivityEngineType } from '../../types/alo';

/**
 * KSB types based on the PDC framework
 */
export type KSBType = 'knowledge' | 'skill' | 'behavior' | 'ai_integration';

/**
 * Bloom's Taxonomy levels
 */
export type BloomLevel = 
  | 'remember' 
  | 'understand' 
  | 'apply' 
  | 'analyze' 
  | 'evaluate' 
  | 'create';

/**
 * Maps KSB characteristics to the most appropriate activity engine
 */
export class ActivityEngineMapper {
  /**
   * Assigns an activity engine based on KSB type and Bloom level
   */
  static mapEngine(ksbType: KSBType, bloomLevel: BloomLevel): ActivityEngineType {
    const mapping: Record<KSBType, Partial<Record<BloomLevel, ActivityEngineType>>> = {
      knowledge: {
        remember: 'red_pen',
        understand: 'red_pen',
        apply: 'triage',
        analyze: 'triage',
        evaluate: 'synthesis',
        create: 'synthesis'
      },
      skill: {
        remember: 'triage',
        understand: 'triage',
        apply: 'calculator',
        analyze: 'timeline',
        evaluate: 'timeline',
        create: 'code_playground'
      },
      behavior: {
        remember: 'triage',
        understand: 'triage',
        apply: 'synthesis',
        analyze: 'synthesis',
        evaluate: 'synthesis',
        create: 'synthesis'
      },
      ai_integration: {
        remember: 'triage',
        understand: 'triage',
        apply: 'code_playground',
        analyze: 'code_playground',
        evaluate: 'code_playground',
        create: 'code_playground'
      }
    };

    // Default fallback logic
    const engine = mapping[ksbType]?.[bloomLevel];
    if (engine) return engine;

    // Type-based fallbacks
    if (ksbType === 'behavior') return 'synthesis';
    if (ksbType === 'skill') return 'triage';
    if (ksbType === 'ai_integration') return 'code_playground';
    
    return 'triage';
  }

  /**
   * Suggests an activity engine based on KSB metadata
   */
  static suggestEngine(ksb: { 
    type: string; 
    bloomLevel?: string; 
    title: string; 
    description: string;
  }): ActivityEngineType {
    const type = this.normalizeType(ksb.type);
    const level = this.normalizeBloomLevel(ksb.bloomLevel);
    
    return this.mapEngine(type, level);
  }

  private static normalizeType(type: string): KSBType {
    const t = type.toLowerCase();
    if (t.includes('knowledge')) return 'knowledge';
    if (t.includes('skill')) return 'skill';
    if (t.includes('behavior')) return 'behavior';
    if (t.includes('ai') || t.includes('code')) return 'ai_integration';
    return 'knowledge';
  }

  private static normalizeBloomLevel(level?: string): BloomLevel {
    if (!level) return 'understand';
    const l = level.toLowerCase();
    if (l.includes('remember')) return 'remember';
    if (l.includes('understand')) return 'understand';
    if (l.includes('apply')) return 'apply';
    if (l.includes('analyze')) return 'analyze';
    if (l.includes('evaluate')) return 'evaluate';
    if (l.includes('create')) return 'create';
    return 'understand';
  }
}
