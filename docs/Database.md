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

Stores one row for each person.

| Column | Type | Null | Purpose |
| --- | --- | --- | --- |
| `id` | `integer` identity | No | Primary key. |
| `parent_id` | `integer` | Yes | The id of the Person's immediate parent. When NULL it is the single top-level Person that has no immediate parent. |
| `first_name` | `text` | No | The first name of the Person. |
| `last_name` | `text` | No | The last name of the Person. |
| `birthday` | `date` | No | The birth date of the Person. |
| `deathday` | `date` | Yes | The date of death of the Person. |
| `spouse` | `text` | Yes | The Person's spouse. |
| `created_at` | `timestamptz` | No | Person creation time. Use DEFAULT NOW().|

Constraints:

- Primary key on `id`.
- parent_id is a self-referencing foreign key to people(id).
- Use the default non-cascading foreign-key behavior so PostgreSQL prevents deleting a Person while another Person references that Person as a parent.
- parent_id may be NULL only for the single top-level Person.

After People data is read from the database, the server must test the parent relationships for cycles before deriving descendants or returning the data to the client. If a cycle is found, the server must write an error to the `logs` table and return a controlled internal error to the client. The server must also test that exactly one root (parent_id of NULL) exists.

### `logs`

Stores server-side error, warning, and informational messages for operational troubleshooting.

| Column | Type | Null | Purpose |
| --- | --- | --- | --- |
| `severity` | `text` | No | Log severity. Use `DEFAULT 'error'`; warnings use `warning`; informational actions use `info`. |
| `message` | `text` | No | Non-sensitive log details. |
| `created_at` | `timestamptz` | No | Log creation time. Use `DEFAULT NOW()`. |

The application must not store credentials, connection strings, or other secrets in log messages.

## Derived Data and Queries

### Age

A Person's age is derived from today's date and the birthday.

### Children, Grandchildren, Great Grandchildren, and Great Great Grandchildren

A Person's progeny can be derived from the parent_id.

## Transactions

N/A

## Indexes

No additional indexes are required initially. The initial page load reads all People records, and sorting, searching, child counts, genealogy grouping, and cycle detection are performed after the read rather than by database queries. Add an index only if a later access pattern or measured performance problem justifies it.

## Deletion and Update Rules

A Person cannot be deleted while another Person references that Person through parent_id.

Do not use cascading deletes for the people parent relationship. If a referenced parent must be deleted, the affected child relationships must first be deliberately updated or removed.

## Manual Database Smoke Tests

Perform manual smoke tests against the development database. Create people entries as needed.
