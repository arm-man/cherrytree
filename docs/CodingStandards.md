# Cherry Tree Coding Standards

## Purpose

These standards are for Cherry Tree: a small web application used by a handful of people each day.

The priorities are:
1. Get a correct, usable application online quickly.
2. Keep the code simple enough for a human to review and maintain.
3. Protect important data and server boundaries.
4. Add complexity only after the application demonstrates a need for it.

`Product.md` defines product behavior. `Architecture.md` defines the technical architecture. `Database.md` defines the database design. `API.md` defines HTTP contracts. This document defines how the code should be written.

## General Principles

- Prefer straightforward code over clever code.
- Implement current requirements rather than hypothetical future requirements.
- A little duplication is acceptable when it is clearer than an abstraction.
- Keep authoritative product rules on the server.
- Follow the basic flow in `Architecture.md`: Route Handler → business function → database function → PostgreSQL.
- Do not add a framework, architectural layer, or dependency unless it solves a current problem.
- Optimize for clarity and correctness, not high scale. The initial application does not need to support thousands of simultaneous users.
- Add comments to the code especially to help explain why the code was written, not just what it does. Add strong explanatory comments where the code performs something non-obvious.

## TypeScript

- Use TypeScript with strict mode enabled.
- Avoid `any`. Use `unknown` and narrow it when a value's type is not known.
- Give function parameters and exported functions explicit types.
- Let TypeScript infer local variable types when the result is clear.
- Avoid type assertions (`as`) and non-null assertions (`!`) merely to silence compiler errors.
- Use `null` for deliberate absence in stored data or API contracts. Use `undefined` mainly for omitted optional TypeScript values.
- Prefer string-literal unions to enums unless an enum provides a specific benefit.

```ts
type GuessResult = "correct" | "incorrect";
```

## Formatting and Basic Checks

Use the standard Next.js ESLint configuration, Prettier, and the TypeScript compiler. Do not spend time manually formatting code.

Before handing off a completed change, run the checks that apply:

```text
npm run lint
npm run typecheck
```

Run unit tests when the changed code has unit tests. A project-wide test command is not required until the project has tests worth running.

Do not disable a lint rule project-wide to avoid one local issue. A narrow suppression is acceptable when accompanied by a short explanation.

## Naming

Use names that describe the product concept or action. Prefer recognizable words over abbreviations.

| Item | Convention | Example |
| --- | --- | --- |
| Variables and functions | `camelCase` | `rootCherryKinId`, `sortCherryKin` |
| React components and TypeScript types | `PascalCase` | `CherryKinTable` |
| Fixed configuration constants | `UPPER_SNAKE_CASE` | `MAX_ACTIVE_SESSIONS` |
| React component files | `PascalCase.tsx` | `QuestionCard.tsx` |
| Other TypeScript files | `kebab-case.ts` | `guess-evaluation.ts` |
| Database tables and columns | `snake_case` | `people`, `completed_at` |
| API path segments | Lowercase | `/api/sessions`, `/abandon` |

- Use singular names for one value and plural names for collections.
- Name booleans as questions or states, such as `isCorrect`, `hasCompleted`, or `canSkip`.
- Functions that perform an action should normally begin with a verb.
- Use the product terminology from the design documents consistently.

## Files, Imports, and Functions

- Keep the source structure small.
- Keep browser-independent server code under `src/server/`.
- Mark server-only modules with `import "server-only"` when importing them into browser code could expose server behavior or secrets.
- Keep SQL out of React components and Route Handlers.
- Split a file only when it becomes difficult to understand or contains unrelated responsibilities.
- Avoid circular imports and broad barrel files.
- Prefer named exports. Use default exports where Next.js expects them.
- Remove unused imports and exports.
- Use `import type` for type-only imports.

Use the `@/*` path alias for imports from `src/*` when it is clearer than a long relative path.

```ts
import { getSession } from "@/server/sessions";
```

Use relative imports for files in the same directory or when the relative path is short and clear.

Write functions with a clear purpose. Prefer early returns when they reduce nesting. Do not catch an error unless the function can recover, translate the error, or add useful context.

## React and Next.js

- Use Server Components by default.
- Add `"use client"` only when browser state, event handlers, effects, or browser APIs require it.
- Keep direct SQL and connection-pool access out of React components.
- Do not add a global state framework unless the application develops a clear need for one.
- Use React state only for browser state that does not need to survive a refresh.
- A Server Component may call server-side functions directly instead of calling the application's own HTTP API.

