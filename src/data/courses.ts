import type { Course } from '../types'

export const COURSES: Course[] = [
  {
    id: 'flintridge',
    name: 'Flint Ridge National',
    location: 'Andover, KS',
    style: 'premium',
    rating: 73.1,
    slope: 139,
    holes: [
      {
        number: 1, par: 4, yards: 421, handicap: 5, shape: 'straight', elevationFt: -8,
        hazards: [
          { type: 'water', side: 'right', fromTee: 230, note: 'Lake guards entire right side from 230 out' },
          { type: 'bunker', side: 'left', fromTee: 255, note: 'Deep fairway bunker at 255' },
        ],
        strategy: 'Position over power. Left-center off the tee takes the water out of play and opens the green.',
      },
      {
        number: 2, par: 3, yards: 176, handicap: 15, shape: 'straight', elevationFt: 12,
        hazards: [
          { type: 'bunker', side: 'front', note: 'False front with two deep bunkers short' },
        ],
        strategy: 'Plays a club longer uphill. Anything short feeds back off the false front — take enough club.',
      },
      {
        number: 3, par: 5, yards: 548, handicap: 1, shape: 'dogleg-right', elevationFt: 0,
        hazards: [
          { type: 'creek', side: 'cross', fromTee: 290, note: 'Creek crosses at 290 from the tee' },
          { type: 'ob', side: 'right', note: 'OB stakes down the entire right' },
        ],
        strategy: 'Three-shot hole for most. Lay back of the creek, then position to your favorite wedge number.',
      },
      {
        number: 4, par: 4, yards: 389, handicap: 9, shape: 'dogleg-left', elevationFt: 6,
        hazards: [
          { type: 'trees', side: 'left', note: 'Tall oaks pinch the corner at 240' },
          { type: 'bunker', side: 'right', fromTee: 250, note: 'Bunker catches bailout right' },
        ],
        strategy: 'Hold the right-center line — cutting the corner only works with a high draw.',
      },
      {
        number: 5, par: 4, yards: 462, handicap: 3, shape: 'straight', elevationFt: -15,
        hazards: [
          { type: 'waste', side: 'left', fromTee: 270, note: 'Waste area left at 270' },
        ],
        strategy: 'Longest par 4 on the side, but downhill helps. Green accepts a running approach.',
      },
      {
        number: 6, par: 3, yards: 148, handicap: 17, shape: 'straight', elevationFt: 0,
        hazards: [
          { type: 'water', side: 'front', note: 'Pond fronts the green — full carry required' },
        ],
        strategy: 'Scoring hole. Middle of the green leaves nothing longer than 25 feet to any pin.',
      },
      {
        number: 7, par: 5, yards: 521, handicap: 7, shape: 'straight', elevationFt: 10,
        hazards: [
          { type: 'bunker', side: 'left', fromTee: 265, note: 'Staggered bunkers left at 265 and 300' },
        ],
        strategy: 'Reachable downwind. Second shot must respect the tiered green — long is dead.',
      },
      {
        number: 8, par: 4, yards: 357, handicap: 13, shape: 'dogleg-right', elevationFt: 0,
        hazards: [
          { type: 'water', side: 'right', fromTee: 215, note: 'Pond inside the dogleg at 215–270' },
          { type: 'bunker', side: 'left', fromTee: 240, note: 'Bunker on the safe line at 240' },
        ],
        strategy: 'Classic risk/reward. 200 off the tee leaves a full wedge; driver flirts with the pond.',
      },
      {
        number: 9, par: 4, yards: 438, handicap: 11, shape: 'straight', elevationFt: 18,
        hazards: [
          { type: 'bunker', side: 'cross', fromTee: 285, note: 'Cross bunkers at 285' },
          { type: 'ob', side: 'left', note: 'Clubhouse OB left' },
        ],
        strategy: 'Uphill finisher into the prevailing wind. Center of the green is a win.',
      },
    ],
  },
  {
    id: 'cedarcreek',
    name: 'Cedar Creek Municipal',
    location: 'Wichita, KS',
    style: 'municipal',
    rating: 69.8,
    slope: 118,
    holes: [
      {
        number: 1, par: 4, yards: 358, handicap: 11, shape: 'straight', elevationFt: 0,
        hazards: [{ type: 'trees', side: 'left', note: 'Mature cottonwoods line the left' }],
        strategy: 'Friendly opener. Anything in the short grass leaves a wedge.',
      },
      {
        number: 2, par: 5, yards: 495, handicap: 3, shape: 'dogleg-left', elevationFt: -5,
        hazards: [{ type: 'creek', side: 'cross', fromTee: 240, note: 'Cedar Creek crosses at 240' }],
        strategy: 'Genuinely reachable if you clear the creek. Laying up to 100 is the percentage play.',
      },
      {
        number: 3, par: 3, yards: 156, handicap: 15, shape: 'straight', elevationFt: 0,
        hazards: [{ type: 'bunker', side: 'right', note: 'Single greenside bunker right' }],
        strategy: 'Stock mid-iron. Miss left of the flag all day.',
      },
      {
        number: 4, par: 4, yards: 401, handicap: 1, shape: 'straight', elevationFt: 8,
        hazards: [
          { type: 'ob', side: 'right', note: 'Driving range OB right' },
          { type: 'bunker', side: 'left', fromTee: 245, note: 'Fairway bunker left at 245' },
        ],
        strategy: 'The hardest hole on the course. Favor the left half all the way to the green.',
      },
      {
        number: 5, par: 4, yards: 332, handicap: 13, shape: 'dogleg-right', elevationFt: 0,
        hazards: [{ type: 'trees', side: 'right', note: 'Corner trees block the shortcut' }],
        strategy: 'An iron and a wedge. Driver brings the trees into play for no real gain.',
      },
      {
        number: 6, par: 3, yards: 188, handicap: 7, shape: 'straight', elevationFt: -10,
        hazards: [{ type: 'bunker', side: 'front', note: 'Two bunkers pinch the front' }],
        strategy: 'Long but downhill. Land it on the front third and let it release.',
      },
      {
        number: 7, par: 5, yards: 530, handicap: 5, shape: 'straight', elevationFt: 0,
        hazards: [{ type: 'water', side: 'left', fromTee: 420, note: 'Pond left of the layup zone at 420–470' }],
        strategy: 'Three honest shots. Keep the layup right of the pond and attack with a wedge.',
      },
      {
        number: 8, par: 4, yards: 376, handicap: 9, shape: 'straight', elevationFt: 5,
        hazards: [{ type: 'bunker', side: 'right', fromTee: 230, note: 'Bunker right at 230' }],
        strategy: 'Straightforward. The green slopes hard back-to-front — stay below the hole.',
      },
      {
        number: 9, par: 4, yards: 410, handicap: 17, shape: 'straight', elevationFt: 0,
        hazards: [{ type: 'water', side: 'right', fromTee: 250, note: 'Retention pond right at 250' }],
        strategy: 'Solid finisher. Left-center is safe; the pond punishes a blocked drive.',
      },
    ],
  },
]

export function getCourse(id: string): Course {
  return COURSES.find((c) => c.id === id) ?? COURSES[0]
}

export function getHole(courseId: string, holeNumber: number) {
  const course = getCourse(courseId)
  return course.holes.find((h) => h.number === holeNumber) ?? course.holes[0]
}
