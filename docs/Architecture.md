# Cherry Tree Architecture

## Overview

Cherry Tree is a small, cloud-hosted web application.

The architecture should be as simple as practical for development, deployment, hosting, and maintenance.

The initial release will use a **single full-stack Next.js application** connected directly to a managed PostgreSQL database.

`Product.md` defines product behavior. This document defines the technical architecture and should not duplicate product requirements.

## Architecture Principles

1. Prefer the simplest solution that satisfies the current requirements.
2. Do not introduce infrastructure, services, libraries, or abstractions without a demonstrated need.
3. Keep the application as a single deployable application.
4. Use direct SQL rather than an ORM.
5. Use managed cloud services where they eliminate meaningful setup or maintenance.
6. Optimize for features as currently defined rather than hypothetical future requirements.

## Technology Stack

- **Language:** TypeScript
- **Web framework:** Next.js with App Router
- **UI:** React
- **Database:** PostgreSQL
- **Database access:** Direct parameterized SQL
- **PostgreSQL client:** `pg`
- **Application hosting:** Vercel
- **Database hosting:** Neon
- **Package manager:** npm
- **Source control:** Git and GitHub

No ORM will be used.
No PostgreSQL installation is required on the development computer.

## High-Level Architecture

```text
Browser
   | page requests and mutation API requests
   v
Next.js Application
   |-- Server Components
   |-- Client Components
   |-- Route Handlers
   |
   | direct SQL
   v
Neon PostgreSQL
```

The development and production environments each consist of one Next.js application connected to one PostgreSQL database. They use separate databases. Preview deployment behavior is described under Secrets and Configuration.
The browser never connects directly to PostgreSQL.
Route Handlers provide HTTP API endpoints within the Next.js application. There is no separately deployed backend or API service.

## Environments

Use separate Neon databases for development and production.

```text
Development: Browser -> Next.js running locally -> Neon Development Database
Production: Browser -> Next.js on Vercel -> Neon Production Database
```

Local development therefore requires only: Git, Node.js, npm, Internet access. A local PostgreSQL installation is not required.

## Application Structure

Keep the source structure small.
A reasonable initial structure is:

```text
src/
  app/
    api/
    ...
  server/
    db.ts
    ...

database/
  001_migration_initial.sql

docs/
  AIInstructions.md
  API.md
  Architecture.md
  CodingStandards.md
  Database.md
  Product.md
```

Additional directories should be created only when the amount of code makes them useful.
Do not create architectural layers merely to follow a pattern.

## Next.js

Use Next.js for both the UI and server-side application code.

Prefer:

- Server Components for retrieving and rendering server data.
- Route Handlers with explicit HTTP API endpoints for application mutations.
- Client Components only where browser-side interactivity requires them.

Cherry Tree mutations must use Route Handlers under `src/app/api/` rather than Server Actions.
Client Components should call endpoints using ordinary HTTP requests. Prefer POST for application actions; use other HTTP methods when they make the endpoint clearer.

Each Route Handler should:

1. Validate the request on the server.
2. Call a server-side business function, which coordinates product rules and calls database functions as needed.
3. Return an explicit HTTP status and, when the browser needs data, a small JSON response.

The architecture should have a lightweight separation: Route Handler → business function → database function → PostgreSQL.
The endpoint contracts belong in `API.md`.
Use a consistent minimal JSON error shape across endpoints.

Do not use Server Actions for Cherry Tree mutations unless this architecture decision is deliberately revisited.
Server Components may retrieve data directly through server-side database modules. They do not need to call the application's own HTTP endpoints for reads.

For public pages, the server passes People data to the interactive Client Component using a small application data shape containing only the fields needed by the browser: id, parentId, firstName, lastName, birthday, deathday, spouse, and nullable phoneNumber for Genealogy phone details. List View does not render phone information. birthday and deathday are passed as ISO date-only strings in YYYY-MM-DD format. They must remain calendar dates and must not undergo time-zone conversion.

After People data is read from PostgreSQL, the server must test the parent relationships for cycles before deriving genealogy data or returning the data to the client. If a cycle is found, the server must log an error to the `logs` table and return a controlled internal error to the client. If database logging fails, the original cycle error must still be returned and the logging failure must be written to the server console.

Do not create a separate REST, GraphQL, or other backend service. The Route Handlers are part of the same Next.js application and deployment.

Server Components and Route Handlers that access PostgreSQL must use the Next.js Node.js runtime rather than the Edge runtime.

## Database Access

