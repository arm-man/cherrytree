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

Stores one row for each Cherry Kin. Public terminology remains Person during Phase 1.

| Column            | Type               | Null | Purpose                                                                                                            |
| ----------------- | ------------------ | ---- | ------------------------------------------------------------------------------------------------------------------ |
| `id`              | `integer` identity | No   | Primary key.                                                                                                       |
| `parent_id`       | `integer`          | Yes  | The id of the Person's immediate parent. When NULL it is the single top-level Person that has no immediate parent. |
| `first_name`      | `text`             | No   | The first name of the Person.                                                                                      |
| `last_name`       | `text`             | No   | The last name of the Person.                                                                                       |
| `birthday`        | `date`             | No   | The birth date of the Person.                                                                                      |
| `deathday`        | `date`             | Yes  | The date of death of the Person.                                                                                   |
| `spouse`          | `text`             | Yes  | The Person's spouse.                                                                                               |
| `phone_number`    | `text`             | Yes  | Optional U.S. phone number, stored as 10 digits.                                                                   |
| `spouse_birthday` | `date`             | Yes  | Optional spouse birth date.                                                                                        |
| `spouse_deathday` | `date`             | Yes  | Optional spouse death date.                                                                                        |
| `created_at`      | `timestamptz`      | No   | Person creation time. Use DEFAULT NOW().                                                                           |

Constraints:

- Primary key on `id`.
- `people_spouse_deathday_requires_birthday_check`: `spouse_deathday IS NULL OR spouse_birthday IS NOT NULL`.
- Phone Number and the retained legacy spouse columns are nullable. Phone format validation belongs to the application, with no database format constraint. Phase 1 migration files are handled externally; application work must not modify database/ files.
- parent_id is a self-referencing foreign key to people(id).
- Use the default non-cascading foreign-key behavior so PostgreSQL prevents deleting a Person while another Person references that Person as a parent.
- parent_id may be NULL only for the single top-level Person.

After People data is read from the database, the server must test the parent relationships for cycles before deriving descendants or returning the data to the client. If a cycle is found, the server must write an error to the `logs` table and return a controlled internal error to the client. The server must also test that exactly one root (parent_id of NULL) exists.

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

The table already exists and migration files are managed externally. Phase 1 admin reads/writes partners and omits legacy spouse columns from all people queries and saves. Those columns remain for public behavior; no synchronization is performed. Later phases migrate public behavior and finally remove legacy columns.

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

Age is derived, not stored. It uses birthday and deathday for deceased People, or birthday and today's date for living People. See `Product.md` for Age display and death details.

### Children, Grandchildren, Great Grandchildren, and Great Great Grandchildren

A Person's progeny can be derived from the parent_id.

## Transactions

Creating or editing a Person requires authoritative validation against existing People data followed by a write. Perform the validation and write through the same checked-out PostgreSQL client within a short transaction.

The transaction must:

1. Read the existing People data needed to validate the submitted Person and parent relationship.
2. For an edit, verify that the Person exists and that at least one editable value changed.
3. Validate the date, Parent, single-root, and cycle-prevention rules described below.
4. Insert or update the Person using parameterized SQL.
5. Commit only if all validation and the write succeed; otherwise roll back.

No distributed locking or idempotency-key mechanism is required for the expected usage.

Administrative transactions acquire a PostgreSQL `SHARE ROW EXCLUSIVE` lock on `people` before reading. This serializes writers so validation and the resulting write use a consistent parent graph, while ordinary page reads remain available. The transaction uses UTC for authoritative current-date validation and releases its client after commit or rollback.

Spouse saves reuse the short admin transaction and people writer lock. Read Cherry Kin to validate the association, verify the partners row exists on edit, reject unchanged edits, validate fields/dates, write only partners, and add an informational log before commit. The selected people.id must exist. Birthday is optional; Death Day requires Birthday. Other date rules match Product.md.

## Indexes

No additional indexes are required initially. The initial page load reads all People records, and sorting, searching, child counts, genealogy grouping, and cycle detection are performed after the read rather than by database queries. Add an index only if a later access pattern or measured performance problem justifies it.

## Deletion and Update Rules

A Person cannot be deleted while another Person references that Person through parent_id.

Do not use cascading deletes for the people parent relationship. If a referenced parent must be deleted, the affected child relationships must first be deliberately updated or removed.

The initial administrative UI does not support deletion.

For administrative creation and editing:

- Trim First Name and Last Name and reject either value when it is null or blank.
- Birthday is required and must not be in the future.
- Death Day is nullable. When provided, it must not be before Birthday or in the future.
- A blank Death Day is stored as null.
- Phone Number is nullable; blank values become null. Normalize and validate phones using Product.md. Legacy spouse fields are not editable and are never written by admin.
- id=1 must have parent_id of null. Every other Person must have a non-null parent_id that references an existing Person.
- The proposed Parent must have been at least 15 years old on the Person's Birthday.
- A Person cannot be their own Parent.
- A Person's descendant cannot become that Person's Parent.
- Every successful write must preserve exactly one root and an acyclic parent graph.
- An edit that does not change any editable value must be rejected without issuing an update.

## Manual Database Smoke Tests

Perform manual smoke tests against the development database. See `AdminPeopleSmokeTests.md` for the Phase 1 checklist. Assume the externally managed partners table already exists. Do not change migration or seed files as part of application verification.
