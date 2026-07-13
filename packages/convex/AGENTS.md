# Instello Convex Backend — AGENTS.md

This package contains the entire Convex backend for Instello, including authentication powered by Better Auth.

The backend uses:

- Convex
- Better Auth
- `convex-helpers`
- Vitest

Before making changes, review:

- Convex Best Practices: https://docs.convex.dev/understanding/best-practices/
- Better Auth Convex Integration: https://labs.convex.dev/better-auth

---

# 1. Architecture

The backend follows a **feature-based architecture**.

All code belonging to a feature must remain inside that feature's directory.

```text id="xsz2u7"
packages/convex/
├── better-auth/
│   └── ...                         # Authentication clients exposed to frontend apps
│
└── functions/
    ├── _generated/                 # Auto-generated Convex files — never modify
    ├── betterAuth/                 # Better Auth Convex component
    ├── helpers/                    # Truly shared cross-feature utilities
    ├── seed/                       # Internal seed functions
    │
    ├── institution/
    │   ├── model/
    │   ├── validator/
    │   ├── tests/
    │   ├── queries.ts
    │   ├── mutations.ts
    │   └── schema.ts
    │
    ├── program/
    │   ├── model/
    │   ├── validator/
    │   ├── tests/
    │   ├── queries.ts
    │   ├── mutations.ts
    │   └── schema.ts
    │
    ├── timetable/
    │   ├── model/
    │   ├── validator/
    │   ├── tests/
    │   ├── queries.ts
    │   ├── mutations.ts
    │   └── schema.ts
    │
    ├── attendance/
    │   ├── model/
    │   │   ├── register.ts
    │   │   ├── record.ts
    │   │   ├── entry.ts
    │   │   └── activityLog.ts
    │   ├── validator/
    │   │   ├── register.ts
    │   │   ├── session.ts
    │   │   └── activity.ts
    │   ├── tests/
    │   │   ├── queries.test.ts
    │   │   └── mutations.test.ts
    │   ├── queries.ts
    │   ├── mutations.ts
    │   └── schema.ts
    │
    ├── auth.config.ts
    ├── auth.ts
    ├── convex.config.ts
    ├── http.ts
    └── schema.ts                  # Global schema composition root
```

The exact internal structure of a feature may vary according to its complexity.

Do not create empty folders, unnecessary layers, or abstractions merely to satisfy a pattern.

---

# 2. Feature Ownership

A feature owns all code specific to its domain.

This includes:

- database table definitions
- public queries
- public mutations
- entity models
- business logic
- validators
- DTOs and API resources
- feature-specific helpers
- integration tests

For example, the Attendance feature owns:

```text id="a3hqlg"
attendance/
├── model/
│   ├── register.ts
│   ├── record.ts
│   ├── entry.ts
│   └── activityLog.ts
├── validator/
│   ├── register.ts
│   ├── session.ts
│   └── activity.ts
├── tests/
│   ├── queries.test.ts
│   └── mutations.test.ts
├── queries.ts
├── mutations.ts
└── schema.ts
```

Feature-specific logic must remain inside the feature.

Do not move domain logic into global `helpers`.

Prefer:

```text id="0a3n1w"
attendance/helpers/session.ts
```

over:

```text id="p3ccl4"
helpers/attendanceSession.ts
```

when the logic belongs only to Attendance.

---

# 3. Feature-Owned Database Schemas

Each feature must own the Convex table definitions belonging to that feature.

Feature tables must be defined in the feature's local `schema.ts`.

Example:

```ts id="t7vp1s"
// attendance/schema.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const attendanceTables = {
  attendanceRegisters: defineTable({
    classId: v.id("classes"),
    subjectId: v.id("subjects"),
    batchId: v.optional(v.id("classBatches")),
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  attendanceRecords: defineTable({
    registerId: v.id("attendanceRegisters"),
    sessionDate: v.string(),
    startHour: v.number(),
    endHour: v.number(),
    markedBy: v.string(),
    markedAt: v.number(),
    updatedAt: v.number(),
    presentCount: v.number(),
    absentCount: v.number(),
  }),

  attendanceEntries: defineTable({
    recordId: v.id("attendanceRecords"),
    studentId: v.id("students"),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
    ),
  }),
};
```

The global `functions/schema.ts` is only the composition root for all feature schemas.

