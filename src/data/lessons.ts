export interface Lesson {
  id: string
  title: string
  category: 'full-swing' | 'driving' | 'irons' | 'short-game' | 'putting' | 'course-management' | 'mental'
  level: 'beginner' | 'intermediate' | 'advanced'
  minutes: number
  summary: string
  keys: string[]
  steps: { heading: string; body: string }[]
  proTip: string
  drillIds: string[]
}

export const LESSON_CATEGORIES: { id: Lesson['category']; label: string; icon: string }[] = [
  { id: 'full-swing', label: 'Full swing', icon: '🌀' },
  { id: 'driving', label: 'Driving', icon: '🚀' },
  { id: 'irons', label: 'Irons', icon: '🎯' },
  { id: 'short-game', label: 'Short game', icon: '⛳' },
  { id: 'putting', label: 'Putting', icon: '🕳' },
  { id: 'course-management', label: 'Strategy', icon: '🧠' },
  { id: 'mental', label: 'Mental', icon: '🧘' },
]

export const LESSONS: Lesson[] = [
  {
    id: 'grip-foundation',
    title: 'The grip: your only connection',
    category: 'full-swing',
    level: 'beginner',
    minutes: 8,
    summary: 'Ninety percent of slices are born before the swing starts. A neutral-to-strong grip lets you release the club without manipulation.',
    keys: [
      'See 2–3 knuckles on your lead hand at address',
      'Lead-hand thumb sits slightly right of center (righties)',
      'Pressure 4/10 — a tube of toothpaste you can\'t squeeze out',
      'Trail-hand palm faces the target, covers the lead thumb',
    ],
    steps: [
      { heading: 'Lead hand in the fingers', body: 'Lay the grip diagonally from the base of your pinky to the middle joint of your index finger. Close the hand — the heel pad sits ON TOP of the grip. If the club is in your palm, you\'ve already lost speed and face control.' },
      { heading: 'Check the Vs', body: 'The crease between thumb and index finger on both hands should point between your trail ear and trail shoulder. Vs at your chin = weak grip = open face = slice fuel.' },
      { heading: 'Pressure points', body: 'Last three fingers of the lead hand and the middle two of the trail hand do the holding. Thumbs and index fingers are passengers. Re-grip before every range ball for two weeks — it takes 300 reps to feel normal.' },
    ],
    proTip: 'If you fight a slice, rotate both hands 1cm clockwise (righty) and DON\'T try to square the face — let the new grip do it. It will feel like you\'ll hook everything. You won\'t.',
    drillIds: ['start-line-gate', 'anti-slice-gate'],
  },
  {
    id: 'rotation-engine',
    title: 'Turn, don\'t sway: the rotation engine',
    category: 'full-swing',
    level: 'intermediate',
    minutes: 10,
    summary: 'Amateur power leaks come from sliding instead of turning. Learn to coil around a stable post and the speed shows up for free.',
    keys: [
      'Trail hip turns BEHIND you, not away from the target',
      'Pressure into the trail heel at the top, not the outside of the foot',
      'Lead shoulder works down and behind the ball',
      'Belt buckle leads the downswing, hands come last',
    ],
    steps: [
      { heading: 'Find your post', body: 'At address, feel 55% pressure on the trail foot inside edge. Going back, the trail leg keeps its flex while the hips ROTATE around it. If your head drifts off the ball more than a few inches, you\'re sliding.' },
      { heading: 'Coil to a full top', body: 'Turn until your lead shoulder is behind the ball and your back faces the target. Short turns force the arms to generate speed — that\'s where over-the-top moves are born.' },
      { heading: 'Sequence down', body: 'From the top: pressure shifts to the lead foot FIRST, hips open, chest follows, arms drop, club releases. Ground → hips → chest → arms → club. Every long hitter on earth uses this order.' },
    ],
    proTip: 'Film yourself in Swing Studio — the analyzer measures your hip sway directly. Under 15% of hip width is tour-grade stability.',
    drillIds: ['wall-hip-drill', 'cross-arm-turns', 'step-through'],
  },
  {
    id: 'driver-launch',
    title: 'Driver: hit up, launch high, spin low',
    category: 'driving',
    level: 'intermediate',
    minutes: 9,
    summary: 'The driver is the only club you hit on the upswing. Set up for launch and you can add 15–25 yards without swinging harder.',
    keys: [
      'Ball off the lead heel, tee half a ball above the crown',
      'Spine tilted slightly away from target at address',
      'Feel like you\'re hitting the ball at the START of a skateboard ramp going up',
      'Tee shots are 80% swings — dispersion beats distance',
    ],
    steps: [
      { heading: 'Build the launch setup', body: 'Widen your stance two inches beyond shoulders. Ball forward off the lead heel. Drop your trail shoulder so your spine tilts 5–10° away from the target — this presets the upward strike.' },
      { heading: 'Sweep, don\'t smash', body: 'With the ball forward, the club reaches it AFTER the low point — catching it on the rise. If you\'re hitting down on driver (most slicers do), you\'re adding spin that balloons and bends the ball.' },
      { heading: 'Pick a side', body: 'Never aim down the middle. Pick the side of the fairway that protects your miss: slicer aims down the left edge and lets it work back. The caddie on the Play tab does this math for you with real polygons.' },
    ],
    proTip: 'Grip down half an inch and swing at 80% on tight holes — average loss is 7 yards, average dispersion gain is 30%. That trade wins money.',
    drillIds: ['anti-slice-gate', 'pressure-fairway', 'three-ball-dispersion'],
  },
  {
    id: 'iron-compression',
    title: 'Compress your irons: ball first, turf second',
    category: 'irons',
    level: 'intermediate',
    minutes: 10,
    summary: 'The single difference between an 8 and an 18 handicap iron player: where the club bottoms out. Move the low point in front of the ball.',
    keys: [
      'Divot starts AFTER the ball, pointing at the target',
      'Hands ahead of the clubhead at impact (shaft lean)',
      'Pressure 80% on the lead foot at impact',
      'Hit DOWN to make the ball go UP',
    ],
    steps: [
      { heading: 'Understand low point', body: 'The swing arc bottoms out under your lead shoulder. If your weight hangs back, the arc bottoms behind the ball — fat or thin, nothing in between. Shift pressure forward and the arc moves with it.' },
      { heading: 'The towel test', body: 'Place a towel one grip-length behind the ball. Hit half shots without touching it. Impossible to do while hanging back — your body learns the forward strike without a single technical thought.' },
      { heading: 'Trap it', body: 'Feel the chest "covering" the ball at impact — like you\'re trying to keep the ball under a table. The loft of the club is enough to launch it. Trying to lift = thin city.' },
    ],
    proTip: 'Take one more club than the number says, swing smoother, and aim for the BACK of the ball. GIR% climbs immediately.',
    drillIds: ['low-point-towel', 'carry-ladder-7i'],
  },
  {
    id: 'wedge-clock',
    title: 'The clock system: own every yardage inside 120',
    category: 'short-game',
    level: 'intermediate',
    minutes: 12,
    summary: 'Three backswing lengths × three wedges = nine stock numbers. Tour players don\'t guess at 67 yards, and neither should you.',
    keys: [
      'Backswing to 9 o\'clock, 10:30, and full — same tempo each',
      'Body rotates through every shot; arms-only = chunks',
      'Know your nine carry numbers cold',
      'Land the ball on a number, let it release',
    ],
    steps: [
      { heading: 'Calibrate', body: 'On the range (or with the Range tab open), hit 5 balls per clock position per wedge. Log the carries. The average IS your number — write all nine on a card in your bag.' },
      { heading: 'Same engine, shorter lever', body: 'The 9 o\'clock shot is not a slower swing — it\'s a shorter one at FULL commitment. Deceleration is the #1 wedge killer. Short backswing, aggressive turn through.' },
      { heading: 'On the course', body: '78 to the pin? That\'s your 10:30 sand wedge (or whatever your card says). No more "smooth 60%" guesswork — pull the number, make the stock swing.' },
    ],
    proTip: 'When between numbers, take the longer one and grip down an inch. Gripping down removes ~5 yards without changing the swing.',
    drillIds: ['wedge-matrix', 'up-down-scramble'],
  },
  {
    id: 'greenside-system',
    title: 'One chip motion, four trajectories',
    category: 'short-game',
    level: 'beginner',
    minutes: 9,
    summary: 'Stop owning six chipping techniques that all break under pressure. One motion, four setups, every greenside shot covered.',
    keys: [
      'Ball back = lower flight, more release',
      'Ball forward + face open = higher, softer',
      'Weight stays 60% lead the entire motion',
      'Land on the green ASAP, run to the hole',
    ],
    steps: [
      { heading: 'The base motion', body: 'Narrow stance, ball center, shaft vertical, weight lead. Rock the shoulders and turn through — wrists quiet. The club brushes the grass where your sternum points.' },
      { heading: 'Trajectory dial', body: 'Same swing: ball back two inches = bullet that releases. Ball up + face open two degrees = floater. You change the SETUP, never the swing.' },
      { heading: 'Pick your landing spot', body: 'Walk to the green, find the flat spot 2–3 paces on, and commit to landing there. Pros pick the landing spot first and the club second. 8-iron bump for long runs, sand wedge for short ones.' },
    ],
    proTip: 'The "8/10/12 rule": a ball-back chip with PW flies 1/3, rolls 2/3. With 8-iron: 1/4 fly, 3/4 roll. Learn two ratios and putting becomes your only short-game variable.',
    drillIds: ['up-down-scramble'],
  },
  {
    id: 'putting-speed',
    title: 'Speed is 90% of putting',
    category: 'putting',
    level: 'beginner',
    minutes: 8,
    summary: 'Three-putts come from distance error, not line error. Master pace and your worst day becomes a two-putt day.',
    keys: [
      'Every putt dies 12–18 inches past the hole',
      'Backswing length controls distance, not hit',
      'Eyes trace the line, brain computes the pace — trust it',
      'Lag putts: think in 3-foot circles, not cups',
    ],
    steps: [
      { heading: 'The pendulum', body: 'Same tempo every putt — only the length of the stroke changes. A 40-footer is a long smooth pendulum, not a faster one. Count "one-two" — back on one, through on two, every single putt.' },
      { heading: 'Calibrate your ladder', body: 'Drop balls at 10, 20, 30, 40 feet. Putt each looking at the HOLE, not the ball. Your eyes feed distance better than any mechanical thought. This is the lag ladder drill — 10 minutes before every round.' },
      { heading: 'Die it in', body: 'A putt dying at the hole has the whole cup to fall in. A putt charging has two inches of it. Aggressive putting is a leak dressed up as confidence.' },
    ],
    proTip: 'Before every round, find the practice green\'s pace with 5 long putts. Reading greens is useless if your speed is calibrated to last week\'s course.',
    drillIds: ['lag-ladder'],
  },
  {
    id: 'course-iq',
    title: 'Course IQ: play the percentages',
    category: 'course-management',
    level: 'intermediate',
    minutes: 11,
    summary: 'A 15-handicap making tour decisions saves 4–6 strokes a round with zero swing changes. This is the cheapest improvement in golf.',
    keys: [
      'Aim at the center of every green — the pin is a lie',
      'Your "bad" shot pattern decides the target, not your best',
      'Short-siding yourself is the amateur tax',
      'Bogey is never a disaster; double always is',
    ],
    steps: [
      { heading: 'The dispersion truth', body: 'Your shots land in an ellipse, not a point. The question is never "can I hit this shot" — it\'s "where does the WHOLE ellipse go". The GPS caddie draws this ellipse on the actual hole. If 20% of it is wet, the target is wrong.' },
      { heading: 'Expected strokes thinking', body: 'From 160 in the fairway you average 3.0 strokes to hole out. From 160 behind trees: 3.8. So a recovery chip that "wastes" a shot to get back to the fairway often GAINS strokes. Hero shots are negative-EV theater.' },
      { heading: 'The 80% tee shot', body: 'On par 4s under 380, driver often gains less than half a stroke over a hybrid — and triples the trouble percentage. The caddie prices this for every hole. Trust the number over the ego.' },
    ],
    proTip: 'Track one round making ONLY center-of-green, fat-side-of-fairway decisions. Most players shoot a personal-best week.',
    drillIds: ['random-course-sim', 'punch-wind'],
  },
  {
    id: 'wind-play',
    title: 'Wind: flight it, don\'t fight it',
    category: 'course-management',
    level: 'advanced',
    minutes: 9,
    summary: 'Wind punishes spin and ego equally. The counter-intuitive truth: swing EASIER into the breeze.',
    keys: [
      'Into wind: 1% distance lost per mph — two clubs more is normal',
      'Downwind helps half as much as headwind hurts',
      'Crosswind: aim off the edge, let it ride back',
      'Hard swings add spin; spin climbs; climbing balls die',
    ],
    steps: [
      { heading: 'The knockdown', body: 'Ball back one inch, grip down one inch, swing 80%, finish low with the chest facing the target. The ball bores instead of balloons. This one shot is worth three strokes on a windy day.' },
      { heading: 'Use the live numbers', body: 'The Play tab decomposes live wind onto your exact shot bearing — it knows 12 mph at 40° off your line is 9 into and 8 across. Take the plays-like number literally.' },
      { heading: 'Crosswind decisions', body: 'Riding the wind (drawing with a right-to-left breeze) adds distance but also adds curve risk. Holding against it costs distance but tightens dispersion. Into a scoring hole: hold. On a wide-open tee: ride.' },
    ],
    proTip: 'Throw grass at shoulder height, not overhead — surface wind is what your ball feels for the first 40 yards, where the flight is set.',
    drillIds: ['punch-wind'],
  },
  {
    id: 'pressure-protocol',
    title: 'The pressure protocol',
    category: 'mental',
    level: 'intermediate',
    minutes: 7,
    summary: 'Pressure doesn\'t break swings, it breaks routines. Build one that runs on autopilot when your hands are shaking.',
    keys: [
      'Same pre-shot routine, same length, every shot',
      'One target thought, zero swing thoughts over the ball',
      'Breathe out on the takeaway',
      'Bad shot? You get 10 steps of anger, then it\'s over',
    ],
    steps: [
      { heading: 'Build the box', body: 'Behind the ball: pick the smallest possible target (not "the fairway" — that tree branch). One rehearsal feeling the shot. Step in, one look, go. Total time: under 12 seconds. Slow players aren\'t careful, they\'re scared.' },
      { heading: 'The exhale trigger', body: 'Long exhale as you start the club back. It\'s physiologically impossible to be fully tense on an exhale. Tour players have used this for decades; it costs nothing.' },
      { heading: 'The 10-step rule', body: 'After a bad shot you get ten steps of full disgust. At step ten, it\'s data, not drama: the Range tab logs the miss pattern, the caddie adjusts. Carrying anger into the next swing is how doubles become quads.' },
    ],
    proTip: 'Under real pressure, take one more club and swing at 80%. Adrenaline already adds the missing speed.',
    drillIds: ['pressure-fairway'],
  },
]

export function getLesson(id: string): Lesson {
  return LESSONS.find((l) => l.id === id) ?? LESSONS[0]
}
