# Convex Backend Agent Instructions

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

Before making any changes to Convex code, **always read**:

```
functions/_generated/ai/guidelines.md
```

The guidelines in that file take precedence over any existing Convex knowledge.

Never modify anything inside `_generated`.

<!-- convex-ai-end -->

# Overview

This package contains the complete backend for Instello.

It follows a layered architecture:

```
Frontend
    ↓
Public Functions (Authentication, Authorization, Validation)
    ↓
Model Layer (Domain Logic + Database Operations)
    ↓
Convex Database
```

Every feature should preserve this separation.

---

# Folder Structure

```
packages/convex
├── better-auth/             # Frontend authentication exports
└── functions/
    ├── _generated/          # Generated Convex files (Never modify)
    ├── betterAuth/          # Better Auth component
    ├── helpers/             # Shared reusable helpers
    ├── model/               # Domain models
    ├── seed/                # Seed functions
    ├── tests/               # Public API tests
    ├── auth.ts
    ├── http.ts
    ├── schema.ts
    └── ...
```

---

# Development Philosophy

We follow Test-Driven Development.

Workflow:

1. Update schema if required.
2. Create the public function.
3. Write tests.
4. Implement the model.
5. Make tests pass.
6. Refactor.

Prefer black-box testing over implementation testing.

---

# Architecture Rules

## Public Functions

Public functions inside `functions/` are the application's entry points.

Responsibilities:

- Validate arguments
- Define return validators
- Authenticate users
- Authorize permissions
- Verify institution/organization access
- Orchestrate one or more model operations
- Return DTOs

Public functions should remain thin.

Avoid implementing domain logic inside public functions. Don't create any helpers inside the functions if you need to check entity existenance directly add line of code instead of making abstraction out of it.

Example:

instead of this

export const updateName = insQuery({
    permission:["program:update"],
    args:{
        id: vv.string(),
        body: vv.object({
            name: vv.string()
        })
    },
    handler: async (ctx,args)=>{
        const program = await ensureProgramInInstitution(ctx,args.id,ctx.session.activeInstiutionId);
        await Program.patch(args.id,args.body)
    }
})

do this

export const updateName = insQuery({
    permission:["program:update"],
    args:{
        id: vv.string(),
        body: vv.object({
            name: vv.string()
        })
    },
    handler: async (ctx,args)=>{
        const program = await Program.getById(ctx,args.id,ctx.session.activeInstituion.id);
        if(!program) throw new ConvexError(ERROR_CODES.PROGRAM.NOT_FOUND);
        await Program.patch(args.id,args.body)
    }
})

it's more readable than before one.

---

## Model Layer

Every entity should have its own model.

Example:

```
model/
    student.ts
    faculty.ts
    program.ts
```

Models are responsible for:

- Database operations
- Domain business rules
- Domain invariants
- Reusable queries
- DTO mapping

Models must NOT:

- Authenticate users
- Check permissions
- Read session information
- Perform institution membership checks
- Depend on frontend concepts

Models should be reusable from multiple public functions.

---

# DTO Pattern

Every model should expose a DTO.

Example:

```
ProgramDtoSchema

type ProgramDto

toDto(program)
```

Public functions should return DTOs instead of manually constructing response objects.

Do not duplicate response mapping across multiple functions.

---

# Validation

Entity validators belong beside the model.

Example:

```
model/program.ts

CreateSchema
PatchSchema
ProgramDtoSchema
```

Avoid defining entity validators inside public function files.

---

# Session Ownership

Clients must never provide values derived from the authenticated session.

Examples:

- institutionId
- organizationId
- createdBy
- updatedBy
- ownerId

These values must always come from `ctx.session`.

---

# Model Design

Prefer small reusable functions.

Example:

```
create()

list()

getById()

findByEmail()

findByAlias()

patch()

toDto()
```

Avoid large functions that perform multiple unrelated operations.

---

# Database Access

Use:

```
ctx.db.get(id)
```

when querying by `_id`.

Use indexes only for non-primary key lookups.

---

# Error Handling

Models should throw domain errors only.

