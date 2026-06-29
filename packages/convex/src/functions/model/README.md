# Welcome to the `model` Folder

This folder contains the core data access layer and domain business logic for each entity.

The functions in this folder should focus on:

- Database interactions
- Data validation
- Domain business rules
- Entity-specific operations

Examples:

- Creating a student record
- Promoting students to the next semester
- Calculating attendance percentages
- Assigning subjects to sections

## Responsibilities

Functions inside this folder **must not** perform:

- Authentication
- Authorization
- Role checks
- Organization access checks
- Institution access checks

These responsibilities belong to the public functions inside the `functions` folder, which act as the application's entry points.

## Architecture

```text
Frontend
    ↓
functions/       (Auth, permissions, resource access)
    ↓
model/           (Business logic, database operations)
    ↓
Convex Database
```

This separation keeps business logic reusable, testable, and independent from access-control concerns.

## Guidelines

- Keep functions focused on a single responsibility.
- Avoid duplicating business rules across modules.
- Do not access frontend-specific concepts.
- Prefer reusable model functions over direct database access in public functions.
- Write tests for complex business rules and calculations.