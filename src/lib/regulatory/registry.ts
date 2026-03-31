import type { RegulatoryMarket } from './types'
import { FDA_MARKET } from './markets/fda'

const MARKETS: Record<string, RegulatoryMarket> = {
  fda: FDA_MARKET,
}

export function getMarket(id: string): RegulatoryMarket | undefined {
  return MARKETS[id]
}

export function listMarkets(): RegulatoryMarket[] {
  return Object.values(MARKETS)
}

export function getDefaultMarket(): RegulatoryMarket {
  return FDA_MARKET
}

export function registerMarket(market: RegulatoryMarket): void {
  MARKETS[market.id] = market
}
