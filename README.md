# TrueCaddie — Golf Intelligence PWA

**Know your real game.** TrueCaddie is a working prototype of an AI golf performance system: an on-course
AI caddie, a range coach that makes practice actually transfer, and a shot-intelligence engine that
converts raw shots into *normalized, true* performance numbers.

The core thesis: a 300-yard drive downhill, downwind, on firm turf is **not** a 300-yard driver swing —
and every recommendation in the app is built on the neutral number, not the flattering one.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run smoke    # engine + render smoke tests (no browser needed)
npm run preview  # serve the production build
```

Open on a phone (or in devtools mobile viewport) — the app is mobile-first, dark-mode, and installable
as a PWA (manifest + service worker + offline app shell).

## What's inside

| Area | What it does |
| --- | --- |
| **Onboarding** | Progressive cards: handicap, goals, common miss, shot shape, full bag with editable stock yardages. Skippable into seeded demo data. |
| **Home** | True Skill Index, top-3 weaknesses with strokes/round costs, club confidence ranking, AI summary, today's focus, practice plan generator, gapping warnings, install card. |
| **Play** | Course select (2 seeded courses, 9 believable holes each) with weather/condition controls → full simulated round: per-hole caddie advice (club, target, risk meter, safe vs aggressive strokes-gained tradeoff), shot entry (club/contact/shape/lie/wind/elevation/slope/outcome), AI feedback + normalization breakdown per shot, scoring, round recap. |
| **XR Caddie View** | Simulated AR overlay standing behind the ball: perspective hole render with fairway, hazards, bunkers, OB stakes, distance arcs, flight line, landing zones, wind/elevation HUD, and four target modes (Safe / Aggressive / Practice / Miss-Avoid). |
| **Range** | Goal → club(s) → recommended drill → fast shot logging (3×3 landing grid + 20+ one-tap feedback tags) → per-rep coaching with pattern detection ("4 of 6 short-right, confidence rising…") → live dispersion plot, practice score, session summary. |
| **Drill engine** | 12 fully specified drills (objective, setup, reps, scoring, tracking, success criteria, coaching cue, progression), scored against goal + miss pattern. |
| **Insights** | Raw vs normalized distances per club, confidence, dispersion, miss tendencies, strokes lost by category, score & practice trends, best/worst club, gapping analysis — all SVG charts, no chart lib. |
| **Profile / Bag** | Player model editing, full bag table (carry/total/true/confidence), per-club detail sheets, JSON export, demo reset. |

## Architecture

```
src/
  types/        domain model (shots, rounds, range, drills, profile)
  data/         clubs, 2 courses, 12 drills, deterministic seed generator
  lib/
    physicsEngine.ts      wind/elevation/lie/slope/temp/firmness/strike effects + expected-strokes curve
    shotNormalization.ts  normalizeShot, plays-like, club confidence, miss patterns, club recommendation
    caddieEngine.ts       tee & approach advice, hazard pressure vs YOUR miss, risk model
    aiCoach.ts            templated-but-data-driven feedback, summaries, recaps, practice plans
    drillEngine.ts        drill scoring & recommendation
    insights.ts           derived analytics (weaknesses, strokes lost, trends, TSI, gapping)
    storage.ts            localStorage persistence + export
  hooks/        useAppState (reducer + persistence), useInstallPrompt
  components/   AppShell, BottomNav, ui primitives, SVG charts, ARPreview, DrillCard, FeedbackCard
  screens/      Onboarding, Home, Play, Range, Insights, Profile
scripts/        icon generator, smoke tests
public/         manifest.webmanifest, sw.js, icons
```

All "AI" is local: rules + scoring + varied templates, always derived from real state so every claim is
explainable. The normalization formulas are simplified but directionally faithful golf physics, and every
adjustment carries a human-readable note — tap any logged shot to see the full breakdown.

## Known limitations

- Holes are data cards, not surveyed maps; the XR view is a stylized projection, not GPS-accurate.
- Strokes-gained values are fitted approximations, not tour-data lookups.
- Single-profile, on-device only (localStorage). No backend, auth, or sync.
- Putting is tracked per-hole (count), not per-putt.

## Next build priorities

1. Real course data (GPS polygons) + device location for auto shot distances.
2. Per-putt tracking and a short-game module.
3. Backend sync + multi-device profiles.
4. Camera-based AR (WebXR) behind the existing XR view contract.
5. LLM-backed coach swapping in for the template engine (same interfaces in `lib/aiCoach.ts`).