Use the `pg` PostgreSQL client and direct SQL.
Create one small server-only database module that initializes and exports a shared `pg` connection pool. Use Neon’s pooled application connection string. Do not add a separate database framework around it.

SQL must:

- Execute only on the server.
- Use parameters for values supplied by users.
- Be kept out of React UI components.

Keep SQL in server-only files rather than React components. Group related queries together when that improves readability; a separate module for every table or query is not required.

Avoid adding:

- An ORM.
- A repository framework.
- A database abstraction framework.
- Generated database models.
- A query builder.

These can be introduced later if direct SQL becomes difficult to maintain.

## Database Schema

PostgreSQL is the authoritative persistent data store.
The detailed schema belongs in `Database.md`.
Use PostgreSQL primary keys, foreign keys, unique constraints, and check constraints to enforce database invariants where practical.

Current product requirements have no login or user-specific server-side session state.

Do not duplicate detailed table definitions in this document.

## Database Changes

Database changes should be written as ordinary SQL and stored in source control.

Example:

```text
database/
  001_migration_initial.sql
  002_seed_people.sql
  003_migration_example_change.sql
```

Every `.sql` filename must begin with its numeric sequence followed by either `migration` or `seed`, using the format `<number>_migration_<description>.sql` or `<number>_seed_<description>.sql`.
A dedicated migration framework is not required.
Introduce migration tooling only if manually applying versioned SQL becomes burdensome or error-prone.
Migration files must be applied in numeric order. Once a migration has been applied to production, it must not be edited; corrections require a new migration file.

## Application State

Current product requirements have no login or user-specific server-side session state.

Temporary UI state should remain in the browser or React component state when it does not need to survive navigation or refresh.

Do not add:

- Redis.
- A distributed cache.
- A server-side session store.
- A separate state-management system such as Redux.

Use ordinary React state when local browser state is sufficient.

## Administration

The application includes a small administrative UI within the same Next.js application and deployment. Do not create a separate administrative application or service.

The initial administration feature intentionally has no authentication or authorization. Authentication may be added later. Until then, the administrative pages and mutation endpoints are not protected.

Use these pages:

- `/admin/people` for the searchable Admin People List.
- `/admin/people/new` for adding a Person.
- `/admin/people/[id]/edit` for editing a Person.

Use Server Components to load People data for the administrative pages. Use focused Client Components for immediate list filtering, form state, client-side validation, pending-button behavior, and ordinary HTTP calls to mutation Route Handlers.

Administrative reads extend the public Person shape with nullable spouseBirthday and spouseDeathday. Spouse dates are ISO date-only strings and remain excluded from the public query and payload. Shared pure validation and phone helpers support the form, server save operation, and public phone formatting.

The Admin People List search value should be stored in the URL query string so it can be preserved when returning from an Add Person or Edit Person page.

The administrative pages use the `search` query parameter, for example `/admin/people?search=Cherry`. Typing in the Search box immediately filters the People already loaded in the browser and updates the address bar. Each keystroke does not reload the page, call an API, or query the database; filtering happens locally in the browser.

The URL preserves the Search text across a refresh and when returning from Add Person or Edit Person. Add and Edit links carry the value forward. Refreshing the page or returning from a form still makes a server request to load fresh People data, then the browser applies the preserved Search text.

Updating browser history means replacing the current history entry with `window.history.replaceState`, rather than adding an entry for each keystroke. Pressing Back therefore does not step through every letter typed into the Search box.

Successful creation refreshes server-provided Parent options while keeping the cleared form and confirmation visible.

The Add Person and Edit Person pages may receive the People data needed to construct Parent options during server rendering. The client may filter those options based on the entered Birthday and the Person's descendants, but the server remains authoritative and must validate Parent eligibility and cycle prevention before writing.

The administrative UI supports creating and editing People only. It does not support deletion.

## Business Logic

Product rules that affect trusted or persistent behavior must be enforced on the server, using straightforward TypeScript, SQL, or PostgreSQL constraints as appropriate. Keep related code together and extract reusable functions only when useful.

Keep Route Handlers focused on HTTP concerns. Put product rules and operation coordination in small server-side business functions. Business functions may call small database functions containing direct parameterized SQL. Do not introduce additional service, repository, use-case, or dependency-injection layers.

Keep rules that do not require database access as ordinary TypeScript functions when practical.

Derive presentation-only values in client-side pure TypeScript functions. Age and Upcoming Birthday calculations must use the browser's local calendar date as defined in `Product.md`. Pass Birthday and Death Day to the client as date-only values without time-zone conversion. The server does not calculate or supply today's date.

