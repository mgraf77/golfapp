# TrueCaddie — Golf Intelligence

An all-in-one golf app: GPS rangefinder, AI caddie, shot tracker, swing
studio, handicap engine and practice coach in a single installable PWA.
No accounts, no API keys, no subscription — everything runs on your phone.

**Live:** https://golfapp-mu.vercel.app

## What it does

### 🛰 GPS rounds on real courses
- Search any real course (by name or near you) and **download it** —
  full hole geometry from OpenStreetMap: centerlines, greens, bunkers,
  water. Stored in IndexedDB, works offline (Arccos-style course files).
- **Satellite hole view** (Esri World Imagery) with live GPS position,
  front/center/back distances, draggable pin, tap-anywhere targets and
  carry/remaining measurements.
- **Auto-scorecard**: par, yardage and stroke index per hole from course
  data (estimated from geometry where untagged).
- Walk-it-off **shot tracking**: mark the strike, walk to the ball, tag
  the result — distance, lie and strokes-gained anchors are captured
  automatically. Auto hole-advance suggestions at the next tee.

### 🧠 The caddie
- **Live weather** (Open-Meteo): wind decomposed onto your exact shot
  bearing, temperature effects → honest *plays-like* numbers.
- **Expected-value targeting**: your dispersion ellipse (from your real
  logged shots) is Monte-Carlo sampled against the actual course
  polygons. The caddie recommends the lowest expected-strokes play and
  prices the aggressive line honestly next to it.
- **AR aim mode**: rear camera + compass — rotate until the line
  centers, see F/C/B and the club. Built as an isolated overlay layer
  (glasses-ready).

### 🎥 Swing Studio
- Record or import swings; slow-mo (0.1×–1×), frame stepping, coach ink
  (lines / circles / freehand).
- **On-device AI analysis** (MediaPipe pose, loaded on demand): tempo
  ratio vs the 3:1 benchmark, hip sway, head drift, early extension,
  shoulder turn — each fault mapped to a fix cue and prescribed drills.
- **Ball-flight tracer** (ShotTracer-style): tap the ball at a few
  frames, get an animated comet path, export it as a shareable clip.

### 📊 Scoring engine
- **True WHS handicap**: score differentials, best-8-of-20 with
  small-sample tables, soft/hard caps, net double bogey, course
  handicap. Rounds auto-post; manual scores supported.
- **Strokes gained** (Broadie baselines) per category — off the tee,
  approach, around the green, putting — exact for GPS-tracked rounds,
  estimated for card rounds. Round recaps say where the strokes
  actually went.

### 🏌️ Practice
- Range coach with goal-based sessions, drill prescriptions, live
  pattern feedback and practice scores.
- 19-drill library (including the swing-fault prescriptions) and a
  lesson playbook covering full swing, driving, wedges, putting,
  strategy, wind and the mental game.

## Stack

Vite + React + TypeScript + Tailwind v4 PWA. Leaflet (code-split) over
Esri World Imagery tiles. OpenStreetMap/Overpass course data (ODbL),
Open-Meteo weather, MediaPipe Tasks Vision for pose — all keyless.
State in localStorage; courses & swing videos in IndexedDB; the service
worker caches the app shell, visited satellite tiles and the last
weather read for offline rounds.

```
src/
  types/        domain model + geo types
  data/         clubs, demo courses, drills, lessons, seed
  lib/
    geo.ts             geodesy: distance/bearing/destination, wind vectors, GPS watcher
    overpass.ts        course search + download + OSM → GeoCourse parser
    idb.ts             IndexedDB stores (courses, swings, videos)
    weather.ts         Open-Meteo client
    caddieGeo.ts       plays-like + dispersion Monte-Carlo EV target optimizer
    strokesGained.ts   Broadie baselines, per-shot & per-round SG
    handicap.ts        WHS: differentials, best-8, caps, net double bogey
    swingAnalysis.ts   MediaPipe pose → tempo/sway/posture faults
    physicsEngine.ts / shotNormalization.ts / caddieEngine.ts / aiCoach.ts / insights.ts
  components/   CourseMap (Leaflet), ARCaddie, SwingPlayer (+tracer export), ui kit, charts
  screens/      Home, Play (hub + GPS round + card mode), Practice, Swing, Insights, Profile
```

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
npm run smoke    # SSR render smoke test across all screens
```

Deployed automatically by Vercel on push to `main`.

Course data © OpenStreetMap contributors (ODbL). Imagery © Esri/Maxar.
