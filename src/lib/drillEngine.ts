import type { Drill, PlayerProfile, RangeGoal } from '../types'
import { DRILLS } from '../data/drills'

/**
 * Drill recommendation engine: scores every drill against the selected
 * range goal, the player's stated goals, and their common miss.
 */

export function recommendDrills(goal: RangeGoal, profile: PlayerProfile): Drill[] {
  const scored = DRILLS.map((d) => {
    let score = 0
    if (d.goals.includes(goal)) score += 10
    if (profile.commonMiss === 'slice' && d.id === 'anti-slice-gate') score += 4
    if (['fat', 'thin', 'top', 'chunk'].includes(profile.commonMiss) && (d.id === 'low-point-towel' || d.id === 'carry-ladder-7i')) score += 4
    if (profile.commonMiss === 'shank' && d.id === 'start-line-gate') score += 3
    if (profile.goals.includes('fix-slice') && d.goals.includes('fix-slice')) score += 2
    if (profile.goals.includes('short-game') && (d.category === 'short-game' || d.category === 'wedges')) score += 2
    if (profile.goals.includes('putting') && d.category === 'putting') score += 2
    if (profile.goals.includes('improve-irons') && d.category === 'irons') score += 2
    if (profile.goals.includes('add-distance') && d.goals.includes('add-distance')) score += 2
    return { drill: d, score }
  })
  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.drill)
}

export function primaryDrill(goal: RangeGoal, profile: PlayerProfile): Drill {
  return recommendDrills(goal, profile)[0]
}

export const GOAL_LABELS: Record<RangeGoal, string> = {
  'fix-slice': 'Fix Slice',
  'driver-accuracy': 'Driver Accuracy',
  'dial-wedges': 'Dial Wedges',
  'iron-contact': 'Iron Contact',
  'add-distance': 'Add Carry Distance',
  'stock-yardages': 'Build Stock Yardages',
  'course-sim': 'Course Simulation',
  pressure: 'Pressure Practice',
  warmup: 'Pre-Round Warmup',
}

export const GOAL_DESCRIPTIONS: Record<RangeGoal, string> = {
  'fix-slice': 'Kill the left-to-right curve with path and face work',
  'driver-accuracy': 'More fairways through start-line control',
  'dial-wedges': 'Own every number from 40–125',
  'iron-contact': 'Ball-first contact, every time',
  'add-distance': 'Speed and strike efficiency',
  'stock-yardages': 'One trusted number per club',
  'course-sim': 'Practice like you play',
  pressure: 'Make range gains survive the first tee',
  warmup: 'Prime the body and calibrate, fast',
}
