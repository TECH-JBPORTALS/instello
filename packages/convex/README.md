# Welcome to Convex Backend

This package contains the entire backend for Instello, including authentication powered by Better Auth and Convex.

Before making changes to the `/functions` directory, please review the Convex Best Practices Guide:

- Convex Best Practices: [https://docs.convex.dev/understanding/best-practices/](https://docs.convex.dev/understanding/best-practices/)
- Better Auth Convex Integration: [https://labs.convex.dev/better-auth](https://labs.convex.dev/better-auth)

## Folder Structure

```text
packages/functions
├── __tests__          # Tests for public Convex functions
├── better-auth        # Exposed authentication clients for frontend apps
└── functions          # Convex backend implementation
    ├── _generated     # Auto-generated Convex files (Do not modify)
    └── betterAuth     # Better Auth Convex component
```

## Development Philosophy

We follow Test-Driven Development (TDD).

Before implementing a feature, write tests that describe the expected behavior of the system. Tests should focus on inputs and outputs rather than implementation details (black-box testing).

### Workflow

1. Define the API contract.
2. Write failing tests.
3. Implement the feature.
4. Make tests pass.
5. Refactor if necessary.

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


