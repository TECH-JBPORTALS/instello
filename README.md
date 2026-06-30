<div>
  <img src="./apps/web/public/instello.svg" height="64px" width="180px"/>
</div>

---
**Instello** is a multi-tenant institution management platform built with Next.js, Convex, and Better Auth.

## Tech Stack

- Bun (Monorepo + Turborepo)
- Next.js 16
- Convex
- Better Auth
- Vitest
- Biome
- Shared `@instello/ui`

---

# Getting Started

## Prerequisites

- Bun >= 1.2
- Node.js >= 20
- Convex account

---

## Installation

Clone the repository and install dependencies.

```bash
git clone <repo-url> instello
cd instello
bun install
```

---

## Configure Web Environment

Copy the example file.

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Fill in the values.

```env
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
NEXT_PUBLIC_ROOT_DOMAIN=app.localtest.me
```

---

## Configure Convex

Move into the Convex package.

```bash
cd packages/convex
```

Run Convex.

```bash
bun run dev
```

If this is your first time, Convex CLI will ask you to create or select a project.

After setup it automatically creates:

```
packages/convex/.env.local
```

with the required deployment values.

---

## Required Convex Environment Variables

The following variables are validated automatically by `convex.config.ts`.

| Variable | Required | Purpose |
|----------|----------|---------|
| `SITE_URL` | Yes | Public application URL |
| `BETTER_AUTH_SECRET` | Yes | Better Auth secret |
| `SUPER_ADMIN_EMAIL` | Yes | Super administrator email |
| `SEED_MODE` | Optional | Enable development seeds |
| `SEED_PASSWORD` | Optional | Password for seeded users |
| `NODE_ENV` | Yes | Evnironment option (development/preview/production) |

Example:

Run in your git bash if your on windows

```bash
bun x convex env set SITE_URL https://app.localtest.me:3000
bun x convex env set BETTER_AUTH_SECRET $(openssl rand -base64 32)
bun x convex env set SUPER_ADMIN_EMAIL "admin@example.com"
bun x convex env set NODE_ENV "development"
bun x convex env set SEED_MODE true
bun x convex env set SEED_PASSWORD Test1234.com
```

---

## Local HTTPS

Generate a wildcard certificate once.

```bash
cd apps/web

bun x mkcert -install
bun x mkcert "*.localtest.me"
```

This creates:

```
_wildcard.localtest.me.pem
_wildcard.localtest.me-key.pem
```

Do **not** commit these files.

---

## Run Development Server

From the repository root.

```bash
bun dev
```

Open:

```
https://app.localtest.me:3000
```

---

# Testing

Run Convex tests.

```bash
bun run test:convex
```

Installing the **Vitest** VS Code extension is recommended for running and debugging tests directly from the editor.

---

# Useful Commands

```bash
bun dev              # Start web + Convex
bun run check        # Lint & format
bun run fix          # Auto-fix formatting
bun run typecheck    # Type checking
bun run test:convex  # Run Convex tests
```

---

# Rules

- Never edit generated files.
- Validate all public function inputs.
- Keep functions small.
- Reuse helpers instead of duplicating logic.
- Write tests for every public API.
- Keep authentication and authorization out of the model layer.