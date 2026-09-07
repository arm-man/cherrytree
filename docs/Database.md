# Cherry Tree Database

## Overview

Cherry Tree uses PostgreSQL as its authoritative persistent data store.

This document defines the database schema, database-enforced invariants, deletion behavior, indexes, and migration conventions. Product behavior belongs in `Product.md`; application structure and database-access rules belong in `Architecture.md`.

The schema is intentionally small and uses ordinary PostgreSQL tables, constraints, and indexes. The application accesses it with direct parameterized SQL through the `pg` client. No ORM, query builder, stored-procedure layer, or dedicated migration framework is required.

## Design Principles

1. Store only durable product state.
2. Use primary keys, foreign keys, unique constraints, and check constraints for invariants PostgreSQL can express simply.
3. Keep multi-table product rules in straightforward TypeScript and transactions rather than forcing them into triggers.
4. Prefer simple, normalized tables that directly represent current product concepts. Avoid abstractions intended only for hypothetical future requirements.

## Naming and Data-Type Conventions

- Use `snake_case` for tables, columns, constraints, and indexes.
- Use plural table names.
- Use `integer GENERATED ALWAYS AS IDENTITY` primary keys.
- Use `text` for user-entered and administrator-entered text unless a real database limit is required.
- Use `timestamptz` for timestamps. Configure application/database sessions to use UTC.
- Use `created_at` for creation time and specific timestamps such as `completed_at` where they represent a product event.
- Let PostgreSQL generate identifiers and timestamps.
- Do not use PostgreSQL enums initially; small `text` or `char` fields with check constraints are easier to change through ordinary SQL migrations.
- UUIDs are not needed for the current architecture because identifiers are created by one PostgreSQL database and do not need to be globally unique.

## Tables

### `people`

Stores one row for each Cherry Kin.

| Column            | Type               | Null | Purpose                                                                                                            |
| ----------------- | ------------------ | ---- | ------------------------------------------------------------------------------------------------------------------ |
| `id`              | `integer` identity | No   | Primary key.                                                                                                       |
| `parent_id`       | `integer`          | Yes  | The id of the Cherry Kin's immediate parent. When NULL it is the single top-level Cherry Kin that has no immediate parent. |
| `first_name`      | `text`             | No   | The first name of the Cherry Kin.                                                                                      |
| `last_name`       | `text`             | No   | The last name of the Cherry Kin.                                                                                       |
| `birthday`        | `date`             | No   | The birth date of the Cherry Kin.                                                                                      |
| `deathday`        | `date`             | Yes  | The date of death of the Cherry Kin.                                                                                   |
| `phone_number`    | `text`             | Yes  | Optional U.S. phone number, stored as 10 digits.                                                                   |
| `created_at`      | `timestamptz`      | No   | Cherry Kin creation time. Use DEFAULT NOW().                                                                           |

Constraints:

- Primary key on `id`.
- Phone Number is nullable. Phone format validation belongs to the application, with no database format constraint.
- parent_id is a self-referencing foreign key to people(id).
- Use the default non-cascading foreign-key behavior so PostgreSQL prevents deleting a Cherry Kin while another Cherry Kin references that Cherry Kin as a parent.
- parent_id may be NULL only for the single top-level Cherry Kin.

After Cherry Kin data is read from the database, the server must test the parent relationships for cycles before deriving descendants or returning the data to the client. If a cycle is found, the server must write an error to the `logs` table and return a controlled internal error to the client. The server must also test that exactly one root (parent_id of NULL) exists.

### `partners`

Stores one Spouse per row, separate from people.

| Column     | Type             | Null | Purpose                          |
| ---------- | ---------------- | ---- | -------------------------------- |
| id         | integer identity | No   | Primary key, generated always.   |
| partner_id | integer          | No   | Associated Cherry Kin people.id. |
| first_name | text             | No   | Spouse first name.               |
| last_name  | text             | No   | Spouse last name.                |
| birthday   | date             | Yes  | Spouse birth date.               |
| deathday   | date             | Yes  | Spouse death date.               |
| created_at | timestamptz      | No   | Defaults to NOW().               |