Use semantic HTML, label form controls, support keyboard use, retain visible focus indicators, and use buttons for actions and links for navigation. These basic practices are expected; a formal accessibility certification process is not required for the initial release.

## Route Handlers and Validation

Use Next.js Route Handlers under `src/app/api/` for application mutations.

A Route Handler should normally:

1. Read and validate the request.
2. Call a server-side business function.
3. Return the response defined in `API.md`.

Route Handlers should not contain substantial product logic or direct SQL.

- Treat URL parameters, JSON bodies, cookies, headers, and query strings as untrusted.
- Validate required values, types, permitted values, and meaningful product limits on the server.
- Client validation improves usability but does not replace server validation.
- Manual validation is acceptable. Do not add a validation framework unless validation becomes repetitive or difficult to maintain.
- Return controlled client errors for invalid requests.
- Do not expose SQL errors, stack traces, secrets, or other internal details.

## Business and Database Code

- Put authoritative product rules in ordinary server-side functions or pure TypeScript functions.
- Keep HTTP details out of business functions.
- Keep SQL in database functions.
- Do not introduce formal service, repository, use-case, domain, or dependency-injection frameworks. Ordinary modules and functions are sufficient.
- Extract shared code when it represents the same important rule, not simply to remove a few repeated lines.

Use `pg` and direct, parameterized PostgreSQL SQL.

- Use one shared, server-only connection pool.
- Never create a connection pool per request or expose a connection string to browser code.
- Parameterize all values that are not fixed SQL syntax. Never concatenate untrusted values into SQL.
- List needed columns instead of using `SELECT *`.
- Do not return raw database rows directly from public APIs.
- Use a transaction when multiple statements must succeed or fail together, and execute all of its statements through the same database client.
- Keep transactions short and release checked-out clients in a `finally` block.

Store numbered SQL files under `database/`. Name every SQL file `<number>_migration_<description>.sql` or `<number>_seed_<description>.sql`, such as `003_migration_add_address.sql` or `004_seed_more_people.sql`. Apply migrations in order. After a migration has been applied to production, correct it with a new migration rather than editing it.

## Errors, Logging, and Security

- Handle expected conditions, such as invalid input, with controlled application errors.
- Write unexpected server failures to the `logs` table with the default `error` severity and enough non-sensitive context to diagnose them.
- Write operational warnings to the `logs` table with severity `warning`.
- Return a generic error to the browser for unexpected failures.
- Do not swallow exceptions or log the same failure at several layers.
- Do not add another logging or monitoring system for the initial release.
- Store secrets and environment-specific settings in environment variables.
- Do not commit `.env.development.local`, credentials, connection strings, tokens, or production data.
- Never put secrets in variables prefixed with `NEXT_PUBLIC_`.

## Testing

Testing should reduce risk without becoming a second project to design and maintain.

Test observable behavior, not private implementation details.
Avoid mocks and complicated test setup. If a test needs extensive scaffolding, use manual verification instead.

## Dependencies

- Prefer built-in capabilities from the platform, React, Next.js, TypeScript, Node.js, or PostgreSQL.
- Add a package only when it saves meaningful effort and remains understandable.
- Commit `package-lock.json`, but do not edit it manually.
- Remove unused packages.
- Do not add an ORM, query builder, validation framework, state framework, dependency-injection framework, or observability platform without first revisiting `Architecture.md`.

## Git and Human Review

- Do not mix unrelated refactoring with a behavior change.
- Update documentation when a product, architecture, database, or API decision changes.
- The AI may modify files and run checks, but must not commit or push; a human reviews and may edit the changes before committing and pushing them.

Before handing off code, the AI should:

1. Review the diff.
2. Run applicable linting and type-checking commands.
3. Run relevant existing tests, if any.
4. Briefly report changed files, results, and any check not run or not passed.

## Definition of Done

A change is complete when it:

1. Implements the relevant documented behavior.
2. Validates untrusted server input and uses parameterized SQL where applicable.
3. Handles errors without exposing internal details.
4. Passes the applicable lightweight checks and relevant existing tests.
5. Does not introduce unnecessary dependencies, layers, or unrelated changes.
6. Has been handed to a human for review before commit and deployment.
