/**
 * The TrueCaddie playbook. Instruction synthesized from the canon —
 * Hogan's Five Lessons, Penick's Little Red Book, Pelz's short-game and
 * putting research, Broadie's strokes-gained work (Every Shot Counts),
 * Tour Tempo's frame studies, AimPoint — translated into the moves and
 * numbers that actually transfer for amateur golfers.
 */

export interface Lesson {
  id: string
  title: string
  category: 'full-swing' | 'driving' | 'irons' | 'short-game' | 'putting' | 'course-management' | 'mental' | 'practice'
  level: 'beginner' | 'intermediate' | 'advanced'
  minutes: number
  summary: string
  /** The data case for caring — usually strokes-gained or tour-research based. */
  whyItMatters: string
  keys: string[]
  steps: { heading: string; body: string }[]
  mistakes: { wrong: string; fix: string }[]
  feels: { feel: string; real: string }[]
  checkpoints: string[]
  proTip: string
  source: string
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
  { id: 'practice', label: 'Practice', icon: '🔁' },
]

export const LESSONS: Lesson[] = [
  // ════════════════════════════════ FULL SWING ═══════════════════════════
  {
    id: 'grip-foundation',
    title: 'The grip: your only connection',
    category: 'full-swing',
    level: 'beginner',
    minutes: 8,
    summary:
      'Hogan devoted a quarter of Five Lessons to the grip before a single word about the swing — because the hands are the only part of you touching the club. Most slices are decided here, before the takeaway even starts.',
    whyItMatters:
      'An open clubface at impact is the #1 amateur fault, and a weak grip almost guarantees one. Face angle controls roughly 80% of starting direction — fix the grip and the face squares itself, no timing required. For a typical slicer that\'s 2–4 shots a round that stay in play instead of in the trees.',
    keys: [
      'Club in the FINGERS of the lead hand, never the palm',
      'See 2–3 knuckles on your lead hand at address',
      'Both "Vs" (thumb–index creases) point at your trail shoulder',
      'Pressure 4/10 — last three fingers of the lead hand do the holding',
    ],
    steps: [
      {
        heading: 'Lead hand: diagonal through the fingers',
        body: 'Hold the club waist-high in front of you. Lay the grip diagonally from the base of the pinky to the middle joint of the index finger, then close the hand so the heel pad sits ON TOP of the grip. Done right, you can hold the club with just the pinky-side fingers and the heel pad — that\'s the lever Hogan called the firm "vise" of the lead hand. Palm grips kill wrist hinge and bleed clubhead speed.',
      },
      {
        heading: 'Check the knuckles and the Vs',
        body: 'Look down: you should see two to three knuckles of the lead hand. The crease between thumb and index finger on BOTH hands points between your trail ear and trail shoulder. Vs pointing at your chin is a weak grip — the face arrives open, you instinctively swing left to compensate, and the over-the-top slice loop is born.',
      },
      {
        heading: 'Trail hand covers, never strangles',
        body: 'The trail hand grips in the fingers too, its lifeline covering the lead thumb. Pressure points: last three fingers of the lead hand, middle two of the trail hand. Thumbs and index fingers are passengers. Penick told students to hold the club like a small bird — firm enough that it can\'t fly away, soft enough that you don\'t hurt it.',
      },
      {
        heading: 'Make it permanent',
        body: 'A grip change feels horrendous for exactly two weeks. Re-grip 20 times a day at home — full routine, look, check the Vs, waggle. It takes about 300 reps before a new grip stops feeling like someone else\'s hands. Do not judge it by results on day one; judge it by ball flight in week three.',
      },
    ],
    mistakes: [
      { wrong: 'Grip dies in the palm of the lead hand', fix: 'Regrip with the club diagonal across the base of the fingers — you should be able to waggle freely with a soft wrist.' },
      { wrong: 'Strangling it at 9/10 pressure under pressure', fix: 'Tension is a handbrake on speed. Soft forearms at address; if your forearms burn after a range session, you\'re squeezing.' },
      { wrong: 'Strong grip but holding the face open anyway', fix: 'After strengthening the grip, let the face RELEASE. Expect a few hooks the first session — that\'s proof it\'s working.' },
    ],
    feels: [
      { feel: 'Feels like the club will hook 40 yards left', real: 'It flies straight — your old "straight" grip was open' },
      { feel: 'Holding a tube of toothpaste with no cap', real: 'Roughly 4/10 grip pressure, the tour standard' },
    ],
    checkpoints: [
      '2–3 knuckles visible on the lead hand',
      'Both Vs point at the trail shoulder',
      'Club sits in fingers — heel pad on top',
      'Forearms soft enough to waggle freely',
    ],
    proTip:
      'If you fight a slice, rotate both hands one centimeter clockwise (righty) and change NOTHING else. Don\'t try to square the face — the new grip does it. It will feel like you\'ll hook everything. You won\'t.',
    source: 'Ben Hogan, Five Lessons · Harvey Penick, Little Red Book',
    drillIds: ['start-line-gate', 'anti-slice-gate'],
  },
  {
    id: 'setup-posture',
    title: 'Setup: the swing before the swing',
    category: 'full-swing',
    level: 'beginner',
    minutes: 9,
    summary:
      'Tour players look identical at address because setup is the one part of golf with no moving parts — anyone can do it perfectly. Most amateur "swing flaws" are actually setup flaws playing themselves out.',
    whyItMatters:
      'Teachers report the majority of recurring ball-flight problems trace to address: aim, ball position, posture and balance. A swing can only redeem a bad setup with compensations — and compensations need timing, and timing leaves on the back nine. Setup is free strokes for the price of a checklist.',
    keys: [
      'Hinge from the hips, flat back, arms hang straight down',
      'Ball position: wedges center, driver off the lead heel — everything else in between',
      'Weight on the balls of the feet, athletic and springy',
      'Aim the FACE first, then build your stance around it',
    ],
    steps: [
      {
        heading: 'Build it the same way every time',
        body: 'Stand behind the ball, pick the target line, pick an intermediate spot a foot ahead of the ball on that line. Walk in, set the clubface behind the ball aiming at that spot FIRST, then arrange your feet, hips and shoulders parallel to the face line — like railroad tracks, your body on the inner rail. Amateurs aim the body at the target and the face ends up nowhere.',
      },
      {
        heading: 'The athletic hinge',
        body: 'Stand tall, club out in front. Push your backside out and hinge from the hip sockets until the club touches the ground, adding a small knee flex. Back stays flat, chin up off the chest so the lead shoulder has room to turn under. Arms hang straight down from the shoulders — if your hands are jammed close or reaching, the distance to the ball is wrong, not your arms.',
      },
      {
        heading: 'Ball position ladder',
        body: 'Sand wedge: dead center. Mid-irons: one ball forward of center. Hybrids/fairway woods: two balls forward. Driver: off the lead heel. One rule builds the whole ladder: the longer the club, the more the bottom of the arc moves toward the target. Most chronic fat/thin contact is just ball position drift.',
      },
      {
        heading: 'Pressure and posture check',
        body: 'Weight 50/50 between feet and on the balls of the feet — someone should be able to nudge you forward, not backward, without you tipping. With irons, hands hang slightly ahead of the ball; with driver, level. Film yourself from down-the-line once a month: shaft at address should roughly bisect your trail forearm.',
      },
    ],
    mistakes: [
      { wrong: 'Aiming the body at the target (face goes right)', fix: 'Face first at an intermediate spot, then body parallel left of target. Trust the railroad tracks even when it feels closed.' },
      { wrong: 'C-posture: rounded back, chin buried', fix: 'Chest proud, chin up two inches. The lead shoulder needs a tunnel to turn through.' },
      { wrong: 'Ball creeps back "to make sure I hit it"', fix: 'Lay an alignment stick perpendicular to your line at the proper position each range session. The creep is invisible day-to-day and deadly month-to-month.' },
    ],
    feels: [
      { feel: 'Backside pushed out like sitting on a tall stool', real: 'A neutral hip hinge of about 30 degrees' },
      { feel: 'Body aims well left of where you\'re hitting it', real: 'Parallel — the face aims at the target, you don\'t' },
    ],
    checkpoints: [
      'Intermediate spot picked before walking in',
      'Clubface set FIRST, body second',
      'Arms hanging plumb under shoulders',
      'Ball position matches the club\'s ladder spot',
    ],
    proTip:
      'Build a 10-second setup routine and run it on EVERY range ball. The range is where routines are built — if you only use it on the course, it isn\'t a routine, it\'s a costume.',
    source: 'Ben Hogan, Five Lessons · modern force-plate setup research',
    drillIds: ['start-line-gate', 'head-station'],
  },
  {
    id: 'rotation-engine',
    title: 'Turn, don\'t sway: the rotation engine',
    category: 'full-swing',
    level: 'intermediate',
    minutes: 10,
    summary:
      'Amateurs slide; tour players rotate. A centered coil stores energy and keeps the low point of the swing in one predictable place — which is the entire secret of consistent contact.',
    whyItMatters:
      '3D motion studies show high-handicappers sway off the ball 3–4× more than tour players. Every inch of lateral slide moves your low point an inch — and a wandering low point is why the same swing produces a flushed 7-iron, then a chunk, then a thin. Fix the pivot and "inconsistency" largely disappears.',
    keys: [
      'Trail hip turns BEHIND you, never away from the target',
      'Pressure loads into the trail heel — not the outside of the foot',
      'Lead shoulder turns down and behind the ball',
      'Downswing order: ground → hips → chest → arms → club',
    ],
    steps: [
      {
        heading: 'Find your post',
        body: 'The trail leg is the axle. At address feel 55% pressure on the inside of the trail foot. Going back, the trail knee KEEPS its flex while the hips rotate around it — like a screw turning into the ground, not a door sliding on a rail. If your head drifts more than a few inches (the Swing Studio measures this), the axle is leaking.',
      },
      {
        heading: 'Coil to a real top',
        body: 'Turn until the lead shoulder is behind the ball and your back faces the target — roughly 90° of shoulder turn against 45° of hip turn. That differential IS the power. Short turns force the arms to lift alone, and lifted arms come down over the top. If flexibility limits you, let the lead heel rise; a full turn with a lifted heel beats a short turn with a planted one every time.',
      },
      {
        heading: 'Sequence the downswing',
        body: 'From the top, the first move is pressure smashing into the lead foot — force-plate data shows tour players shift before the club finishes going back. Then hips open, chest follows, arms drop, club releases last. Kinematic-sequence graphs of every long hitter on earth show this identical order. The ball doesn\'t care how hard you swing; it cares what arrives in what order.',
      },
      {
        heading: 'Finish in balance',
        body: 'Belt buckle at the target, trail foot vertical on its toe, 90%+ pressure on the lead leg, hold for three seconds. A held finish isn\'t posing — it\'s the receipt. If you can\'t hold it, the sequence broke somewhere upstream.',
      },
    ],
    mistakes: [
      { wrong: 'Hips slide away from the target going back', fix: 'Wall drill: trail glute brushes a wall at address and stays on it through the backswing. Turn into the wall, not along it.' },
      { wrong: 'Spinning the shoulders from the top (over the top)', fix: 'Feel the lead hip "bump" toward the target a beat before the chest unwinds. Step-through swings teach this automatically.' },
      { wrong: 'Reverse pivot — weight forward at the top, back at impact', fix: 'Let pressure genuinely load the trail heel by the top. If it never loads, it can\'t shift.' },
    ],
    feels: [
      { feel: 'Turning your back to the target inside a barrel', real: 'A centered 90° coil with under 2 inches of drift' },
      { feel: 'Downswing starts while the arms are still finishing the backswing', real: 'The tour-standard ground-first transition' },
    ],
    checkpoints: [
      'Trail knee keeps flex at the top',
      'Head moves less than a ball-width laterally',
      'Lead shoulder gets behind the ball',
      'Finish held 3 seconds, trail toe down',
    ],
    proTip:
      'Film yourself in the Swing Studio — the analyzer measures hip sway as a percentage of hip width. Under 15% is tour-grade. Most players who "need more power" actually need less slide.',
    source: 'Kinematic-sequence research · Swing Studio sway metrics',
    drillIds: ['wall-hip-drill', 'cross-arm-turns', 'step-through'],
  },
  {
    id: 'tempo-transition',
    title: 'Tempo: the 3-to-1 fingerprint',
    category: 'full-swing',
    level: 'intermediate',
    minutes: 8,
    summary:
      'Frame-by-frame analysis of tour broadcasts found something eerie: nearly every elite player, fast or slow, swings at a 3:1 ratio — three counts back, one count down. Amateurs average closer to 2:1 because the transition panics.',
    whyItMatters:
      'Tour Tempo\'s film study measured pros at ~0.75–1.0 seconds back and a quarter of that down, regardless of style. Rushed transitions throw the club over the top, open the face, and cost both speed AND direction. Tempo is also the most pressure-proof fix in golf: ratios survive nerves better than positions do.',
    keys: [
      'Three counts back, one count down — whatever your speed',
      'The backswing finishes before the downswing starts',
      'Speed lives at the BALL, never at the top',
      'Smooth is not slow: tour "smooth" is violently fast at impact',
    ],
    steps: [
      {
        heading: 'Hear your ratio',
        body: 'Say "one-two-three" from takeaway to the top, "ONE" down to impact — out loud at first. If you can\'t fit three counts in, your backswing is snatched; if the down-count starts before three, your transition is stealing. The Swing Studio measures your actual ratio from video — most amateurs are shocked to see 1.8:1.',
      },
      {
        heading: 'Train the pause',
        body: 'Hit 20 balls with a full one-second stop at the top, then swing through at full commitment. It feels powerless; the ball flies almost stock distance. The lesson: the top of the swing contributes nothing — it\'s a waypoint, not a launchpad. Once the pause feels normal, shrink it to a beat.',
      },
      {
        heading: 'Let gravity start the down',
        body: 'From the top, the first feeling is the arms FALLING while the lower body shifts — not the shoulders firing. Think of cracking a whip: the handle slows so the tip can accelerate. Casting from the top is using the whip backwards.',
      },
      {
        heading: 'Pressure-proof it',
        body: 'Under adrenaline everything quickens, so anchor the ratio to breath: inhale to the top, exhale through the strike. On the course, when a swing feels "quick," the fix is never to swing slower — it\'s to finish the backswing.',
      },
    ],
    mistakes: [
      { wrong: 'Snatching the takeaway ("fast back = far")', fix: 'First 18 inches of the takeaway in slow motion — low, wide and unhurried. Distance comes from sequence, not hurry.' },
      { wrong: 'Downswing starts before the backswing ends', fix: 'Pause drill, 20 balls a session for two weeks. Verify the ratio on video after.' },
      { wrong: '"Swing slow" advice making everything mushy', fix: 'Keep the down-count aggressive. 3:1 means a LONG back count, not a lazy strike.' },
    ],
    feels: [
      { feel: 'Waiting so long at the top it feels like a layup', real: 'A standard tour transition (~0.25s)' },
      { feel: 'The club falls before you swing it', real: 'Gravity-assisted shallowing — the anti over-the-top move' },
    ],
    checkpoints: [
      '"One-two-three / one" fits your swing',
      'Pause swings fly within 10 yards of stock',
      'Studio-measured ratio between 2.6 and 3.4',
      'Same count holds with driver and wedge',
    ],
    proTip:
      'Pick your ratio off a metronome app: 72 bpm — three clicks back, strike on the fourth. Two range sessions with a metronome rebuilds tempo faster than a month of swing thoughts.',
    source: 'John Novosel, Tour Tempo (frame-count study)',
    drillIds: ['tempo-track', 'pause-drill'],
  },

  // ════════════════════════════════ DRIVING ══════════════════════════════
  {
    id: 'driver-launch',
    title: 'Driver: hit up, launch high, spin low',
    category: 'driving',
    level: 'intermediate',
    minutes: 9,
    summary:
      'The driver is the only club in the bag designed to be struck on the upswing. Launch-monitor data is unambiguous: at amateur speeds, hitting up 4–5° instead of down 2° adds 20+ yards with the identical swing.',
    whyItMatters:
      'At 90 mph of club speed, optimal numbers are roughly 13–16° launch with ~2300 rpm of spin. The average amateur launches at 10° with 3300 rpm — a high-spin balloon that climbs, stalls and drops. Trackman-style studies put the attack-angle fix alone at 15–25 yards, and Broadie\'s data shows distance off the tee gains more strokes than accuracy for almost every handicap.',
    keys: [
      'Ball off the lead heel, tee high — half the ball above the crown',
      'Spine tilted away from the target at address (trail shoulder low)',
      'Strike UP: the ball is hit after the arc bottoms out',
      'Tee shots are 80% swings — dispersion beats ego',
    ],
    steps: [
      {
        heading: 'Build the launch-pad setup',
        body: 'Stance two inches wider than shoulders, ball off the lead heel, tee tall. Now the key: drop the trail shoulder so the spine tilts 5–10° away from the target, hands level with the ball (not pressed forward like an iron). This presets an upward strike — you don\'t have to "try" to hit up, the geometry does it.',
      },
      {
        heading: 'Sweep the skateboard ramp',
        body: 'With the ball forward, the clubhead reaches it AFTER the lowest point of the arc — already traveling upward. Picture the ball sitting at the start of an upward ramp and the clubhead riding the ramp through it. If you take turf or scuff the ground with driver, the bottom of your arc is too far forward — usually a slide, not an arm problem.',
      },
      {
        heading: 'Pick a side, never the middle',
        body: 'Aim down the side of the fairway that protects your miss: a slicer aims down the left edge and lets the ball work back. Aiming down the middle splits your dispersion pattern across BOTH trouble lines. The Play tab caddie computes this with your real shot pattern against the actual hazard polygons — trust its line.',
      },
      {
        heading: 'The 80% governor',
        body: 'Test it yourself on a range: ten balls at 100%, ten at 80%. Typical result — the 80% swings lose 7 yards of carry and gain 30% tighter dispersion. On any hole where trouble is in play, the smooth swing is the long game.',
      },
    ],
    mistakes: [
      { wrong: 'Teeing low and "trapping" the driver like an iron', fix: 'Tee it so half the ball rides above the crown and move it to the lead heel. The driver is not a 3-iron with a big head.' },
      { wrong: 'Chasing swing speed with a longer, wilder action', fix: 'Speed comes from sequence and a full turn, not a longer arm swing. Fix attack angle first — it\'s free.' },
      { wrong: 'Lunging at it — chest ahead of the ball at impact', fix: 'Keep the head BEHIND the ball through the strike. Feel like the chest stays back while the hips fire.' },
    ],
    feels: [
      { feel: 'Hitting the ball at the start of an uphill skateboard ramp', real: '+4° attack angle, the optimal-launch move' },
      { feel: 'Swinging at 80% with a smooth top', real: 'Maybe 3–5 mph slower, with double the fairways' },
    ],
    checkpoints: [
      'Half the ball above the crown at address',
      'Spine tilts away from target, hands level',
      'Tee marks untouched — no scuffs in front',
      'Aimed at an EDGE, letting the shape work back',
    ],
    proTip:
      'Grip down half an inch on tight holes. Average cost is about 7 yards; average dispersion gain is 30%. That trade wins money matches for the rest of your life.',
    source: 'Launch-monitor optimization data · Mark Broadie, Every Shot Counts',
    drillIds: ['anti-slice-gate', 'pressure-fairway', 'three-ball-dispersion'],
  },

  // ════════════════════════════════ IRONS ════════════════════════════════
  {
    id: 'iron-compression',
    title: 'Compress your irons: ball first, turf second',
    category: 'irons',
    level: 'intermediate',
    minutes: 10,
    summary:
      'The single clearest line between single-digit players and everyone else is where the club bottoms out. Tour players bottom out 4 inches IN FRONT of the ball. Most amateurs bottom out behind it — and live in the fat/thin lottery.',
    whyItMatters:
      'Strokes-gained data says approach play is the biggest scoring separator in golf — bigger than putting. And approach quality is mostly strike. A 7-iron struck pure flies a club and a half longer than the same swing caught slightly fat. You don\'t need a better swing to hit greens; you need the same swing to bottom out in the same place.',
    keys: [
      'Divot (or brush) starts AFTER the ball, pointing at the target',
      'Hands lead the clubhead through impact — shaft lean',
      '80% of pressure on the lead foot at the strike',
      'Hit DOWN to make the ball go UP — loft does the lifting',
    ],
    steps: [
      {
        heading: 'Understand the low point',
        body: 'The swing arc bottoms out roughly below your lead shoulder. Hang back on the trail side and the arc bottoms behind the ball — now only perfect timing saves you: a little early is fat, a little late is thin. The fix is never "keep your head down"; it\'s moving the arc forward with pressure shift.',
      },
      {
        heading: 'The towel test',
        body: 'Pelz-style constraint practice: lay a towel one grip-length behind the ball and hit half shots without touching it. It is physically impossible to clip the towel if your pressure moves forward — so your body solves the problem without a single mechanical thought. Ten minutes, twice a week, for a month rewires contact.',
      },
      {
        heading: 'Trap it with the chest',
        body: 'Through impact, feel the chest "covering" the ball — like keeping it under a low ceiling — with hands leading the clubhead. A forward-leaning shaft delofts the club, which is why a compressed 8-iron flies like a stock 7. The scoop instinct ("help it up") adds loft, costs a club of distance and produces the thin-fat coin flip.',
      },
      {
        heading: 'Read your receipts',
        body: 'Divots are data. Starting at or after the ball, pointing at the target, dollar-bill shallow: perfect. Starting behind: pressure shift is late. Pointing left: over the top. Deep trenches: too steep, usually from a slide. After every range session, read your last five divots like a launch monitor.',
      },
    ],
    mistakes: [
      { wrong: 'Trying to lift the ball ("scooping")', fix: 'The 8-iron has 35° of loft — it needs zero help. Strike down and let the ball climb the face.' },
      { wrong: 'Ball too far back "for clean contact"', fix: 'Back ball positions produce low spinners and deep divots. Mid-irons go one ball forward of center; fix the strike with pressure, not position.' },
      { wrong: 'Keeping weight back to "stay behind it"', fix: '"Behind it" is for driver. Irons want 80% lead-side at impact. They are different swings bottoming out in different places.' },
    ],
    feels: [
      { feel: 'Hitting the ball at the bottom of the H of your follow-through', real: 'Low point 4 inches ahead of the ball' },
      { feel: 'Covering the ball with your chest like a table over it', real: 'Maintained spine angle plus forward shaft lean' },
    ],
    checkpoints: [
      'Divot starts at or after the ball',
      'Towel drill: 8 of 10 clean',
      'Ball flight starts lower than your old "helped" shots',
      'A stock 8-iron now carries your old 7-iron number',
    ],
    proTip:
      'On the course, take one more club than the yardage says, swing at 90%, and aim for the BACK of the ball. Tour players hit "extra club, smooth" all day — amateurs hit "perfect club, maximum" and come up short 70% of the time.',
    source: 'Dave Pelz constraint-practice research · Mark Broadie, Every Shot Counts',
    drillIds: ['low-point-towel', 'carry-ladder-7i'],
  },
  {
    id: 'uneven-lies',
    title: 'Uneven lies: the four slopes, solved',
    category: 'irons',
    level: 'advanced',
    minutes: 9,
    summary:
      'Golf courses aren\'t driving ranges — almost no full shot on a real course comes from a flat lie. Each of the four slope types pushes your ball a predictable direction, and the adjustments fit on a sticky note.',
    whyItMatters:
      'Mishits from slopes are mostly forecasting errors, not contact errors: the ball was always going to curve off the hill, and the player aimed as if it wasn\'t. Knowing the four biases turns "random" misses into planned-for shots — worth a couple of strokes any round on rolling terrain.',
    keys: [
      'Ball above feet → flies LEFT (flatter lie = closing face)',
      'Ball below feet → flies RIGHT (and thin is the miss)',
      'Uphill → adds loft, flies HIGH and short — take more club',
      'Downhill → delofts, flies LOW and hot — take less and allow run',
    ],
    steps: [
      {
        heading: 'The master rule: match the slope',
        body: 'Shoulders parallel to the hillside, weight centered on the slope, and swing WITH the hill — uphill lies finish high, downhill lies chase down the slope. Fighting the hill for a "normal" swing is how you blade one across the green. The hill always wins; your job is to join it.',
      },
      {
        heading: 'Side-hill lies: aim off and commit',
        body: 'Ball above your feet: the lie angle aims the face left and the flatter swing adds draw — aim right of target proportionally to the slope (a foot above your feet ≈ 10–15 yards of left). Ball below your feet: everything reverses, plus the extra reach raises thin risk — flex more, hold the bend, aim left, expect a fade.',
      },
      {
        heading: 'Up and down the hill: club math',
        body: 'Uphill adds effective loft: a 7-iron plays like an 8 — take one more club per "shoe-visible" degree of slope, and remember uphill shots also fly higher into wind. Downhill subtracts loft: a 7 plays like a 6 that comes out low and runs — take less club, land it short, let it release.',
      },
      {
        heading: 'Tempo is the tax',
        body: 'Every slope shot is an 80% swing. Balance is the first casualty on a hillside, and a full-speed swing from a side-hill lie is a balance test you will fail. Grip down an inch, widen the stance a touch, swing smooth, and walk off with your par.',
      },
    ],
    mistakes: [
      { wrong: 'Aiming at the flag from a side-hill lie', fix: 'Pre-aim for the slope\'s curve. The hill\'s spin is physics, not a maybe.' },
      { wrong: 'Leaning into the hill to "stay level"', fix: 'Match your shoulders to the slope. Level shoulders on a slope means digging in or blading out.' },
      { wrong: 'Full-speed swings from sloped stances', fix: 'One extra club, 80% effort, balanced finish. Slopes punish ambition more than any bunker.' },
    ],
    feels: [
      { feel: 'Swinging "up the ramp" on uphill lies', real: 'Clubhead tracking the slope — clean contact, higher flight' },
      { feel: 'Sitting into your heels with extra knee bend below your feet', real: 'Maintained posture that stops the thin' },
    ],
    checkpoints: [
      'Shoulders match the hillside before the waggle',
      'Aim adjusted before the club is chosen',
      'One extra club uphill, one less downhill',
      'Finish balanced — no stumble step',
    ],
    proTip:
      'On any awkward slope, the play with the highest expected value is usually the fat part of the green or even the front fringe. Slopes multiply dispersion — shrink the ambition, not just the swing.',
    source: 'Classic caddie heuristics, validated by launch-monitor lie-angle data',
    drillIds: ['uneven-lies', 'punch-wind'],
  },

  // ════════════════════════════════ SHORT GAME ═══════════════════════════
  {
    id: 'wedge-clock',
    title: 'The clock system: own every yardage inside 120',
    category: 'short-game',
    level: 'intermediate',
    minutes: 12,
    summary:
      'Pelz\'s research made it famous and tour bags still run on it: three backswing lengths across three wedges produce nine exact stock numbers. Pros don\'t "feel" a 67-yard shot — they pull a calibrated swing.',
    whyItMatters:
      'From 50–120 yards, tour players hit it inside 18 feet on average; amateurs average 45+ feet, and the gap is mostly DISTANCE error, not direction. Strokes-gained data shows the scoring zone is where rounds are made. Nine known carries replace guesswork with arithmetic — the single fastest way to turn three-shot holes into two-shot holes.',
    keys: [
      'Three arm positions: 9 o\'clock, 10:30, full — same tempo each',
      'Body rotates through EVERY shot; arms-only is chunk city',
      'Know your nine carry numbers cold — write them down',
      'Pick a landing number, not a vague target',
    ],
    steps: [
      {
        heading: 'Calibrate the matrix',
        body: 'Range session with one job: 5 balls per position per wedge (PW, GW/52°, SW/56°). Lead arm to 9 o\'clock, to 10:30, then full — identical tempo, full rotation through each. Log carries in the Range tab; the median IS your number. You now own nine yardages. Write them on a card for your bag and re-verify monthly.',
      },
      {
        heading: 'Shorter swing ≠ softer swing',
        body: 'The 9 o\'clock shot is a SHORTER swing at full commitment, never a full swing at 60% effort. Deceleration is the number-one wedge killer — it dumps the club behind the ball or blades it across the green. Abbreviate the backswing; keep the through-swing aggressive and turning.',
      },
      {
        heading: 'On-course arithmetic',
        body: '78 to the pin? That\'s your 10:30 sand wedge (or whatever your card says). The thinking is done before the club comes out — which is exactly why it holds up under pressure. Between numbers: take the longer swing and grip down an inch, which removes about 5 yards without changing anything else.',
      },
      {
        heading: 'Flight windows',
        body: 'Once the nine numbers are solid, add trajectory: ball back one inch turns any clock swing into a flighted spinner for wind; ball forward adds height for tucked pins. Same clock, same numbers, two extra windows — that\'s 27 shots from three swings.',
      },
    ],
    mistakes: [
      { wrong: 'One wedge, infinite "feel" swings', fix: 'Feel drifts day to day; calibration doesn\'t. Build the matrix and let feel handle the last 3 yards, not all 80.' },
      { wrong: 'Arms-only partial swings', fix: 'The chest rotates through every clock position. Quiet body + active arms = fat. Active body + passive arms = struck.' },
      { wrong: 'Decelerating short swings to "take something off"', fix: 'Take distance off with a SHORTER backswing, never a slower downswing.' },
    ],
    feels: [
      { feel: 'Lead arm stops at a clock number and the body finishes the shot', real: 'Calibrated partial swing with full rotation' },
      { feel: 'Gripping down "shrinks the club"', real: '≈5 yards off any number, same swing' },
    ],
    checkpoints: [
      'Nine carry numbers written down',
      'Same count/tempo at all three positions',
      'Carry spread per position under ±4 yards',
      'No deceleration — finish faces the target',
    ],
    proTip:
      'Your most important number is the 9 o\'clock sand wedge — it covers the awkward 40–60 yard "half shot" zone that wrecks amateur cards. Hit ten of them every single range visit.',
    source: 'Dave Pelz, Short Game Bible · tour proximity data',
    drillIds: ['wedge-matrix', 'up-down-scramble'],
  },
  {
    id: 'greenside-system',
    title: 'One chip motion, four trajectories',
    category: 'short-game',
    level: 'beginner',
    minutes: 9,
    summary:
      'Most amateurs own six chipping techniques that all break under pressure. The fix is one reliable motion where only the SETUP changes — ball position and face angle dial the trajectory while the swing stays identical.',
    whyItMatters:
      'Tour players get up and down from the fringe about 85% of the time; 15-handicaps sit near 30%. The difference isn\'t talent — it\'s that pros eliminate variables. One motion with four setups means every greenside shot is a rehearsed shot, and rehearsed shots survive the first tee jitters.',
    keys: [
      'Narrow stance, weight 60% lead and STAYS there',
      'Ball back = low runner · ball forward + face open = high floater',
      'Shoulders rock, chest turns through, wrists stay quiet',
      'Land on the green as early as possible, run to the hole',
    ],
    steps: [
      {
        heading: 'The base motion',
        body: 'Feet close together, ball center, shaft near vertical, weight favoring the lead side and never shifting. Rock the shoulders and turn the chest through — the hands stay passive, the club brushes the grass where your sternum points. No wrist flip, no help. It\'s a putt with loft.',
      },
      {
        heading: 'The trajectory dial',
        body: 'Same motion, four shots: ball back two inches = a bullet that lands early and releases. Ball center = standard. Ball forward = higher, softer. Ball forward + face open two degrees = the floater. You never change the SWING — pressure can\'t break what doesn\'t move.',
      },
      {
        heading: 'Pick the landing spot first',
        body: 'Walk onto the green and find the flat spot 2–3 paces past the fringe. THAT is your target — never the flag. Then choose the club whose rollout finishes at the hole. Pros pick the landing spot first and the club second; amateurs pick the lob wedge first and hope second.',
      },
      {
        heading: 'The carry-to-roll table',
        body: 'From a clean lie with the ball-back chip: PW flies 1/3 and rolls 2/3. An 8-iron: 1/4 fly, 3/4 roll. Sand wedge: 1/2 and 1/2. Learn three ratios and every chip becomes arithmetic — land it on your spot and the ratio does the rest. Pace off the numbers; don\'t eyeball them.',
      },
    ],
    mistakes: [
      { wrong: 'Flipping the wrists to lift the ball', fix: 'Loft is in the club. Lead wrist stays flat through the strike — finish with the club low and pointing at the target.' },
      { wrong: 'Lob wedge for everything', fix: 'The highest-lofted club has the smallest margin. Use the LEAST loft that still lands on the green.' },
      { wrong: 'Weight rocking back to "help it up"', fix: '60% lead at address, 60% lead at the finish. The chip has no weight shift to break.' },
    ],
    feels: [
      { feel: 'Putting stroke with a wedge', real: 'A shoulders-and-chest chip with quiet hands' },
      { feel: 'The chest carries the club through', real: 'Rotation keeping the low point steady — no chunks' },
    ],
    checkpoints: [
      'Landing spot chosen before the club',
      'Weight never leaves the lead side',
      'Lead wrist flat at the finish',
      'Lowest-lofted club that works got the call',
    ],
    proTip:
      'When you short-side yourself, par is the ceiling — play for the 8-footer, not the hero pin. The math on short-side flop shots is brutal: even tour players bail to the fat side.',
    source: 'Dave Pelz carry/roll ratios · tour scrambling data',
    drillIds: ['up-down-scramble'],
  },
  {
    id: 'bunker-play',
    title: 'Bunkers: the only shot where you miss on purpose',
    category: 'short-game',
    level: 'intermediate',
    minutes: 10,
    summary:
      'The greenside bunker shot is the one swing in golf where you\'re SUPPOSED to hit behind the ball — the club never touches it. Once that clicks, the most feared shot in amateur golf becomes one of the most repeatable.',
    whyItMatters:
      'Tour players get up and down from sand ~50% of the time and hit the green from greenside bunkers over 90% — because the sand shot has the biggest margin for error in golf: anywhere from 1 to 3 inches behind the ball works. Amateurs fail not from bad technique but from trying to pick it clean, where the margin is zero.',
    keys: [
      'Open the face FIRST, then take your grip',
      'Strike the sand 2 inches behind the ball — a splash, not a dig',
      'Speed is your friend: the sand eats most of it',
      'Finish FULL — deceleration leaves it in the bunker',
    ],
    steps: [
      {
        heading: 'Use the bounce, not the edge',
        body: 'The sand wedge\'s sole has bounce — a keel that makes the club skim through sand instead of digging. Open the face 20–30° BEFORE gripping (open then re-grip, never twist your hands), and the bounce is in play. A square face digs; a dug club stops dead and so does the ball, two feet in front of you.',
      },
      {
        heading: 'Set up to splash',
        body: 'Feet shuffled in for stability, ball forward of center, weight 60% lead, face open, aim slightly left of target (the open face pushes it right). Hover your eyes on a spot 2 inches behind the ball — that spot is your strike target. The ball is none of your business.',
      },
      {
        heading: 'Splash a dollar bill',
        body: 'Imagine the ball sitting on a dollar bill. Your job: splash the whole bill out of the bunker — enter at the back edge, exit past the front. Full wrist hinge going back, aggressive splash through, full finish with the chest facing the target. The ball rides out on a cushion of sand.',
      },
      {
        heading: 'Distance control',
        body: 'Same splash, three dials: a longer follow-through carries it farther; more open face shortens it; sand entry point fine-tunes (closer to the ball = more spin and carry). Practice 10/20/30-foot splashes from the same setup before you ever change the swing itself.',
      },
    ],
    mistakes: [
      { wrong: 'Trying to pick the ball clean', fix: 'Commit to hitting the sand. Two inches behind, every time — the margin is the whole point of the shot.' },
      { wrong: 'Decelerating into the sand ("don\'t skull it")', fix: 'Sand absorbs ~70% of the energy. Swing at a 40-yard-shot speed for a 10-yard splash, and FINISH.' },
      { wrong: 'Square face digging the leading edge in', fix: 'Open the face until the club could balance a drink, then re-grip. Bounce first, always.' },
    ],
    feels: [
      { feel: 'Throwing a scoop of sand onto the green', real: 'Perfect splash — the ball just comes along' },
      { feel: 'Swinging twice as hard as the distance suggests', real: 'Correct speed for sand resistance' },
    ],
    checkpoints: [
      'Face opened BEFORE gripping',
      'Feet shuffled into the sand',
      'Entry 2 inches behind the ball',
      'Full finish, chest at the target',
    ],
    proTip:
      'From good lies, long bunker shots (30–50 yards) are the hardest shot in golf even for pros — take your medicine and play to the fat of the green. From a fried-egg lie, square the face, dig it out and accept the run.',
    source: 'Classic Sarazen/Pelz bunker method · tour sand-save data',
    drillIds: ['up-down-scramble', 'wedge-matrix'],
  },

  // ════════════════════════════════ PUTTING ══════════════════════════════
  {
    id: 'putting-speed',
    title: 'Speed is 90% of putting',
    category: 'putting',
    level: 'beginner',
    minutes: 8,
    summary:
      'Pelz\'s lab found amateurs\' direction on long putts is usually fine — it\'s distance that misses by 10+ feet. Three-putts are speed errors wearing a line-error costume. Master pace and your worst putting day becomes a two-putt day.',
    whyItMatters:
      'The average 15-handicap three-putts 3–4 times a round; tour players, once every other round. From 40 feet, getting the SPEED right virtually guarantees two putts even with a mediocre line, while a perfect line with bad speed guarantees nothing. Pelz\'s optimal: every putt traveling fast enough to finish 12–18 inches past the cup.',
    keys: [
      'Every putt dies 12–18 inches past the hole — never short, never charging',
      'Backswing LENGTH controls distance; tempo never changes',
      'Eyes trace the line, brain computes pace — look at the hole on practice strokes',
      'Lag putts: think 3-foot circle, not cup',
    ],
    steps: [
      {
        heading: 'One tempo forever',
        body: 'The stroke is a pendulum: same beat on a 6-footer and a 60-footer, only the length changes. Count "one-two" — back on one, through on two — on every putt for the rest of your life. A 40-footer is a LONG smooth pendulum, never a faster one. When tempo is fixed, the brain only has to solve one variable: how far back.',
      },
      {
        heading: 'Calibrate with your eyes',
        body: 'Drop balls at 10, 20, 30, 40 feet. Putt each one while looking at the HOLE, not the ball. Your eye-to-hand distance computer is far better than your conscious mind — most players instantly lag inside 3 feet doing this. Then keep the calibration: two practice strokes looking at the hole before every real putt.',
      },
      {
        heading: 'Die it at the cup',
        body: 'A ball arriving at dying speed can fall in from the front edge, the sides, even toppling in the back door — the effective cup is full size. A ball charging at 3 feet past pace only catches dead center, and the lip-out becomes a 4-footer coming back. Aggressive putting is a leak dressed up as confidence.',
      },
      {
        heading: 'The 3-foot circle game',
        body: 'On lag putts, the hole is not the target — a 3-foot circle around it is. Ten lag putts from 35 feet: +1 inside the circle, +3 holed, −1 outside. Beat your score weekly. This one game has dropped more amateurs\' putts-per-round than any stroke lesson ever written.',
      },
    ],
    mistakes: [
      { wrong: 'Decelerating on short putts ("just tap it")', fix: 'Shorter backswing, accelerating through. A decelerating putter face wobbles open or shut at random.' },
      { wrong: 'Same length stroke, variable "hit"', fix: 'The hit is the enemy. Length back = distance. Build the ladder and trust it.' },
      { wrong: 'Reading break before judging speed', fix: 'Speed first, always — the right line at the wrong speed is the wrong line. Walk the putt off, feel the slope underfoot, THEN read.' },
    ],
    feels: [
      { feel: 'The putter swings itself on "one-two"', real: 'A tempo-stable pendulum with zero hit impulse' },
      { feel: 'Lagging to an imaginary hula hoop', real: '40-footers finishing inside 3 feet, three-putts gone' },
    ],
    checkpoints: [
      'Same "one-two" count on every length',
      '8 of 10 lags inside the 3-foot circle',
      'Misses finish 12–18 inches past — never short',
      'Pace checked on the practice green before every round',
    ],
    proTip:
      'Before any round, find the day\'s green speed with 5 putts to the fringe (no hole — pure distance). Greens vary more day-to-day than your stroke does; calibrate the surface, not the swing.',
    source: 'Dave Pelz, Putting Bible · make-percentage studies',
    drillIds: ['lag-ladder'],
  },
  {
    id: 'green-reading',
    title: 'Green reading: feet first, eyes second',
    category: 'putting',
    level: 'intermediate',
    minutes: 10,
    summary:
      'AimPoint changed tour putting by proving what surveyors knew: your feet sense slope more reliably than your eyes, which get fooled by grain, shadows and mowing lines. Feel the percent, do the math, pick a spot, putt at the spot.',
    whyItMatters:
      'Most amateurs under-read break — typical reads capture only two-thirds of the true amount, which is why "I pulled it" so often means "I read it thin." A systematic read based on slope percent removes the guess: same slope + same speed = same break, every single time. Pros pay for this system; your feet have it installed already.',
    keys: [
      'Straddle the line halfway to the hole and FEEL the tilt',
      'Calibrate: 1% barely perceptible · 2% clearly one foot lower · 3% you\'d notice walking',
      'Break scales with slope %, putt length and green speed',
      'Commit to a spot — then putt dead straight at it',
    ],
    steps: [
      {
        heading: 'Feel the percent',
        body: 'Stand astride your line about halfway to the hole, eyes closed for a beat. Which foot has more pressure? Barely tell = 1%. Obvious = 2%. You\'d notice it walking = 3%. Steeper than comfortable = 4%. That number drives everything. Your inner ear resolves slope better than your eyes ever will on a surface designed to deceive them.',
      },
      {
        heading: 'Scale it to break',
        body: 'Break grows with three things: slope percent, putt length and green speed. A 10-foot putt on 2% at medium speed breaks roughly half a cup outside the edge; double the length or the slope and the break roughly doubles; fast greens add half again. The Green Reader tool in this app does the exact arithmetic — use it until the numbers live in your head.',
      },
      {
        heading: 'Aim at a spot, not a curve',
        body: 'Convert the read into a SPOT: "two cups left of center" or "the edge of that old ball mark." Then forget the hole entirely and hit a dead-straight putt over your spot at your calibrated pace. Players who "see the curve" subconsciously steer; players who putt at spots release the blade.',
      },
      {
        heading: 'Uphill, downhill and the last 3 feet',
        body: 'Downhill putts break MORE (the ball travels slower longer, giving gravity more time) — and the reverse uphill. Most break happens near the hole where the ball is dying, so weight your read toward the last third of the putt. On short breakers, pick the high-side edge and never let a putt die below the cup: miss on the pro side.',
      },
    ],
    mistakes: [
      { wrong: 'Reading with eyes only from behind the ball', fix: 'Eyes get fooled by mow lines and surrounds. Feel with the feet first; use the eyes to confirm, not decide.' },
      { wrong: 'Under-reading and pulling toward the hole mid-stroke', fix: 'Trust the number. If you keep missing low, your reads are thin — add half a cup to everything for a round and watch.' },
      { wrong: 'Perfect read, no speed plan', fix: 'A read is only valid at one speed. Decide "dying at the hole" or "12 inches past" BEFORE finalizing the line.' },
    ],
    feels: [
      { feel: 'One foot clearly heavier when straddling the line', real: 'About 2% of slope — a full cup of break at 10 feet' },
      { feel: 'Putting dead straight at a spot beside the hole', real: 'The committed, unsteered release that holes breakers' },
    ],
    checkpoints: [
      'Slope felt with feet before every read',
      'Break converted to a concrete aim spot',
      'Speed decision made before the line decision',
      'Misses dying on the HIGH side',
    ],
    proTip:
      'Watch everyone else\'s putt like a hawk — especially putts on your line going the other way (they break mirror-opposite). The green tells you its secrets all day; most players are too busy with their phones to listen.',
    source: 'AimPoint Express methodology · Pelz break studies',
    drillIds: ['lag-ladder'],
  },

  // ═══════════════════════════ COURSE MANAGEMENT ═════════════════════════
  {
    id: 'course-iq',
    title: 'Course IQ: play the percentages',
    category: 'course-management',
    level: 'intermediate',
    minutes: 11,
    summary:
      'Broadie\'s strokes-gained research demolished golf\'s folk wisdom: amateurs don\'t lose to pros on the greens, they lose with decisions and approach play. A 15-handicap making tour-grade decisions saves 4–6 strokes a round with zero swing changes.',
    whyItMatters:
      'Every Shot Counts quantified it: "drive for show, putt for dough" is backwards — the long game explains about two-thirds of the scoring gap at every level. And the cheapest long-game upgrade is target selection, because your dispersion is what it is, but where you POINT it is a free choice you make 40 times a round.',
    keys: [
      'You don\'t hit shots, you hit PATTERNS — aim the whole ellipse',
      'The pin is a lie: center of the green is the play on 90% of approaches',
      'Bogey is never a disaster; double always is',
      'Lay up to a FULL-swing number, not "as close as possible"',
    ],
    steps: [
      {
        heading: 'Think in ellipses',
        body: 'Your shots land in an ellipse, not a point — a 15-handicap\'s 150-yard ellipse is roughly 25 yards wide and deep. The question is never "can I hit this shot?" (sometimes!) but "where does the WHOLE ellipse finish?" The GPS caddie in this app draws your actual ellipse on the actual hole and prices every target in expected strokes. If 20% of the ellipse is wet, the target is wrong — period.',
      },
      {
        heading: 'Expected-strokes arithmetic',
        body: 'From 160 in the fairway, an average golfer holes out in about 3.3 strokes. From 160 behind a tree: 4.1+. So punching out sideways "wastes" nothing — it converts a 4.1 position into a 3.4 position. Hero shots through gaps are negative-expected-value theater: the one-in-five miracle costs you four doubles to watch it once.',
      },
      {
        heading: 'Off the tee: trouble %, not distance',
        body: 'Driver is correct MOST of the time (distance gains real strokes) — except when the trouble percentage spikes. The rule: pick the longest club whose ellipse keeps penalty trouble under ~10%. On a par 4 under 380 with water, that\'s often a hybrid leaving a full wedge — which beats a wet driver by half a stroke every time you play the hole.',
      },
      {
        heading: 'Short-siding is the amateur tax',
        body: 'The worst place on any hole is pin-high in the rough on the pin\'s side — the short side — where even pros average under 50% up-and-down. Aim every approach so your MISS finishes on the fat side, putting or chipping with green to work with. Fat-side bogey putts beat short-side flop shots forever.',
      },
    ],
    mistakes: [
      { wrong: 'Firing at tucked pins with mid-irons', fix: 'Center of the green. From 150+, even tour players aim away from short-side pins. Your birdie putt from 30 feet beats your sand save attempt.' },
      { wrong: 'Laying up "as far as possible"', fix: 'Lay up to YOUR full-wedge number (say 95). A jammed 40-yard half shot is statistically worse than a stock 95 from the same hole.' },
      { wrong: 'Compounding: bad drive → hero recovery → double', fix: 'After a bad shot, the next decision is the round. Take the boring 30-second punch-out and cap the damage at bogey.' },
    ],
    feels: [
      { feel: 'Playing "scared" to the middle of every green', real: 'Tour-identical strategy — pros aim at maybe 3 pins a round' },
      { feel: 'Giving up on a par after a wild drive', real: 'Banking a stress-free bogey instead of a 30% double' },
    ],
    checkpoints: [
      'Target chosen for the whole ellipse, not the perfect shot',
      'No approach short-sided on purpose all round',
      'Layups to full-swing numbers',
      'Zero hero recoveries through gaps',
    ],
    proTip:
      'Play one round making ONLY center-of-green and fat-side decisions, tracked in this app. Most players card a personal-best week and never fully go back. The swing you already own is 4 strokes better than your decisions let it be.',
    source: 'Mark Broadie, Every Shot Counts · Scott Fawcett\'s DECADE concepts',
    drillIds: ['random-course-sim', 'punch-wind'],
  },
  {
    id: 'wind-play',
    title: 'Wind: flight it, don\'t fight it',
    category: 'course-management',
    level: 'advanced',
    minutes: 9,
    summary:
      'Wind doesn\'t just push the ball — it punishes spin. The harder you swing into a breeze, the more backspin you create, and the more the wind has to work with. The counter-intuitive truth: swing EASIER into wind.',
    whyItMatters:
      'Into a 20 mph wind, a full 9-iron can balloon and lose 40 yards; a smooth knock-down 7 from the same spot loses 12. Headwinds hurt roughly TWICE as much as tailwinds help (about 1% per mph into, 0.5% with), so wind management is asymmetric: protecting into the wind matters more than exploiting downwind. The app\'s plays-like numbers do this math on every shot.',
    keys: [
      'Into wind: take 2 more clubs and swing at 80% — never harder',
      'The knockdown: ball back, grip down, abbreviated finish',
      'Crosswind: ride it for distance, hold against it for accuracy',
      'Downwind approaches land HOT — plan the extra release',
    ],
    steps: [
      {
        heading: 'The knockdown, golf\'s best wind shot',
        body: 'Ball one inch back of normal, grip down an inch, one extra club minimum, swing 80% and finish with the hands low and chest at the target — a three-quarter "punch" finish. Less speed = less spin = a boring flight under the trouble. This single shot is worth three strokes on any windy day and it\'s built in one range session.',
      },
      {
        heading: 'Trust the decomposed numbers',
        body: 'A 12 mph wind at 40° off your line is NOT "about a club" — it\'s 9 mph into and 8 across, two separate corrections. The Play tab decomposes live wind onto your exact bearing and shows the plays-like number. Take it literally: 150 playing 164 means hit your 164 club smoothly. The grass-throw at shoulder height tells you surface wind — what the ball feels in its first 40 yards where the flight gets set.',
      },
      {
        heading: 'Crosswind decisions',
        body: 'Two options, two prices. RIDE it (draw with a right-to-left wind): adds distance, but the curve and wind multiply — bigger dispersion. HOLD against it (fade into that wind): costs ~5 yards, flies dead straight at the target. Scoring club in hand or trouble lurking: hold. Open driving hole: ride it and enjoy the bonus.',
      },
      {
        heading: 'Downwind is sneaky-hard',
        body: 'Tailwind knocks spin OFF the ball — it flies lower-spinning, lands hotter and releases hard. Downwind approaches need a landing zone short of the pin or a higher-lofted club that drops steeper. And downwind putts on fast greens: the wind is moving the ball too. The easy wind direction causes more airballs over the green than the hard one.',
      },
    ],
    mistakes: [
      { wrong: 'Swinging harder into the wind', fix: 'More speed = more spin = more balloon. Two clubs more, 80% effort, watch it bore.' },
      { wrong: 'One-club rule for all winds', fix: '1% per mph into, half that helping. A 20 mph headwind on a 150 shot is 30 yards — three clubs, not one.' },
      { wrong: 'Ignoring wind on the greens', fix: 'A 20+ mph wind moves putts and wobbles your stance. Widen your base and allow a cup on exposed greens.' },
    ],
    feels: [
      { feel: 'Swinging at 80% like a smooth practice swing', real: 'Lower spin, boring flight, MORE distance into wind than your full swing' },
      { feel: 'Finishing the swing pointing low at the target', real: 'The abbreviated knockdown finish that caps spin loft' },
    ],
    checkpoints: [
      'Grass throw at shoulder height before club choice',
      'Plays-like number used, not raw yardage',
      'Knockdown available on demand (ball back, grip down, 80%)',
      'Downwind landing zones planned short',
    ],
    proTip:
      'In a two-club wind, par is a great score and the field is shooting +6. The wind isn\'t beating you — it\'s beating everyone who fights it. Boring golf wins windy days.',
    source: 'Trackman wind-effect data · links caddie tradition',
    drillIds: ['punch-wind'],
  },
  {
    id: 'recovery-shots',
    title: 'Trouble shots: escape like a pro',
    category: 'course-management',
    level: 'intermediate',
    minutes: 8,
    summary:
      'Pros hit awful drives too — the difference is what happens next. Tour players treat recovery as a math problem with one rule: get back to a NUMBER you love, in one shot, with 95% certainty.',
    whyItMatters:
      'Broadie\'s data shows a single penalty or failed escape costs more than three mediocre-but-safe shots combined. The recovery decision is the highest-leverage 30 seconds in amateur golf: one disciplined punch-out converts a brewing triple into a tap-in bogey, dozens of times a season.',
    keys: [
      'First question: what\'s my 95% certain escape?',
      'Escape to a full-swing yardage, not "as far as possible"',
      'Trees: punch LOW — branches grow up, balls fly up',
      'Drop decisions are math: where does each option leave you?',
    ],
    steps: [
      {
        heading: 'The 10-second triage',
        body: 'At the ball, before ego arrives, ask in order: 1) Can I reach the green with 95% certainty? (Almost never — be honest about the gap, the lie, the branches.) 2) What punch-out leaves my favorite full wedge number? 3) Which direction has the most fairway? The first acceptable answer wins. Thirty extra seconds of triage, three strokes a round.',
      },
      {
        heading: 'The punch: golf\'s utility knife',
        body: 'Ball well back in the stance, 6- or 7-iron, hands ahead, half backswing, drive through low with a short finish. The ball leaves like a scared cat — under branches, through gaps, running forever. Practice ten punches every range session; it\'s the most-used "specialty" shot in real golf.',
      },
      {
        heading: 'Rough is a spin thief',
        body: 'From real rough, grass grabs the hosel and closes the face, and the ball comes out with no spin — flying lower, releasing harder, curving less. Take one MORE club, grip firmer with the lead hand, swing steeper, and plan for 20% more rollout. From deep rough: it\'s a wedge sideways, full stop. The lie sets the menu; you just order off it.',
      },
      {
        heading: 'Penalty drops are shot selection too',
        body: 'After a penalty, you usually have multiple drop options — back-on-the-line gives you ANY distance. Walk back to your full-wedge number instead of dropping at the nearest legal spot with an awkward 30-yard half shot over the same water that just ate you. The rules give you the choice; the scorecard rewards taking it.',
      },
    ],
    mistakes: [
      { wrong: 'The miracle 4-iron through a 3-foot gap', fix: 'You pull it off 1 in 5. The other 4 cost two shots each. That trade loses 7 strokes per 5 attempts — punch out.' },
      { wrong: 'Escaping to a random distance', fix: 'Aim the punch-out to your favorite number. 95 with a stock wedge beats 45 with a prayer.' },
      { wrong: 'Normal swing from deep rough', fix: 'The grass always wins. Extra club, steeper swing, conservative target — or wedge it back to the short stuff.' },
    ],
    feels: [
      { feel: 'Quitting on the hole by punching sideways', real: 'Converting a 5.1 expected-strokes position into 4.3 — the best shot you\'ll hit all day' },
      { feel: 'A chippy half-swing 7-iron', real: 'A 140-yard runner that never gets 10 feet off the ground' },
    ],
    checkpoints: [
      '95% rule applied before pulling a club',
      'Punch-out aimed at a full-swing number',
      'Extra club from any real rough',
      'No gap shots attempted all round',
    ],
    proTip:
      'Count your "disaster avoided" moments like birdies. Scorecards remember the holes where a punch-out saved bogey far longer than the one heroic 4-iron that found the green.',
    source: 'Mark Broadie, Every Shot Counts · tour caddie decision frameworks',
    drillIds: ['punch-wind', 'random-course-sim'],
  },

  // ════════════════════════════════ MENTAL ═══════════════════════════════
  {
    id: 'pressure-protocol',
    title: 'The pressure protocol',
    category: 'mental',
    level: 'intermediate',
    minutes: 7,
    summary:
      'Pressure doesn\'t break swings — it breaks routines, and the swing follows. Rotella\'s players win majors with the same boring loop on every shot: smallest target, one rehearsal, one look, go. Build the loop now, lean on it when your hands shake.',
    whyItMatters:
      'Under stress, heart rate climbs, grip pressure spikes and tempo quickens — every one of which you can pre-empt with routine, breath and a tempo anchor. Sports-psych research is consistent: pre-shot routines measurably reduce choking by giving the conscious mind a job so it stops micromanaging the swing.',
    keys: [
      'Same routine, same length, EVERY shot — range included',
      'Pick the smallest possible target (a branch, not "the fairway")',
      'Long exhale on the takeaway — tension can\'t survive it',
      'Bad shot? Ten steps of anger, then it\'s just data',
    ],
    steps: [
      {
        heading: 'Build the box',
        body: 'Behind the ball: see the shot, pick the smallest target you can name. One rehearsal swing FEELING the shot (not posing positions). Step in, set the face, one look at the target, go — under 12 seconds from step-in to takeaway. Slow players over the ball aren\'t being careful; they\'re giving doubt a microphone.',
      },
      {
        heading: 'The exhale trigger',
        body: 'Inhale stepping in; long exhale as the club starts back. A slow exhale activates the parasympathetic system — it is physiologically impossible to hold peak muscular tension on one. Tour players have used breath anchors for decades because they work when thoughts don\'t.',
      },
      {
        heading: 'Adrenaline math',
        body: 'Pumped up, you\'ll swing faster and the ball goes FARTHER — the classic pressure airmail. The fix is mechanical, not mental: one more club, 80% swing. Let adrenaline supply the missing 20%. Decide this on the walk to the ball, not over it.',
      },
      {
        heading: 'The 10-step rule',
        body: 'After a bad shot you get ten full steps of disgust — feel it honestly. At step ten it becomes data: the app logs the miss, the caddie adjusts, the round continues. Carrying anger into the next swing is how a double becomes a quad. Penick: the most important shot in golf is the next one.',
      },
    ],
    mistakes: [
      { wrong: 'Routine evaporates exactly when it matters', fix: 'If the routine only exists on calm days, it isn\'t a routine. Run it on EVERY range ball until it\'s the only way you know how to start a swing.' },
      { wrong: 'Aiming at "the fairway" or "the green"', fix: 'Small target, small miss. Pick the chimney, the branch, the dark patch — the brain steers toward whatever you name.' },
      { wrong: 'Swing thoughts multiplying over the ball', fix: 'One external thought maximum ("ball over the bunker\'s left edge"). Mechanics get fixed on the range; the course is for targets.' },
    ],
    feels: [
      { feel: 'A boring, identical 12 seconds before every shot', real: 'The exact armor pros wear on major Sundays' },
      { feel: 'Letting the shot go at step ten', real: 'A reset that protects the next swing from the last one' },
    ],
    checkpoints: [
      'Routine identical on range and course',
      'Named small target on every shot',
      'Exhale on every takeaway',
      'Anger expires at ten steps',
    ],
    proTip:
      'Your routine IS your clutch gene. Nobody is born good under pressure — they\'ve just rehearsed the moment so many times the body doesn\'t know it\'s supposed to panic.',
    source: 'Bob Rotella, Golf Is Not a Game of Perfect · Harvey Penick',
    drillIds: ['pressure-fairway'],
  },

  // ════════════════════════════════ PRACTICE ═════════════════════════════
  {
    id: 'practice-design',
    title: 'Practice that actually transfers',
    category: 'practice',
    level: 'intermediate',
    minutes: 9,
    summary:
      'Motor-learning research has a brutal verdict on the way most golfers practice: rake-and-hit with one club feels productive and transfers almost nothing. Random practice feels worse and transfers everything. Train ugly, play pretty.',
    whyItMatters:
      'Blocked practice (same club, same target, 30 balls) shows fast improvement DURING the session that evaporates on the course, because the course never asks the same question twice. Studies across sports show random/variable practice produces dramatically better retention. If your range game is miles better than your course game, this — not your swing — is the gap.',
    keys: [
      'Never two identical shots in a row (after warm-up)',
      'Full routine on every ball — the range builds habits, good or bad',
      'Play simulated holes: driver, then the approach the drive leaves',
      'Add pressure: games with scores, consequences and a result you record',
    ],
    steps: [
      {
        heading: 'The 20/60/20 session',
        body: 'First 20%: warm-up, blocked is fine — find contact and tempo with easy wedges. Middle 60%: RANDOM — different club, target and shot shape every single ball, full routine each time. Final 20%: pressure games with a recorded score (the Range tab tracks these). One hour like this beats three hours of raking 7-irons.',
      },
      {
        heading: 'Simulate the course',
        body: 'Play your home course on the range: driver to an imagined fairway, then whatever the "drive" leaves — 8-iron, pitch, knockdown. The Range tab\'s course-sim drill scores it. This is the only range practice where every shot asks a fresh question, exactly like Saturday morning will.',
      },
      {
        heading: 'Practice the shots golf actually asks',
        body: 'Chart a real round and count: maybe 13 full swings from perfect lies — and 25+ partial wedges, chips, bunker shots and putts under 40 feet. Now look at how the average bucket gets spent. Flip the ratio: half of every practice hour inside 100 yards. Boring, unphotogenic, and worth more handicap points than any driver session of your life.',
      },
      {
        heading: 'Make it hurt a little',
        body: 'Consequence is the transfer agent. Putt 18 holes where every 3-putt restarts the circuit. Chip until you hole out from three spots. Don\'t leave the wedge station until 7 of 10 land in the zone. The mild stress of a score is what teaches skills to show up when a real scorecard appears.',
      },
    ],
    mistakes: [
      { wrong: '30 7-irons in a row, feeling like a hero', fix: 'That\'s rhythm practice, not golf practice. After warm-up, change something every ball.' },
      { wrong: 'No target, no routine, just contact', fix: 'Every ball gets a named target and the full 12-second routine. You\'re not practicing the swing; you\'re practicing GOLF.' },
      { wrong: 'All practice time on the prettiest club', fix: 'Budget time by strokes-gained leaks (the Insights tab knows yours), not by what\'s fun to film.' },
    ],
    feels: [
      { feel: 'Range sessions feel harder and messier than before', real: 'Desirable difficulty — the signature of learning that sticks' },
      { feel: 'Fewer balls hit per hour', real: 'More decisions per hour, which is what golf is' },
    ],
    checkpoints: [
      'After warm-up, no repeated shot twice',
      'Full routine on every ball',
      'Half the session inside 100 yards',
      'At least one scored game per session',
    ],
    proTip:
      'End every session with one "walk-off" challenge — a single ball to a hard target where success ends practice and failure adds ten minutes of putting. One ball with stakes teaches more than fifty without.',
    source: 'Motor-learning research (blocked vs random) · Adam Young, The Practice Manual',
    drillIds: ['random-course-sim', 'pressure-fairway', 'wedge-matrix'],
  },
  {
    id: 'warmup-routine',
    title: 'The 25-minute pre-round warm-up',
    category: 'practice',
    level: 'beginner',
    minutes: 7,
    summary:
      'The first tee is the worst place to discover today\'s swing. A proper warm-up isn\'t practice — it\'s reconnaissance: find today\'s tempo, today\'s shot shape and today\'s green speed, then go play what you brought.',
    whyItMatters:
      'Amateurs play their worst golf in the first three holes by a wide margin — cold muscles, no tempo reference and zero green-speed data. A structured 25 minutes routinely saves 2–3 strokes on the front nine, which makes it the highest-ROI half hour in golf.',
    keys: [
      'Warm-up ≠ practice: zero swing fixes allowed',
      'Find today\'s shape and PLAY it — don\'t fight it',
      'Finish on the putting green calibrating speed',
      'Last ball before the tee: the exact first-tee shot, full routine',
    ],
    steps: [
      {
        heading: 'Minutes 0–5: wake the body',
        body: 'Before any ball: hip circles, leg swings, arm crossovers, ten slow rehearsal swings with two clubs held together. Then five gentle half-wedges just finding the middle of the face. The goal is blood flow and brushing the turf — nothing else is being judged yet.',
      },
      {
        heading: 'Minutes 5–15: climb the bag, read the day',
        body: 'Two balls each: 9-iron, 7-iron, 5-iron/hybrid, driver — full routine on every one. You\'re not grading them; you\'re COLLECTING: where\'s the strike, what\'s today\'s shape? If it\'s a fade day, today you play fades — the first tee is not a laboratory. Finish with two more easy wedges to bring tempo back down.',
      },
      {
        heading: 'Minutes 15–22: green reconnaissance',
        body: 'Five long lag putts to the fringe for pure speed calibration — greens vary day to day far more than your stroke does. Then six 3-footers around a hole to hear the ball drop (confidence is a sound). Two chips off the practice green\'s collar to read today\'s turf and rollout.',
      },
      {
        heading: 'Minutes 22–25: dress rehearsal',
        body: 'Last ball on the range: the EXACT first-tee shot — same club, same target picture, full 12-second routine, one swing. Walk to the tee with a decided shot already rehearsed. First-tee nerves hate a plan.',
      },
    ],
    mistakes: [
      { wrong: 'Emergency swing surgery 10 minutes before the round', fix: 'Whatever showed up is today\'s swing. Adjust targets, not mechanics — fixes live on Tuesday\'s range, not Saturday\'s tee.' },
      { wrong: 'Banging 40 drivers until something feels "on"', fix: 'Climb the bag with two balls per club. Volume tires you; information arms you.' },
      { wrong: 'Skipping the putting green', fix: 'Three-putting the first two holes costs more than any warm-up drive earns. Speed first, always.' },
    ],
    feels: [
      { feel: 'Collecting data instead of chasing perfect', real: 'A scouting report on today\'s golfer, ready by the first tee' },
      { feel: 'First tee shot already hit once on the range', real: 'A rehearsed motor pattern instead of a cold gamble' },
    ],
    checkpoints: [
      'Body moving before any full swing',
      'Today\'s shape identified and accepted',
      'Green speed calibrated with 5 lags',
      'First-tee shot rehearsed as the final ball',
    ],
    proTip:
      'No range available? Three minutes of dynamic stretching, ten slow two-club swings, and ten putts across the practice green for speed. That bare minimum still beats what most of your foursome did.',
    source: 'Tour player warm-up structures · first-tee scoring data',
    drillIds: ['tempo-track', 'lag-ladder'],
  },
]

export function getLesson(id: string): Lesson {
  return LESSONS.find((l) => l.id === id) ?? LESSONS[0]
}
