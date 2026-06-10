import type { Club, ClubId, BagClub } from '../types'

export const CLUB_CATALOG: Club[] = [
  { id: 'DR', label: 'Driver', short: 'DR', type: 'driver', loft: 10.5, defaultCarry: 235, defaultTotal: 258 },
  { id: '3W', label: '3 Wood', short: '3W', type: 'wood', loft: 15, defaultCarry: 215, defaultTotal: 232 },
  { id: '5W', label: '5 Wood', short: '5W', type: 'wood', loft: 18, defaultCarry: 200, defaultTotal: 214 },
  { id: '3H', label: '3 Hybrid', short: '3H', type: 'hybrid', loft: 19, defaultCarry: 195, defaultTotal: 207 },
  { id: '4H', label: '4 Hybrid', short: '4H', type: 'hybrid', loft: 22, defaultCarry: 185, defaultTotal: 196 },
  { id: '4I', label: '4 Iron', short: '4i', type: 'iron', loft: 21, defaultCarry: 185, defaultTotal: 195 },
  { id: '5I', label: '5 Iron', short: '5i', type: 'iron', loft: 24, defaultCarry: 175, defaultTotal: 184 },
  { id: '6I', label: '6 Iron', short: '6i', type: 'iron', loft: 27, defaultCarry: 165, defaultTotal: 173 },
  { id: '7I', label: '7 Iron', short: '7i', type: 'iron', loft: 31, defaultCarry: 155, defaultTotal: 161 },
  { id: '8I', label: '8 Iron', short: '8i', type: 'iron', loft: 35, defaultCarry: 143, defaultTotal: 148 },
  { id: '9I', label: '9 Iron', short: '9i', type: 'iron', loft: 39, defaultCarry: 131, defaultTotal: 135 },
  { id: 'PW', label: 'Pitching Wedge', short: 'PW', type: 'wedge', loft: 44, defaultCarry: 118, defaultTotal: 121 },
  { id: 'GW', label: 'Gap Wedge', short: 'GW', type: 'wedge', loft: 50, defaultCarry: 104, defaultTotal: 106 },
  { id: 'SW', label: 'Sand Wedge', short: 'SW', type: 'wedge', loft: 56, defaultCarry: 88, defaultTotal: 90 },
  { id: 'LW', label: 'Lob Wedge', short: 'LW', type: 'wedge', loft: 60, defaultCarry: 72, defaultTotal: 73 },
  { id: 'PT', label: 'Putter', short: 'PT', type: 'putter', loft: 3, defaultCarry: 0, defaultTotal: 0 },
]

export const DEFAULT_BAG_IDS: ClubId[] = [
  'DR', '3W', '4H', '5I', '6I', '7I', '8I', '9I', 'PW', 'GW', 'SW', 'LW', 'PT', '5W',
]

export function getClub(id: ClubId): Club {
  return CLUB_CATALOG.find((c) => c.id === id) ?? CLUB_CATALOG[0]
}

export function defaultBag(): BagClub[] {
  return DEFAULT_BAG_IDS.map((id) => {
    const c = getClub(id)
    return { clubId: id, carry: c.defaultCarry, total: c.defaultTotal }
  })
}

/** Clubs ordered longest → shortest for selection lists. */
export function orderedBag(bag: BagClub[]): BagClub[] {
  return [...bag].sort((a, b) => b.total - a.total)
}
