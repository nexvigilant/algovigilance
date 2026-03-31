import type { RegulatoryMarket } from '../types'
import { FDA_DRUGS_GROUP } from './fda-drugs'
import { FDA_DEVICES_GROUP } from './fda-devices'
import { FDA_FOOD_GROUP } from './fda-food'
import { FDA_GUIDANCE_GROUP } from './fda-guidance'

export const FDA_MARKET: RegulatoryMarket = {
  id: 'fda',
  name: 'U.S. Food and Drug Administration',
  shortName: 'FDA',
  flag: '🇺🇸',
  website: 'https://www.fda.gov',

  searchConfig: {
    mcpTool: 'fda_guidance_search',
    placeholder: 'Search FDA drugs, devices, guidance, recalls…',
    searchFields: ['brand_name', 'generic_name', 'applicant', 'subject', 'recall_number'],
  },

  guidanceConfig: {
    mcpTool: 'fda_guidance_search',
    categoriesMcpTool: 'fda_guidance_categories',
    getMcpTool: 'fda_guidance_get',
  },

  tabGroups: [
    FDA_DRUGS_GROUP,
    FDA_DEVICES_GROUP,
    FDA_FOOD_GROUP,
    FDA_GUIDANCE_GROUP,
  ],
}
