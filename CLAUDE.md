# CLAUDE.md

Guidance for AI assistants (Claude Code) working in this repository.

## Project Overview

**Hatch** is a mobile-first, offline-first focus timer app with a bird collection mechanic.
The concept: users focus → seeds/food attract birds → eggs appear in an incubator → birds hatch and grow in an aviary.

- **License**: MIT (Copyright 2026 Guilherme-Beckman)
- **Stack**: Angular 21 + Capacitor 6 + Firebase (Auth + Firestore) + Angular PWA
- **Package Manager**: npm (no lock file committed per project convention)
- **Target**: Android (via Capacitor) + Web (PWA via Firebase Hosting)

## Repository Structure

```
hatch/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/           # Data models + pure game logic
│   │   │   │   ├── bird.model.ts     # Bird, UserBird, BIRDS[], RARITY_CONFIG
│   │   │   │   ├── egg.model.ts      # Egg, HATCH_DURATION_MS, ADS_TO_HATCH
│   │   │   │   ├── food.model.ts     # FoodType, Food, FOODS[]
│   │   │   │   ├── session.model.ts  # FocusSession, rollRarity(), pickBird()
│   │   │   │   └── user.model.ts     # UserProfile
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts      # Firebase Google Auth
│   │   │   │   ├── firestore.service.ts # All Firestore reads/writes
│   │   │   │   └── timer.service.ts     # Timer state (singleton)
│   │   │   └── guards/
│   │   │       └── auth.guard.ts        # Route protection
│   │   ├── features/
│   │   │   ├── auth/             # Login screen (Google)
│   │   │   ├── timer/            # Focus timer + food selector
│   │   │   ├── incubadora/       # Egg incubator + countdown
│   │   │   ├── aviario/          # Bird album + animated scene
│   │   │   └── perfil/           # User stats + achievements
│   │   ├── shared/
│   │   │   └── components/
│   │   │       └── bottom-nav/   # Mobile bottom navigation bar
│   │   ├── app.ts                # Root component
│   │   ├── app.config.ts         # Angular + Firebase providers
│   │   └── app.routes.ts         # Lazy-loaded routes
│   ├── environments/
│   │   ├── environment.ts        # Dev config (Firebase keys go here)
│   │   └── environment.prod.ts   # Prod config
│   ├── index.html                # PWA meta tags
│   └── styles.scss               # Global CSS variables + reset
├── public/
│   ├── icons/                    # PWA icons (generated)
│   └── manifest.webmanifest      # PWA manifest
├── capacitor.config.ts           # Capacitor config (appId, webDir)
├── angular.json                  # Angular CLI workspace config
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

## Development Workflows

### Setup

```bash
npm install
```

> **Firebase config required**: Edit `src/environments/environment.ts` with your Firebase project credentials before running.

### Development Server

```bash
ng serve           # http://localhost:4200
```

### Build

```bash
ng build                          # Dev build → dist/hatch/browser/
ng build --configuration production  # Prod build
```

### Android (Capacitor)

```bash
ng build --configuration production
npx cap sync android
npx cap open android              # Opens Android Studio
```

### Deploy to Firebase Hosting (for cloud preview)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting             # select dist/hatch/browser as public dir
ng build --configuration production
firebase deploy
# → https://YOUR_PROJECT.web.app
```

### Firebase App Distribution (share APK without Play Store)

```bash
# After building the APK in Android Studio:
firebase appdistribution:distribute app-release.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups testers \
  --release-notes "Build description"
```

## Game Mechanics

### Sessions → Eggs

| Duration | Eggs Generated |
|----------|---------------|
| 15–30 min | 1 egg |
| 31–60 min | 2 eggs |
| 60+ min | 3 eggs (max) |

### Rarity Probability (per egg)

Base rates adjusted by time bonuses defined in `session.model.ts → rollRarity()`.

| Rarity | Base | +30min | +60min | +90min |
|--------|------|--------|--------|--------|
| Comum | 60% | — | — | — |
| Incomum | 25% | +10% | — | — |
| Raro | 12% | +5% | +15% | — |
| Lendário | 3% | +2% | +5% | +10% |

### Food → Bird Affinity

| Food | Birds |
|------|-------|
| 🌾 Semente | Bem-te-vi, Pintassilgo, Beija-flor, Uirapuru |
| 🍎 Fruta | Sabiá, Tucano, Arara-azul, Harpia |
| 🍪 Biscoito | Periquito, Papagaio, Cacatua, Ararinha-azul |

### Egg Hatch Times

| Rarity | Natural | Ad Acceleration |
|--------|---------|-----------------|
| Comum | 30 min | Instant (1 ad) |
| Incomum | 2 h | -1 h (1 ad) |
| Raro | 6 h | -3 h (2 ads) |
| Lendário | 12 h | -6 h (3 ads) |

### Bird Growth Stages

```
Filhote (0–4 sessions) → Jovem (5–14 sessions) → Adulto (15+ sessions)
```

Growth is tracked via `UserBird.sessionsWithBird`, incremented after every completed session.

## Key Conventions

### Angular

- **Standalone components only** — no NgModules
- **Signals** for local state (`signal()`, `computed()`)
- **Lazy-loaded routes** via `loadComponent` in `app.routes.ts`
- **Inject function** (`inject()`) instead of constructor DI

### Firebase / Firestore

Collections:
- `users/{uid}` — UserProfile documents
- `sessions/{id}` — FocusSession records
- `eggs/{id}` — Egg documents (hatched or not)
- `userBirds/{id}` — Collected bird instances

Offline persistence is enabled in `app.config.ts` via `enableIndexedDbPersistence`.

### Gitignored Paths

| Path | Reason |
|------|--------|
| `/dist/` | Build output |
| `/node_modules/` | Dependencies |
| `/.angular/cache` | CLI cache |
| `npm-debug.log*` | Logs |
| `.env` | Secrets |

## Firebase Setup (Required)

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication → Google provider**
3. Enable **Firestore Database** (start in test mode for dev)
4. Register a Web app and copy the config to `src/environments/environment.ts`
5. For Android AdMob: register the app at https://admob.google.com and replace the test ad IDs in `environment.ts`

## Firestore Security Rules (Recommended for Production)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /sessions/{id} {
      allow read, write: if request.auth.uid == resource.data.userId
                         || request.auth.uid == request.resource.data.userId;
    }
    match /eggs/{id} {
      allow read, write: if request.auth.uid == resource.data.userId
                         || request.auth.uid == request.resource.data.userId;
    }
    match /userBirds/{id} {
      allow read, write: if request.auth.uid == resource.data.userId
                         || request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Branch Strategy

- `master`: Stable mainline
- `claude/*`: Claude Code feature branches
- `feature/*`, `fix/*`: Regular development branches

## Notes for AI Assistants

- All game logic (probabilities, timers, bird data) lives in `src/app/core/models/` — modify constants there to rebalance.
- The `TimerService` is a singleton — timer keeps running during navigation between tabs.
- AdMob integration placeholder is in `IncubadoraComponent.watchAd()` — replace with `@capacitor-community/admob` calls.
- Bird images are referenced as `assets/birds/{bird-id}/{stage}.svg` — these SVG files need to be created.
- To add a new bird: add to `BIRDS[]` in `bird.model.ts` and add its id to the corresponding food's `attractsBirds[]` in `food.model.ts`.
- Never hardcode Firebase config — always use `environment.ts`.