Examples:

- Student not found
- Faculty already exists
- Duplicate email
- Duplicate USN

Permission errors belong in public functions.

Keep entity based errors in helpers/errors file with it's entity name
Example:
    PROGRAM: {
        NOT_FOUND: {code:"PROGRAM_NOT_FOUND", message: "Program not found"}
        }
    FACULTY: {
        NOT_FOUND: {code:"FACULTY_NOT_FOUND", message: "Faculty not found"},
        FACULTY_EMAIL_ALREADY_EXISTS: {code:"FACULTY_EMAIL_ALREADY_EXISTS, message:"Faculty email already exists"}
    }

keep base erros related some authorization in BASE


---

# Helpers

Shared logic belongs inside `functions/helpers`.

Examples:

- permission helpers
- institution helpers
- slug validation
- pagination helpers
- common validators

Before creating a helper, search the project for an existing implementation.

Do not duplicate helper logic.

---

## Testing Guidelines

Write tests that are easy to read, maintain, and extend.

### Test Behaviour

Test public functions as black-box APIs.

Focus on:

- successful execution
- authentication
- authorization
- validation failures
- resource not found
- duplicate constraints
- edge cases

Avoid testing implementation details.

---

### Keep Tests DRY

Avoid duplicating setup across tests.

Extract common setup into reusable helper functions.

Examples:

- `createTest()`
- `seedOwners()`
- `seedInstitutions()`
- `seedPrograms()`
- `seedFaculty()`
- `signInAsOwner()`

Reuse existing helpers before creating new ones.

---

### One Responsibility Per Test

Each test should verify one behaviour.

Good:

```ts
it("creates a faculty member")
```

```ts
it("rejects duplicate email")
```

```ts
it("requires authentication")
```

Avoid testing multiple unrelated behaviours in the same test.

---

### Prefer Readable Setup

Keep Arrange / Act / Assert sections obvious.

Avoid large inline object literals repeated across multiple tests.

Extract reusable fixtures where appropriate.

Example:

```ts
const faculty = createFacultyInput();
```

instead of repeating the same object dozens of times.

---

### Minimize Seed Data

Seed only the data required for the scenario being tested.

Avoid creating unnecessary organizations, institutions, programs, or users.

---

### Avoid Magic Values

Prefer descriptive constants over random strings.

Example:

```ts
const EMAIL = "john@example.com";
const PROGRAM_NAME = "Computer Science";
```

instead of repeating literals throughout the file.

---

### Test Helpers

If multiple test files require the same setup, move it into `tests/test.helpers.ts`.

Do not duplicate seed logic between test files.

---

### Keep Tests Independent

Every test must be able to run independently.

Never depend on execution order or data created by another test.

---

### Keep Tests Fast

Avoid unnecessary database operations and repeated setup.

Reuse helper functions rather than duplicating expensive initialization.

---

### Naming

Describe behaviour rather than implementation.

Good:

- creates a faculty member
- rejects duplicate email
- updates personal information
- returns faculty by id
- requires institution access

Avoid names such as:

- test create
- update works
- patch test

---

### Refactoring

When modifying tests:

- remove duplicated setup
- extract reusable fixtures
- simplify assertions
- improve readability

Never duplicate code simply to make a test pass.

---

# Naming Conventions

Models:

```
Student.create()

Student.list()

Student.getById()

Student.patch()

Student.toDto()
```

Avoid generic names like:

```
updateEntity()

save()

execute()

process()
```

Function names should clearly describe their behaviour.

---

# AI Agent Rules

Always follow the existing architecture before introducing a new pattern.

When implementing a new entity:

1. Update schema.
2. Create the model.
3. Create public functions.
4. Write tests.
5. Reuse existing helpers.
6. Return DTOs.

Never introduce:

- repositories
- service layers
- controllers
- dependency injection
- generic CRUD abstractions

unless explicitly requested.

Prefer consistency over clever abstractions.

If similar functionality already exists elsewhere in the project, follow that implementation style instead of inventing a new one.

When uncertain, choose the simpler solution that matches the existing codebase.