```ts id="yj31du"
// functions/schema.ts

import { defineSchema } from "convex/server";

import { attendanceTables } from "./attendance/schema";
import { institutionTables } from "./institution/schema";
import { programTables } from "./program/schema";
import { timetableTables } from "./timetable/schema";

export default defineSchema({
  ...institutionTables,
  ...programTables,
  ...timetableTables,
  ...attendanceTables,
});
```

## Schema Rules

- Every table must be defined by the feature that owns it.
- Each feature exports its tables as a named `*Tables` object.
- Use camelCase names such as `attendanceTables` and `institutionTables`.
- The global `schema.ts` must compose feature schemas using spread operators.
- Do not define feature-specific tables directly in the global `schema.ts`.
- Foreign keys may reference tables owned by other features.
- A feature schema may contain multiple closely related tables.
- Do not create one schema file per table unless complexity genuinely requires it.
- The global `schema.ts` is the composition root for the complete database schema.

---

# 4. Dependency Direction

Features may depend on other features when required by the domain.

A typical dependency direction is:

```text id="b3id09"
Institution
    ↓
Program
    ↓
Academic Stage
    ↓
Class
    ↓
Subject / Program Subject
    ↓
Class Batch
    ↓
Timetable
    ↓
Attendance
```

Higher-level features may consume model APIs exposed by foundational features.

Cross-feature imports are allowed.

Example:

```ts id="j13w6p"
import * as Class from "../class/model/class";
import * as Subject from "../subject/model/subject";
import * as ProgramSubject from "../programSubject/model/programSubject";
```

However:

> A feature may depend on another feature's model API, but must not reproduce that feature's internal database queries or business rules.

---

# 5. Feature and Entity Boundaries

The owning feature decides how its data is retrieved and manipulated.

The consuming feature should express **what it needs**, not **how another feature retrieves it**.

Prefer:

```ts id="m6z3r5"
const allocation =
  await ProgramSubject.getForStageAndSubjectOrThrow(ctx, {
    programId,
    academicStageId,
    subjectId,
  });
```

Avoid:

```ts id="c8u3f7"
const allocations = await ctx.db
  .query("programSubjects")
  .withIndex(...)
  .collect();

const allocation = allocations.find(...);
```

Avoid making one feature understand:

- another feature's indexes
- another feature's filtering implementation
- another feature's relationship traversal
- another feature's internal business rules

Expose a meaningful model operation from the owning feature instead.

---

# 6. Public Queries and Mutations

`queries.ts` and `mutations.ts` are the public application boundaries of a feature.

They should:

- validate external input
- define explicit return validators
- authenticate the caller
- authorize the operation
- call model functions
- orchestrate the use case when necessary
- return the final API resource or DTO
- include JSDoc for exported public functions

The normal flow is:

```text id="1z0ubf"
Input Validation
      ↓
Authentication
      ↓
Authorization
      ↓
Model / Domain Operations
      ↓
Resource Assembly
      ↓
Validated Response
```

Public functions should remain small and readable at a high level.

They should not contain:

- large raw database queries
- duplicated entity lookup logic
- duplicated relationship traversal
- deeply nested business logic
- business rules owned by another feature

---

# 7. Model Layer

Each feature may contain a `model/` directory.

Models own reusable domain and persistence logic for entities belonging to the feature.

Models may:

- read and write their own entity data
- encapsulate index usage
- expose reusable entity lookups
- enforce business invariants
- perform domain calculations
- expose meaningful operations to other features
- use relationship helpers for associated data

Models must:

- never perform authentication
- never perform caller-based authorization
- clearly document exported methods

Prefer predictable APIs:

```ts id="bgv21q"
getById()
getByIdOrThrow()
getByX()
listByX()
create()
update()
remove()
```

Use domain-specific names when they communicate intent better:

```ts id="n0jpy6"
ProgramSubject.getForStageAndSubject()
ClassBatch.getLabel()
AttendanceRecord.getLatestForRegister()
```

Do not create generic abstractions when a domain-specific API is clearer.

---

# 8. Relationships and Join Operations

When an operation needs associated data from another table or entity, use:

```ts id="hldu3h"
convex-helpers/server/relationships
```

Use relationship helpers for join-like operations and relationship traversal.

Examples include:

- retrieving a related parent document
- retrieving associated child documents
- one-to-one relationships
- one-to-many relationships
- many-to-many relationships
- resolving foreign-key associations
- joining related documents for a DTO or API resource

## Rule

> If data must be joined or resolved through a relationship between entities, prefer `convex-helpers/server/relationships` instead of manually implementing repeated relationship traversal.

Relationship helpers should normally be used inside model functions.

