'use server';

import { adminDb as db } from '@/lib/firebase-admin';
import type {
  PVDomain,
  CapabilityComponent,
  ImplementationPhase,
  SuccessMetric,
} from '@/types/pv-curriculum';

import { logger } from '@/lib/logger';
const log = logger.scope('generate/domain-actions');

/**
 * Course generation parameters derived from a PV domain
 */
export interface DomainCourseParams {
  topic: string;
  description: string;
  domain: string;
  targetAudience: string;
  durationMinutes: number;
  objectives: string[];
  modules: ModuleStructure[];
  assessmentCriteria: string[];
  prerequisites: string[];
}

/**
 * Module structure for course generation
 */
export interface ModuleStructure {
  name: string;
  description: string;
  duration: string;
  objectives: string[];
  activities: string[];
}

/**
 * Domain summary for selector UI
 */
export interface DomainSummary {
  id: string;
  name: string;
  definition: string;
  totalKSBs: number;
  stats: {
    knowledge: number;
    skills: number;
    behaviors: number;
  };
}

/**
 * Get all domains for the selector dropdown
 */
export async function getDomainsForSelector(): Promise<DomainSummary[]> {
  try {
    const snapshot = await db
      .collection('pv_domains')
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as PVDomain;
      return {
        id: data.id,
        name: data.name,
        definition: data.definition,
        totalKSBs: data.totalKSBs,
        stats: {
          knowledge: data.stats.knowledge,
          skills: data.stats.skills,
          behaviors: data.stats.behaviors,
        },
      };
    });
  } catch (error) {
    log.error('Error fetching domains for selector:', error);
    throw new Error('Failed to fetch domains');
  }
}

/**
 * Generate course parameters from a PV domain
 */
export async function generateCourseParamsFromDomain(
  domainId: string
): Promise<DomainCourseParams> {
  try {
    // Fetch domain data
    const domainDoc = await db.collection('pv_domains').doc(domainId).get();
    if (!domainDoc.exists) {
      throw new Error(`Domain ${domainId} not found`);
    }
    const domain = domainDoc.data() as PVDomain;

    // Fetch capability components
    const componentsSnapshot = await db
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .get();
    const components = componentsSnapshot.docs.map(doc => doc.data() as CapabilityComponent);

    // Fetch implementation phases
    const phasesSnapshot = await db
      .collection('pv_implementation_guidance')
      .where('domainId', '==', domainId)
      .orderBy('phase', 'asc')
      .get();
    const phases = phasesSnapshot.docs.map(doc => doc.data() as ImplementationPhase);

    // Fetch success metrics
    const metricsSnapshot = await db
      .collection('pv_success_metrics')
      .where('domainId', '==', domainId)
      .get();
    const metrics = metricsSnapshot.docs.map(doc => doc.data() as SuccessMetric);

    // Generate course topic
    const topic = `${domain.name} - Comprehensive Capability Development`;

    // Generate description
    const description = domain.definition;

    // Extract learning objectives from knowledge components (top 5)
    const knowledgeComponents = components
      .filter(c => c.type === 'knowledge')
      .slice(0, 5);
    const objectives = knowledgeComponents.map(
      c => `Understand ${c.itemName}: ${c.itemDescription.slice(0, 100)}...`
    );

    // Map implementation phases to modules
    const modules: ModuleStructure[] = phases.map(phase => {
      // Get relevant components for this phase based on section matching
      const phaseComponents = components.filter(c =>
        c.majorSection.toLowerCase().includes(phase.phaseName.toLowerCase()) ||
        phase.focusAreas.toLowerCase().includes(c.majorSection.toLowerCase())
      ).slice(0, 5);

      return {
        name: `Phase ${phase.phase}: ${phase.phaseName}`,
        description: phase.focusAreas,
        duration: phase.duration,
        objectives: phaseComponents.map(c => c.itemName),
        activities: phase.keyActivities.split(',').map(a => a.trim()),
      };
    });

    // If no phases, create modules from major sections
    if (modules.length === 0) {
      const sections = [...new Set(components.map(c => c.majorSection))];
      sections.slice(0, 5).forEach((section, index) => {
        const sectionComponents = components.filter(c => c.majorSection === section);
        modules.push({
          name: `Module ${index + 1}: ${section}`,
          description: `Core concepts and practices for ${section}`,
          duration: '1-2 weeks',
          objectives: sectionComponents.slice(0, 3).map(c => c.itemName),
          activities: [
            'Concept review',
            'Practice exercises',
            'Knowledge check',
          ],
        });
      });
    }

    // Extract assessment criteria from success metrics
    const assessmentCriteria = metrics
      .filter(m => m.metricCategory === 'Individual')
      .slice(0, 5)
      .map(m => `${m.metricName}: ${m.target}`);

    // Calculate estimated duration based on phases
    const totalWeeks = phases.reduce((sum, p) => {
      const match = p.duration.match(/(\d+)/);
      return sum + (match ? parseInt(match[1], 10) : 2);
    }, 0);
    const durationMinutes = Math.min(90, Math.max(30, totalWeeks * 10));

    return {
      topic,
      description,
      domain: 'Life Sciences', // Map to existing domain options
      targetAudience: 'Industry Professionals',
      durationMinutes,
      objectives,
      modules,
      assessmentCriteria,
      prerequisites: domain.prerequisites || [],
    };
  } catch (error) {
    log.error(`Error generating course params from domain ${domainId}:`, error);
    throw new Error('Failed to generate course parameters from domain');
  }
}

/**
 * Get a preview of what the course will look like
 */
export async function getDomainCoursePreview(domainId: string): Promise<{
  domain: DomainSummary;
  moduleCount: number;
  objectiveCount: number;
  estimatedDuration: string;
  ksbBreakdown: {
    knowledge: number;
    skills: number;
    behaviors: number;
  };
}> {
  try {
    const params = await generateCourseParamsFromDomain(domainId);

    // Get domain summary
    const domainDoc = await db.collection('pv_domains').doc(domainId).get();
    const domain = domainDoc.data() as PVDomain;

    return {
      domain: {
        id: domain.id,
        name: domain.name,
        definition: domain.definition,
        totalKSBs: domain.totalKSBs,
        stats: {
          knowledge: domain.stats.knowledge,
          skills: domain.stats.skills,
          behaviors: domain.stats.behaviors,
        },
      },
      moduleCount: params.modules.length,
      objectiveCount: params.objectives.length,
      estimatedDuration: `${params.durationMinutes} minutes`,
      ksbBreakdown: {
        knowledge: domain.stats.knowledge,
        skills: domain.stats.skills,
        behaviors: domain.stats.behaviors,
      },
    };
  } catch (error) {
    log.error(`Error getting domain course preview for ${domainId}:`, error);
    throw new Error('Failed to get course preview');
  }
}