partners_partner_id_fkey references people(id) ON DELETE CASCADE. partners_deathday_requires_birthday_check requires deathday IS NULL OR birthday IS NOT NULL. There is no uniqueness constraint on partner_id. The admin application offers no deletion operations.

The table already exists and migration files are managed externally. Public spouse behavior reads `partners`; administrative spouse behavior reads and writes `partners`. Legacy spouse columns remain physically present on `people` until Phase 3, but are not read or synchronized by application spouse behavior. Phase 2 does not change database, migration or seed files.

### `logs`

Stores server-side error, warning, and informational messages for operational troubleshooting.

| Column       | Type          | Null | Purpose                                                                                        |
| ------------ | ------------- | ---- | ---------------------------------------------------------------------------------------------- |
| `severity`   | `text`        | No   | Log severity. Use `DEFAULT 'error'`; warnings use `warning`; informational actions use `info`. |
| `message`    | `text`        | No   | Non-sensitive log details.                                                                     |
| `created_at` | `timestamptz` | No   | Log creation time. Use `DEFAULT NOW()`.                                                        |

The application must not store credentials, connection strings, or other secrets in log messages.

## Derived Data and Queries

### Age

Age is derived, not stored. It uses birthday and deathday for deceased Cherry Kin, or birthday and today's date for living Cherry Kin. See `Product.md` for Age display and death details.

### Children, Grandchildren, Great Grandchildren, and Great Great Grandchildren

A Cherry Kin's progeny can be derived from parent_id.

## Transactions

Creating or editing a Cherry Kin requires authoritative validation against existing Cherry Kin data followed by a write. Perform the validation and write through the same checked-out PostgreSQL client within a short transaction.

The transaction must:

1. Read the existing Cherry Kin data needed to validate the submitted Cherry Kin and parent relationship.
2. For an edit, verify that the Cherry Kin exists and that at least one editable value changed.
3. Validate the date, Parent, single-root, and cycle-prevention rules described below.
4. Insert or update the Cherry Kin using parameterized SQL.
5. Commit only if all validation and the write succeed; otherwise roll back.

No distributed locking or idempotency-key mechanism is required for the expected usage.

Administrative transactions acquire a PostgreSQL `SHARE ROW EXCLUSIVE` lock on `people` before reading. This serializes writers so validation and the resulting write use a consistent parent graph, while ordinary page reads remain available. The transaction uses UTC for authoritative current-date validation and releases its client after commit or rollback.

Spouse saves reuse the short admin transaction and people writer lock. Read Cherry Kin to validate the association, verify the partners row exists on edit, reject unchanged edits, validate fields/dates, write only partners, and add an informational log before commit. The selected people.id must exist. Birthday is optional; Death Day requires Birthday. Other date rules match Product.md.

## Indexes

No additional indexes are required initially. The initial page load reads all Cherry Kin records, and sorting, searching, child counts, genealogy grouping, and cycle detection are performed after the read rather than by database queries. Add an index only if a later access pattern or measured performance problem justifies it.

## Deletion and Update Rules

A Cherry Kin cannot be deleted while another Cherry Kin references that Cherry Kin through parent_id.

Do not use cascading deletes for the people parent relationship. If a referenced parent must be deleted, the affected child relationships must first be deliberately updated or removed.

The initial administrative UI does not support deletion.

For administrative creation and editing:

- Trim First Name and Last Name and reject either value when it is null or blank.
- Birthday is required and must not be in the future.
- Death Day is nullable. When provided, it must not be before Birthday or in the future.
- A blank Death Day is stored as null.
- Phone Number is nullable; blank values become null. Normalize and validate phones using Product.md. 
- id=1 must have parent_id of null. Every other Cherry Kin must have a non-null parent_id that references an existing Cherry Kin.
- The proposed Parent must have been at least 15 years old on the Cherry Kin's Birthday.
- A Cherry Kin cannot be their own Parent.
- A Cherry Kin's descendant cannot become that Cherry Kin's Parent.
- Every successful write must preserve exactly one root and an acyclic parent graph.
- An edit that does not change any editable value must be rejected without issuing an update.

## Manual Database Smoke Tests

Perform manual smoke tests against the development database. See `AdminPeopleSmokeTests.md` for the checklist. Assume the externally managed partners table already exists. Do not change migration or seed files as part of application verification.
