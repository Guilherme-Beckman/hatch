# CLAUDE.md

This file provides guidance for AI assistants (e.g., Claude Code) working in this repository.

## Project Overview

**hatch** is an Angular/TypeScript web application project. The repository is currently in its initial setup phase with the foundational scaffolding in place, waiting for source code to be added.

- **License**: MIT (Copyright 2026 Guilherme-Beckman)
- **Stack**: Angular, TypeScript, Node.js
- **Package Manager**: npm or Yarn

## Repository Structure

```
hatch/
├── .gitignore        # Git ignore patterns (Angular + Node.js conventions)
├── LICENSE           # MIT License
├── README.md         # Project readme
└── CLAUDE.md         # This file
```

Expected structure once source code is added:

```
hatch/
├── src/              # Angular application source
│   ├── app/          # Components, services, modules
│   ├── assets/       # Static assets
│   └── environments/ # Environment configuration files
├── e2e/              # End-to-end tests
├── dist/             # Build output (gitignored)
├── node_modules/     # Dependencies (gitignored)
├── angular.json      # Angular CLI workspace configuration
├── package.json      # npm dependencies and scripts
├── tsconfig.json     # TypeScript compiler configuration
└── tsconfig.app.json # App-specific TypeScript config
```

## Development Workflows

### Setup

```bash
npm install        # Install dependencies
```

### Development Server

```bash
ng serve           # Start dev server at http://localhost:4200
# or
npm start
```

### Build

```bash
ng build           # Development build
ng build --prod    # Production build (output in /dist/)
```

### Testing

```bash
ng test            # Run unit tests (Karma/Jasmine)
ng e2e             # Run end-to-end tests
```

### Linting

```bash
ng lint            # Run ESLint/TSLint
```

## Key Conventions

### Gitignored Paths

The following are intentionally excluded from version control:

| Path | Reason |
|------|--------|
| `/dist/` | Build output |
| `/out-tsc/` | TypeScript compilation cache |
| `/tmp/` | Temporary files |
| `/coverage/` | Test coverage reports |
| `/e2e/test-output/` | E2E test artifacts |
| `/.angular/` | Angular CLI cache |
| `/node_modules/` | npm dependencies |
| `/package-lock.json` | Lock file (excluded per project convention) |
| `/yarn.lock` | Yarn lock file |
| `/.env` | Environment secrets |
| `*.tsbuildinfo` | TypeScript incremental build cache |

### Angular Conventions

When source code is added, follow standard Angular style guide:

- **Components**: `kebab-case` filenames, `PascalCase` class names with `Component` suffix
- **Services**: `kebab-case` filenames, `PascalCase` class names with `Service` suffix
- **Modules**: `kebab-case` filenames, `PascalCase` class names with `Module` suffix
- **Interfaces**: `PascalCase`, no `I` prefix
- **One class per file**
- **Feature modules** for logical grouping of components

### TypeScript Conventions

- Strict mode is expected for Angular projects
- Avoid `any` type; use proper typing or generics
- Use `readonly` where mutation is not needed
- Prefer `const` over `let`; avoid `var`

## Branch Strategy

- `master`: Stable mainline branch
- Feature branches: Use descriptive names prefixed with context (e.g., `feature/`, `fix/`, `claude/`)

## Notes for AI Assistants

- The project is an Angular skeleton — no source code exists yet. Do not assume file paths beyond what is listed above.
- When adding source code, follow Angular CLI conventions and generate files using `ng generate` where possible.
- Environment-sensitive configuration belongs in `src/environments/` files, never hardcoded.
- Do not commit `/node_modules/`, lock files, or `.env` — these are gitignored by convention in this project.
- If `package.json` does not yet exist, create it with `npm init` or via `ng new` before adding dependencies.
