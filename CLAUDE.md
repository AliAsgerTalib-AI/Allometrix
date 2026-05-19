# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # TypeScript type check (tsc --noEmit)
npm run preview   # Preview production build
npm run clean     # Remove dist/ and server.js
```

There are no tests. `npm run lint` is the only static check.

## Environment

Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`. The app is designed to run on Google AI Studio, which injects `GEMINI_API_KEY` and `APP_URL` automatically at runtime.

## Architecture

**Allometrix** is a TUI-style browser game where users design organisms via DNA parameters and simulate their survival against configurable ecosystem conditions. All simulation logic runs client-side in the browser.

### Core data flow

```
OrganismDNA + EcosystemState  →  evaluateSurvival()  →  SimulationResult
```

- `src/types.ts` — All shared interfaces: `OrganismDNA`, `EcosystemState`, `SimulationResult`, `AttachedModules`, etc.
- `src/engine.ts` — Pure simulation function `evaluateSurvival(dna, ecosystem)`. Applies biophysics formulas (Kleiber's Law, allometric scaling, thermodynamics, biomechanics) across 10 evaluation layers to determine viability and produce telemetry. **No side effects — safe to call anywhere.**
- `src/App.tsx` — Root component holding all state. Calls `evaluateSurvival` via `useMemo` so the simulation recomputes on every DNA or ecosystem change. Handles epoch advancement, random mutations, and periodic ecosystem events.
- `src/constants/ecosystemEvents.ts` — Predefined `EcosystemEvent` objects (volcanic eruption, ice age, etc.), each with an `apply(state)` function that modifies `EcosystemState`.

### UI layout (3-column TUI)

| Left | Center | Right |
|------|--------|-------|
| `DNAModifier` — sliders/selectors for all `OrganismDNA` fields | `EnvironmentController` — ecosystem sliders | `TelemetryDisplay` — simulation output, charts |
| `PresetManager` — save/load localStorage presets | `CreatureVisualizer` — SVG creature render | Milestones / achievements |
| | `EventLog` — terminal-style log | |

`Tutorial` and `HelpSystem` are overlays managed from App state.

### Path alias

`@` resolves to the project root (not `src/`). Import as `@/src/types` or `@/src/engine`.

### Styling

Tailwind CSS v4 via the `@tailwindcss/vite` plugin — no `tailwind.config.js` needed. The UI palette is `slate-950` background with `emerald-400` text (terminal aesthetic). Custom classes like `tui-panel`, `tui-button`, `tui-button-secondary`, `custom-scrollbar` are defined in `src/index.css`.

### Key simulation concepts

- `OrganismDNA.modules` — 9 pluggable biological modules (respiration, locomotion, thermal, trophic, nervousSystem, reproduction, hydrodynamics, sensory, chemicalTolerance)
- `SimulationResult.failureModes` — string array of named failure conditions (e.g. `STRUCTURAL_SKELETAL_COLLAPSE`, `METABOLIC_STARVATION_DEFICIT`). Empty = organism is viable.
- `SimulationResult.telemetry` — computed biometric values surfaced in `TelemetryDisplay`
- Epoch advancement in `App.advanceEpoch()` applies random environmental jitter and may trigger DNA mutations based on `dna.mutationProbability`
