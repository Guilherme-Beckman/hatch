# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hatch** is a mobile-first, offline-first focus timer app with a bird collection mechanic.
The concept: users focus → food type determines bird affinity → eggs appear in an incubator → birds hatch and grow in an aviary.

- **Stack**: Angular 21 + Capacitor 8 + Firebase (Auth + Firestore) + Angular PWA
- **Package Manager**: npm (no lock file committed)
- **Target**: Android (via Capacitor) + Web (PWA via Firebase Hosting)

## Commands

```bash
npm install
ng serve                                    # Dev server → http://localhost:4200
ng build                                    # Dev build → dist/hatch/browser/
ng build --configuration production         # Prod build
npm run watch                               # Incremental dev build (watch mode)
npm run sprites:setup                       # Generate placeholder SVGs for all 12 birds × 3 stages
npm run sprites:generate                    # Generate final bird SVG sprites

# Android (Capacitor)
ng build --configuration production && npx cap sync android && npx cap open android
```

No tests exist yet — `vitest` is in devDependencies but has no config or test files.

## Code Conventions

- **Standalone components only** — no NgModules
- **Signals** for local state (`signal()`, `computed()`)
- **Lazy-loaded routes** via `loadComponent` in `app.routes.ts`
- **`inject()`** instead of constructor DI
- **Prettier**: `printWidth: 100`, `singleQuote: true`, Angular parser for HTML

## Architecture

### Feature Modules (`src/app/features/`)

| Route | Component | Notes |
|-------|-----------|-------|
| `/timer` | `timer/` | Focus timer + food type selector; guarded |
| `/incubadora` | `incubadora/` | Egg countdown + ad acceleration; guarded |
| `/aviario` | `aviario/` | Animated bird scene + collection album; guarded |
| `/perfil` | `perfil/` | User stats + achievements; guarded |
| `/admin` | `admin/` | Admin panel; guarded |
| `/auth` | `auth/` | Google Sign-In |

All protected routes use `authGuard` (Firebase Auth check). Default redirect is `/timer`.

### Core Services (`src/app/core/`)

- **`TimerService`** — singleton; timer state persists across tab navigation
- **`FirestoreService`** — all Firestore reads/writes (centralized, not per-feature)
- **`AuthService`** — Firebase Google Auth wrapper

### Data Models (`src/app/core/models/`)

All game logic and constants live here — modify these files to rebalance the game:

- `session.model.ts` — `eggsFromSession()`, `rollRarity()`, `pickBird()`
- `bird.model.ts` — `BIRDS[]`, `RARITY_CONFIG`, `UserBird`
- `egg.model.ts` — `HATCH_DURATION_MS`, `ADS_TO_HATCH`
- `food.model.ts` — `FOODS[]` with `attractsBirds[]` affinity arrays

### Firestore Collections

- `users/{uid}` — UserProfile
- `sessions/{id}` — FocusSession records
- `eggs/{id}` — Egg documents (active and hatched)
- `userBirds/{id}` — Collected bird instances

Offline persistence is enabled via `enableIndexedDbPersistence` in `app.config.ts`.

## Game Mechanics

### Sessions → Eggs

| Duration | Eggs |
|----------|------|
| 15–30 min | 1 |
| 31–60 min | 2 |
| 60+ min | 3 (max) |

### Rarity Roll (per egg) — `rollRarity()` in `session.model.ts`

| Rarity | Base | >30min | >60min | >90min |
|--------|------|--------|--------|--------|
| Comum | 60% | — | — | — |
| Incomum | 25% | +10% | — | — |
| Raro | 12% | +5% | +10% | — |
| Lendário | 3% | +2% | +5% | +10% |

Note: bonuses are cumulative (>60min also applies >30min bonus).

### Food → Bird Affinity

| Food | Birds |
|------|-------|
| Semente | Bem-te-vi, Pintassilgo, Beija-flor, Uirapuru |
| Fruta | Sabiá, Tucano, Arara-azul, Harpia |
| Biscoito | Periquito, Papagaio, Cacatua, Ararinha-azul |

### Egg Hatch Times

| Rarity | Natural | Ad Acceleration |
|--------|---------|-----------------|
| Comum | 30 min | Instant (1 ad) |
| Incomum | 2 h | −1 h (1 ad) |
| Raro | 6 h | −3 h (2 ads) |
| Lendário | 12 h | −6 h (3 ads) |

### Bird Growth

```
Filhote (0–4 sessions) → Jovem (5–14 sessions) → Adulto (15+ sessions)
```

Tracked via `UserBird.sessionsWithBird`, incremented after each completed session.

## Notes

- Bird images: `assets/birds/{bird-id}/{stage}.svg` — run `npm run sprites:setup` to generate placeholders
- To add a bird: add to `BIRDS[]` in `bird.model.ts` and add its id to `attractsBirds[]` in `food.model.ts`
- AdMob placeholder is in `IncubadoraComponent.watchAd()` — replace with `@capacitor-community/admob` calls
- Firebase config lives in `src/environments/environment.ts` — never hardcode it elsewhere

## Branch Strategy

- `main`: Stable mainline
- `claude/*`: Claude Code feature branches
- `feature/*`, `fix/*`: Regular development branches