Represent Birthday and Death Day when passed from the server to the client as ISO date-only strings in YYYY-MM-DD format, for example 1947-05-17. These values represent calendar dates, not moments in time.

Client code must parse and manipulate them as year, month, and day values. Do not convert them to or from UTC, apply a time-zone offset, or treat them as timestamps.

Because Next.js Client Components may participate in the initial server render, the authoritative value of today's date must not be established during server rendering. After the interactive Client Component mounts in the browser, determine today's calendar date from the browser's local time zone and use that value for all date-dependent client calculations, including Age and Upcoming Birthday.

Treat today as a calendar date (year, month, and day), not as a UTC timestamp or server time. The server does not need to know or receive today's date.

Admin date validation on the client side and server are handled separately. This means that near midnight, the client side validation may pass because it uses the browser's date/time, but the server may fail the validation. This edge case is ok.

This makes them easier to understand and test without creating a formal business-logic framework.

## Transactions

Use PostgreSQL transactions only where multiple database changes must succeed or fail together to preserve valid data.

Person creation and editing require reading existing relationship data, validating product rules, and then writing. Perform the authoritative validation and write through the same checked-out database client within a short transaction, as defined in `Database.md`.

Do not wrap ordinary single-statement operations in unnecessary transactions.

## Concurrency

The expected initial audience is small.

Do not introduce distributed locking or other specialized concurrency infrastructure.

Use normal PostgreSQL constraints and transactions where correctness requires them.

More sophisticated concurrency controls should be added only if actual usage demonstrates a problem.

- The browser should disable an action button while its request is pending to reduce accidental duplicate requests.
- No idempotency-key framework is required initially.

## Validation

Validate all untrusted request data on the server. Validation is required before using input in database operations or business logic.

Client-side validation may also be used when it improves the user experience, but it should remain simple.

Do not introduce a separate validation framework unless native TypeScript/application validation becomes cumbersome.

## Secrets and Configuration

The application requires at least a PostgreSQL connection string.

Database credentials must not be committed to Git.

Use:

- `.env.development.local` for the development database connection.
- Vercel environment variables for the production database connection.

Any future credentials or authentication secrets should be handled the same way.

Vercel preview deployments must not receive the production database connection string. Initially, previews may use the development database or have no database configured.

## Error Handling

Handle expected errors with simple user-facing messages.
If a relationship cycle is detected after People data is read, log the error to the `logs` table and return a controlled internal error to the client.
Do not create a custom error-handling framework.

## Logging and Monitoring

Write server-side errors and operational warnings to the PostgreSQL `logs` table when the database is available. Errors use the default `error` severity; warnings use severity `warning`. If database logging fails, write the error to the server console without retrying the database write.
Do not introduce another logging, monitoring, tracing, or observability service.

## Testing

Testing should concentrate on logic where mistakes would affect product behavior.

Date-dependent unit tests should accept today's calendar date as an explicit input rather than reading the current system clock. This allows Age and Upcoming Birthday behavior to be tested deterministically, including year boundaries and other date edge cases.

### Unit Tests

Add focused unit tests for pure product logic where edge cases could affect visible behavior, particularly age calculations, birthday ordering, sorting, searching, and genealogy grouping. Broad coverage targets are not required.

## Deployment

Production deployment is:

```text
GitHub
   |
   v
Vercel
   |
   v
Next.js
   |
   v
Neon PostgreSQL
```

Vercel deploys the Next.js application from GitHub.

Neon hosts PostgreSQL separately.

No production server needs to be manually maintained.

## Initial Release Non-Goals

Do not introduce any of the following:

- Separate frontend and backend applications.
- Separate API service.
- Microservices.
- ORM.
- Query builder.
- Local PostgreSQL.
- Docker.
- Kubernetes.
- Redis.
- Message queues.
- GraphQL.
- WebSockets.
- Serverless infrastructure beyond what the hosting platform provides automatically.
- Dedicated authentication framework.
- Separate administrative application or deployment.
- Dedicated migration framework.
- Repository pattern.
- Dependency injection framework.
- Distributed caching.
- Dedicated logging platform.
- Dedicated monitoring platform.
- Dedicated analytics infrastructure.
- Search engine.
- CDN configuration beyond hosting defaults.

## When to Add Complexity

A technology or architectural layer should be added only when:

1. An existing Product.md requirement cannot reasonably be implemented without it; or
2. The current implementation has demonstrated a concrete maintainability, reliability, security, performance, or operational problem.

Do not add infrastructure merely because it may become useful someday.
