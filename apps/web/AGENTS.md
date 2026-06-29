# apps/web — Agent Instructions

These guidelines apply to all code changes inside `apps/web`.

## General Rules

- Match the existing architecture and coding style before introducing new patterns.
- Keep changes focused on the requested task. Avoid unrelated refactors.
- Prefer modifying existing files over creating new ones.
- If a new file is required, place it beside the feature that owns it.
- Inspect nearby files before writing code and follow their conventions.

---

# Project Structure

Keep feature code inside `apps/web/src`.

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── auth/
│   ├── common/
│   ├── features/
│   │   └── <feature>/
│   │       ├── page.tsx
│   │       ├── *-form.tsx
│   │       ├── *-dialog.tsx
│   │       ├── *-sheet.tsx
│   │       ├── *-table.tsx
│   │       ├── shared-*.ts
│   │       ├── constants.ts
│   │       └── types.ts
│   ├── providers.tsx
│   └── sidebars/
└── hooks/
```

### Folder Rules

- `components/features/` contains all UI for a single feature.
- `components/common/` is only for reusable cross-feature components.
- `hooks/` contains reusable application hooks.
- Keep schemas, constants and types beside the feature that owns them.
- App Router pages should remain thin and delegate UI to `components/features/...`.

---

# Component Priority

Always use the following order:

1. Existing feature component
2. Existing component from `@instello/ui`
3. Compose existing UI primitives
4. Create a new local component
5. Ask before installing a new shadcn component

Never skip an earlier option.

---

# UI Components

Before building custom UI:

1. Check `packages/ui/src/components`.
2. Import components from `@instello/ui/components/*`.
3. Reuse existing components instead of recreating styles.

Never:

- Copy shadcn component source manually.
- Import directly from `packages/ui`.

---

# Adding shadcn Components

Always ask for approval before installing a new component.

After approval:

```bash
cd apps/web
bun x shadcn@latest add <component>
```

Requirements:

- Install only from `apps/web`.
- Verify the component is exported from `@instello/ui/components/*`.
- Use the exported component everywhere.

---

# Imports

- Use `@/` path aliases whenever possible.
- Import UI components only from `@instello/ui/components/*`.
- Never use relative imports into `packages/ui`.

---

# Styling

- Reuse existing design tokens.
- Reuse existing spacing and layout patterns.
- Avoid arbitrary Tailwind values unless necessary.
- Do not duplicate styles already provided by shared UI components.

---

# Server Components

Default to Server Components.

Only use `"use client"` when required for:

- React state
- Effects
- Event handlers
- Browser APIs
- TanStack Form

Do not convert Server Components into Client Components unnecessarily.

---

# Data Fetching

- Fetch data in Server Components whenever possible.
- Pass fetched data to Client Components through props.
- Avoid duplicate requests.
- Keep mutations inside the RPC or action layer.

---

# Forms

Use the shared form utilities from `@/hooks/form`.

Rules:

- One `useAppForm` per form or wizard.
- Multi-step forms should use `FormGroup`.
- Use `revalidateLogic()` when validators rely on `onDynamic`.
- Show validation errors only after touch or submit.
- Use existing UI components for all fields.
- Keep validation schemas beside the feature.
- Do not duplicate schemas.
- Keep field names aligned with backend models.

---

# Tables

When displaying tabular data:

- Reuse the existing `DataTable` component.
- Build a custom table only when requirements cannot be met by `DataTable`.

---

# Naming

Use these naming conventions:

```
page.tsx
loading.tsx
error.tsx
not-found.tsx

*-form.tsx
*-dialog.tsx
*-sheet.tsx
*-table.tsx

shared-*.ts
constants.ts
types.ts
```

---

# Code Quality

- Match the surrounding code style.
- Keep components small and composable.
- Minimize the scope of changes.
- Format with Biome.
- Do not add comments unless the logic is genuinely difficult to understand.
- Run `bun run check` and `bun run typecheck` when changing types or multiple files.