```text id="0il8aa"
Public Query / Mutation
        ↓
Model / Domain Operation
        ↓
convex-helpers/server/relationships
        ↓
Convex Database
```

Relationship helpers are data-access utilities, not architectural boundaries.

Do not:

- create a giant global relationship layer
- expose the entire database graph through generic utilities
- move feature ownership into a relationship utility
- use relationship helpers as a replacement for meaningful domain APIs

Direct `ctx.db.get(id)` remains acceptable for simple direct document retrieval when a relationship helper provides no meaningful benefit.

Direct indexed queries remain appropriate when querying an entity's own table by its indexed fields.

---

# 9. Cross-Feature Orchestration

Some use cases naturally require multiple features.

This is allowed.

For example, an Attendance Register resource may require:

```text id="69tihm"
Attendance Register
├── Class
├── Subject
├── Program Subject
├── Class Batch
└── Attendance Activity
```

The feature that owns the final use case may orchestrate these dependencies.

Example:

```ts id="x4uvh6"
const cls = await Class.getByIdOrThrow(
  ctx,
  register.classId,
);

const subject = await Subject.getByIdOrThrow(
  ctx,
  register.subjectId,
);

const allocation =
  await ProgramSubject.getForStageAndSubjectOrThrow(ctx, {
    programId: cls.programId,
    academicStageId: cls.currentHeadStageId,
    subjectId: register.subjectId,
  });
```

Cross-feature dependency is not automatically bad coupling.

The rule is:

> Depend on another feature's meaningful model API, not its internal implementation.

If orchestration contains complex relationship traversal, move that traversal into the appropriate owning model and use `convex-helpers/server/relationships`.

---

# 10. Validators and API Resources

Each feature owns its validators.

```text id="jvnuyz"
attendance/
└── validator/
    ├── register.ts
    ├── session.ts
    └── activity.ts
```

Use explicit validators for public API contracts.

A database document and an API resource are different concepts.

Use a document validator when the returned value is genuinely a raw database document.

Use an explicit DTO or resource validator when the response:

- combines multiple entities
- contains computed fields
- contains presentation fields
- exposes only part of a database document
- must remain stable independently of database schema changes

Do not use `vv.doc()` merely to reduce typing when the returned value is not actually a raw database document.

Example:

```ts id="l5pd0g"
export const AttendanceRegisterResourceSchema = vv.object({
  _id: vv.id("attendanceRegisters"),
  subjectName: vv.string(),
  subjectCode: vv.string(),
  batchLabel: vv.optional(vv.string()),
  activity: vv.optional(RegisterActivitySchema),
});
```

---

# 11. Shared Helpers

Global `functions/helpers` is reserved for genuinely shared, cross-feature infrastructure.

Examples:

```text id="21x5zp"
helpers/
├── errors.ts
├── pagination.ts
└── dates.ts
```

Do not place domain-specific logic in global helpers.

If logic belongs only to Attendance:

```text id="1nn7zt"
attendance/helpers/
```

If logic belongs only to Timetable:

```text id="3qtv0w"
timetable/helpers/
```

Only promote logic to global `helpers` when it is genuinely generic and used across unrelated features.

Do not prematurely create shared abstractions.

---

# 12. Authentication and Authorization

Authentication and caller-based authorization belong at the public application boundary.

Public queries and mutations should:

```text id="21frgf"
Validate Input
      ↓
Authenticate
      ↓
Authorize
      ↓
Execute Domain Operation
```

Models must not authenticate users or inspect the currently authenticated caller.

Avoid:

```ts id="74nifc"
// model/student.ts

const user = await getCurrentUser(ctx);
```

Prefer:

```ts id="zj25zi"
// mutations.ts

const user = await requireUser(ctx);

await requireInstitutionAccess(
  ctx,
  user,
  institutionId,
);

await Student.create(ctx, input);
```

Business invariants still belong inside models.

Authentication, authorization, and domain validation are separate responsibilities.

---

# 13. Database Access

A feature's model owns database access for entities belonging to that feature.

Prefer using another feature's model API rather than directly querying its tables.

Avoid:

```ts id="k52ayw"
// Inside Attendance

ctx.db
  .query("programSubjects")
  .withIndex(...)
```

Prefer:

```ts id="9xb93g"
ProgramSubject.getForStageAndSubject(...)
```

Use:

- `ctx.db.get()` for simple direct document retrieval
- indexed Convex queries for querying an entity's own data
- `convex-helpers/server/relationships` for join-like operations and relationship traversal

