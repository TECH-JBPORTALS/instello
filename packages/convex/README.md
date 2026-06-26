# Welcome to Convex Backend

This package contains the entire backend for Instello, including authentication powered by Better Auth and Convex.

Before making changes to the `/functions` directory, please review the Convex Best Practices Guide:

- Convex Best Practices: [https://docs.convex.dev/understanding/best-practices/](https://docs.convex.dev/understanding/best-practices/)
- Better Auth Convex Integration: [https://labs.convex.dev/better-auth](https://labs.convex.dev/better-auth)

## Folder Structure

```text
packages/convex
├── better-auth                # Exposed authentication clients for frontend apps
└── functions                  # Convex backend implementation
    ├── _generated             # Auto-generated Convex files (Do not modify)
    ├── betterAuth             # Better Auth Convex component
    ├── helpers                # Helper functions
    ├── seed                   # Seed internal functions (can only run using terminal/dashboard)
    ├── model                  # Entity models containing buisness logic
    ├── tests                  # Public functions tests
    ├── auth.config.ts         # Better auth local install config
    ├── auth.ts                # Better auth config + auth public functions
    ├── convex.config.ts       # Convex config for app
    ├── http.ts                # Register HTTP routes
    ├── schema.ts              # App schema file
    └── ... you functions goes here

```

## Development Philosophy

We follow Test-Driven Development (TDD).

Before implementing a feature, write tests that describe the expected behavior of the system. Tests should focus on inputs and outputs rather than implementation details (black-box testing).

# Development Workflow (TDD)

Follow this workflow for every feature.

1. Define or update the Convex schema.
2. Create the public API function in `functions/`.
  - Define arguments.
  - Define return type.
  - Add JSDoc.
3. Create the corresponding test file.
4. Write failing test cases for every public method.
5. Implement the business logic inside `functions/model`.
6. Make all tests pass.
7. Refactor if needed.

### Model Layer

The `model` layer should:

- contain database operations
- contain business logic
- never perform authentication
- never perform authorization
- clearly document every exported method

### Public Functions

Public Convex functions should:

- validate inputs
- perform authentication
- perform authorization
- call model methods
- define clear input/output types
- include JSDoc

### Helpers

If logic is shared:

- place it inside `functions/helpers`
- write tests if the helper contains non-trivial logic or could easily regress and cause bugs/break the part of the application in nearer future

---

## Testing

We use Vitest for unit and integration testing.

Documentation:
[https://vitest.dev/guide/](https://vitest.dev/guide/)

### Example

```ts
describe("Create Student", () => {
  it("creates a student");
  it("rejects duplicate USNs");
  it("requires authentication");
  it("requires institution access");
});
```

## Guidelines

- Keep functions small and focused.
- Prefer reusable helpers over duplicated logic.
- Validate all external input.
- Use shared auth guards whenever possible.
- Never modify files inside `_generated`.
- Write tests for all public functions.
- Follow existing patterns before introducing new ones.

