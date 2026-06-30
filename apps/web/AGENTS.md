# apps/web — Agent Instructions

These guidelines apply to all code changes inside `apps/web`.

---

# General Principles

- Follow the existing architecture before introducing a new one.
- Keep changes focused on the requested task.
- Prefer modifying existing code over creating new abstractions.
- Search for similar implementations before writing new code.
- Match the surrounding code style and naming conventions.
- Keep the codebase consistent and predictable.

Do not introduce new architectural patterns unless explicitly requested.

---

# Project Structure

The application follows a feature-first architecture.

```text
src/
├── app/                     # Next.js App Router
├── features/                # Business features
│   └── <feature>/
├── components/              # Shared reusable business components
│   ├── auth/
│   ├── common/
│   └── sidebars/
├── hooks/                   # Shared application hooks
├── lib/                     # Shared utilities
├── providers/
└── ...
```

---

# Feature Ownership

Every business feature owns its implementation.

Examples:

- faculty
- students
- institutions
- attendance
- timetable
- programs
- fees

A feature should contain everything that belongs exclusively to it.

Example:

```text
faculty/
├── page.tsx
├── faculty-table.tsx
├── add-faculty-dialog.tsx
├── add-faculty-form.tsx
├── constants.ts
├── types.ts
├── shared-form.ts
└── ...
```

When a feature grows, organize it into subfolders:

```text
faculty/
├── dialogs/
├── forms/
├── hooks/
├── sections/
├── tables/
├── constants.ts
├── types.ts
└── ...
```

Do not create additional nesting unless it improves readability.

---

# Shared Code

Before creating a shared abstraction, verify that it is actually shared.

If code is only used by one feature:

- keep it inside that feature

Only move code into shared folders when it is reused by multiple features.

Shared folders:

- `components/`
- `hooks/`
- `lib/`

Avoid creating shared abstractions prematurely.

---

# App Router

Files inside `app/` should remain thin.

Responsibilities:

- routing
- layouts
- metadata
- loading states
- error boundaries
- server-side data fetching

Move business UI into feature components.

---

# Components

Before creating a new component:

1. Search the current feature.
2. Search `components/`.
3. Search `@instello/ui/components`.
4. Compose existing components.
5. Create a new component only if necessary.

Avoid duplicate UI.

---

# UI Components

Always import UI primitives from:

```ts
@instello/ui/components/*
```

Never:

- import directly from `packages/ui`
- duplicate shadcn components
- copy component source code

---

# Installing New shadcn Components

Always ask for approval before installing a new shadcn component.

After approval:

```bash
cd apps/web
bun x shadcn@latest add <component>
```

Requirements:

- Install only from `apps/web`
- Export it through `@instello/ui`
- Reuse it everywhere

---

# Imports

Prefer:

```ts
@/...
```

Use relative imports only within the same feature when they improve readability.

Never import source files from another package.

---

# Styling

- Reuse design tokens.
- Reuse spacing.
- Reuse layout patterns.
- Prefer composition over duplicated styles.
- Avoid arbitrary Tailwind values unless necessary.

---

# Server Components

Default to Server Components.

Use `"use client"` only when required for:

- React state
- Effects
- Browser APIs
- Event handlers
- TanStack Form

Do not convert Server Components into Client Components unnecessarily.

---

# Data Fetching

Prefer server-side data fetching.

Rules:

- Fetch data once.
- Avoid duplicate requests.
- Pass data through props.
- Keep mutations inside the RPC layer.

---

# Forms

Every form should own exactly one form instance.

Rules:

- Use shared form utilities.
- Keep schemas beside the feature.
- Keep backend and frontend field names aligned.
- Reuse field components.
- Avoid duplicated validation schemas.

Multi-step forms should share a single form state.

---

# Tables

Reuse the shared `DataTable` whenever possible.

Create a custom table only when the requirements cannot be satisfied by the shared table.

---

# Hooks

Shared hooks belong in:

```text
src/hooks
```

Feature-specific hooks belong inside the feature.

Example:

```text
faculty/
└── hooks/
    └── use-can-manage-faculty.ts
```

Do not place feature-specific hooks inside the shared hooks folder.

---

# Constants

Feature constants belong beside the feature.

Application-wide constants belong inside shared modules.

Avoid magic strings.

---

# Types

Feature types belong beside the feature.

Only create shared types when they are genuinely shared across multiple features.

---

# Naming

Prefer descriptive names.

Examples:

```text
faculty-table.tsx
faculty-card.tsx
faculty-filter.tsx

add-faculty-dialog.tsx
edit-faculty-dialog.tsx

faculty-form.tsx
shared-form.ts

constants.ts
types.ts
```

Avoid vague names like:

```text
index.tsx
component.tsx
utils.ts
helpers.ts
```

unless they serve a clear purpose.

---

# Code Quality

- Keep components focused.
- Prefer composition over large components.
- One responsibility per component.
- Remove dead code.
- Keep files cohesive.
- Match the surrounding style.
- Format with Biome.

Avoid unnecessary comments.

---

# Performance

- Avoid unnecessary client components.
- Avoid unnecessary re-renders.
- Lazy-load heavy UI when appropriate.
- Avoid duplicate network requests.

---

# Accessibility

Ensure:

- forms have labels
- dialogs trap focus
- buttons have accessible labels
- interactive elements support keyboard navigation

Reuse accessible UI components whenever possible.

---

# Testing

When adding UI:

- keep components testable
- avoid tightly coupling components
- extract reusable logic into hooks when appropriate

---

# AI Agent Rules

Before writing code:

1. Search for an existing implementation.
2. Reuse existing feature patterns.
3. Reuse existing components.
4. Reuse existing hooks.
5. Reuse existing utilities.

Do not:

- invent new folder structures
- create unnecessary wrapper components
- duplicate existing functionality
- introduce new architectural patterns
- over-engineer simple features

When uncertain, choose the solution that best matches the existing codebase.

Consistency is preferred over clever abstractions.