Do not create abstractions merely to hide one line of Convex code.

---

# 14. Testing

Tests must live inside the feature they test.

There is no global application `tests/` directory.

Example:

```text id="u4u9qp"
attendance/
├── tests/
│   ├── queries.test.ts
│   └── mutations.test.ts
├── queries.ts
└── mutations.ts
```

We use Vitest.

For now, tests may test **only public Convex queries and mutations**.

## Allowed Testing Boundary

```text id="wb26z0"
Test
  ↓
Public Query / Mutation
  ↓
Authentication + Authorization
  ↓
Models
  ↓
Relationship Helpers
  ↓
Database
```

Tests should verify observable application behavior through public entry points.

Example:

```ts id="g0ktwk"
describe("Attendance Queries", () => {
  it("returns attendance registers");
  it("returns session details");
  it("requires authentication");
  it("rejects unauthorized access");
});
```

```ts id="a7lx78"
describe("Attendance Mutations", () => {
  it("marks attendance");
  it("updates previously marked attendance");
  it("rejects invalid sessions");
  it("requires authorization");
});
```

## Do Not Write Direct Tests For

Do not directly test:

- model functions
- helpers
- validators
- DTO transformers
- resource assemblers
- relationship utilities
- internal implementation details

If a model or helper contains important behavior, verify that behavior indirectly through the public query or mutation that uses it.

No direct unit testing is required for now.

---

# 15. Test-Driven Development

We follow Test-Driven Development at the public API boundary.

For a new feature or public operation:

1. Understand the domain and existing feature dependencies.
2. Define or update the feature-owned Convex schema if required.
3. Compose the feature schema into the global `schema.ts`.
4. Define input and output validators.
5. Define the public query or mutation contract.
6. Create or update the feature's query or mutation test file.
7. Write failing tests against the public function.
8. Add or extend the required model APIs.
9. Implement business logic and orchestration.
10. Make all public API tests pass.
11. Refactor internal implementation without changing public behavior.

Tests should focus on observable behavior rather than implementation details.

Internal refactoring should not require rewriting tests when public behavior remains unchanged.

---

# 16. Refactoring Strategy

Refactor dependency-first.

Prefer stabilizing foundational features before highly composed features.

A typical direction is:

```text id="apoycq"
Institution
    ↓
Program
    ↓
Academic Stage
    ↓
Class
    ↓
Subject / Program Subject
    ↓
Class Batch
    ↓
Timetable
    ↓
Attendance
```

For each feature:

1. Move all feature-specific code into the feature folder.
2. Move its table definitions into the feature's `schema.ts`.
3. Export the feature tables as a `*Tables` object.
4. Compose those tables into the global `schema.ts`.
5. Preserve existing public behavior.
6. Establish clear model APIs.
7. Replace duplicated relationship traversal with `convex-helpers/server/relationships`.
8. Remove direct access to tables owned by other features when an appropriate model API exists.
9. Write or update tests against `queries.ts` and `mutations.ts`.
10. Make all feature tests pass.
11. Refactor internal implementation.
12. Move to the next dependent feature.

Do not perform a full codebase rewrite.

Refactor incrementally from foundational features toward dependent features.

Do not attempt to perfect an entire feature before moving forward.

Refactor enough to establish clear, stable, and reusable boundaries.

---

# 17. General Rules

- Use a feature-based folder structure.
- Keep all feature-specific code inside its feature.
- Each feature owns its database table definitions.
- Export feature tables as a named `*Tables` object.
- Compose all feature tables in the global `schema.ts` using spread operators.
- Keep tests inside the feature they test.
- Test only public queries and mutations for now.
- Do not write direct unit tests for models, helpers, or internal implementation.
- Use `convex-helpers/server/relationships` for join-like operations and relationship traversal.
- Keep public functions small and focused.
- Keep orchestration readable at a high level.
- Keep entity-specific database knowledge inside the owning feature.
- Cross-feature dependencies are allowed when required by the use case.
- Avoid cross-feature implementation knowledge.
- Prefer meaningful domain APIs over generic abstractions.
- Do not create abstractions solely to reduce line count.
- Do not prematurely create shared helpers.
- Validate all external input.
- Define explicit public return contracts.
- Perform authentication and authorization at public application boundaries.
- Models must not perform authentication or caller-based authorization.
- Never modify files inside `_generated`.
- Follow existing feature patterns before introducing new ones.
- Prefer incremental refactoring over large rewrites.
- Optimize for code that is easy to trace, test, debug, and change.