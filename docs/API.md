# Cherry Tree API

## Overview

This document defines the HTTP API contracts used by the Cherry Tree browser application.

Cherry Tree is a single Next.js application. The endpoints in this document are Next.js Route Handlers under `src/app/api/`; they are not a separately deployed backend service.

`Product.md` defines product behavior. `Architecture.md` defines application structure. `Database.md` defines persistent data and transactions. This document defines only the browser-to-server HTTP contracts needed by interactive application operations.

## API Principles

1. Keep the API small and specific to current product operations.
2. Use ordinary JSON requests and responses.
3. Use Route Handlers for all mutations.
4. Keep Route Handlers focused on HTTP validation and response handling. Server-side business functions enforce product rules and coordinate database work.
5. Validate all request data on the server even when it was already validated in the browser.
6. Return small responses containing only the data the browser needs for its next action.
7. Do not expose SQL, database errors, stack traces, or internal implementation details.

## Scope

The administration feature uses API endpoints to create and edit Cherry Kin and Spouses. Administrative pages load their read data through Server Components and therefore do not require read endpoints.

The initial administration endpoints do not require authentication. Authentication and authorization may be added later.

## Conventions

### Base Path

All endpoints use paths under:

```text
/api
```

### Content Type

Requests with bodies use:

```http
Content-Type: application/json
```

Successful responses containing bodies return JSON.

### Timestamps

When a timestamp is needed in a response, return it as an ISO 8601 UTC string, for example:

```json
"2026-08-16T14:30:00.000Z"
```

### Success Status Codes

- `200 OK` for a successful update.
- `201 Created` for a successfully created Cherry Kin or Spouse.

### Error Shape

All expected API errors use this minimal shape:

```json
{
  "error": {
    "code": "INVALID_BIRTHDAY",
    "message": "Enter a valid Birthday."
  }
}
```

- `code` is a stable machine-readable value used by application code.
- `message` is a short user-facing message.

Unexpected errors return:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong. Please try again."
  }
}
```

The server should write the underlying unexpected error to the `logs` table without returning its details to the browser.

### Common Error Status Codes

| Status                      | Meaning                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `400 Bad Request`           | Malformed JSON, missing field, wrong type, or invalid value. |
| `404 Not Found`             | The requested resource does not exist.                       |
| `500 Internal Server Error` | Unexpected server failure.                                   |

## Cherry Kin Administration

### Create a Cherry Kin

```http
POST /api/admin/people
```

Request body:

```json
{
  "firstName": "John",
  "lastName": "Cherry",
  "birthday": "2026-09-05",
  "deathday": null,
  "phoneNumber": null,
  "parentId": 42
}
```

- `firstName`, `lastName`, `birthday`, and `parentId` are required.
- `deathday` and `phoneNumber` are optional and nullable. Omitted, null, or blank optional values are stored as null, including on PUT.
- `phoneNumber` accepts a string containing 10 U.S. digits with spaces, parentheses, hyphens, or periods; the server stores digits only. Country codes, extensions, and other characters are rejected.
- The database generates the new Cherry Kin's id; the id is not included in the request URL or request body.

Successful response:

```http
201 Created
```

```json
{
  "personId": 123
}
```

Expected errors include:

- `REQUIRED_FIELD_MISSING`
- `INVALID_BIRTHDAY`
- `INVALID_DEATHDAY`
- `INVALID_PHONE_NUMBER`
- `INVALID_PARENT`
- `PARENT_TOO_YOUNG`
- `RELATIONSHIP_CYCLE`

### Edit a Cherry Kin

```http
PUT /api/admin/people/{personId}
```

The request body uses the same shape as Create a Cherry Kin. For `personId=1`, `parentId` must be null. For every other Cherry Kin, `parentId` is required and must be a valid integer.

Successful response:

```http
200 OK
```

```json
{
  "personId": 123
}
```

Expected errors include the Create a Cherry Kin errors and:

- `NO_CHANGES` when no editable values differ from the stored Cherry Kin.
- `PERSON_NOT_FOUND` when `personId` does not identify an existing Cherry Kin.

All validation errors use `400 Bad Request`. A missing Cherry Kin uses `404 Not Found`.

For both endpoints, blank optional Death Day and Phone Number values are normalized to null. The server validates required fields, date rules, Parent eligibility, the single-root rule, and cycle prevention before saving.


## Spouse Administration

- POST /api/admin/partners creates a Spouse: 201 with { "partnerId": 123 }.
- PUT /api/admin/partners/{partnerId} edits that partners.id: 200 with { "partnerId": 123 }.

Both requests use this JSON body:

```json
{
  "firstName": "Herschel",
  "lastName": "Arant",
  "birthday": null,
  "deathday": null,
  "partnerId": 42
}
```

firstName, lastName, and partnerId are required. Names are trimmed and cannot be blank. The body partnerId is the associated people.id; the URL id and response partnerId identify the partners row itself. The associated Cherry Kin must exist. Birthday and Death Day are optional ISO YYYY-MM-DD dates; omitted/null/blank values become null, including on PUT. Birthday cannot be future; Death Day requires Birthday and must be on or after it and not future. Equal dates are valid.

Expected 400 error codes: REQUIRED_FIELD_MISSING, INVALID_BIRTHDAY, INVALID_DEATHDAY, INVALID_PARTNER, and NO_CHANGES for an unchanged edit. PARTNER_NOT_FOUND uses 404 for invalid or nonexistent URL ids. All use the common JSON error envelope and clear Spouse-facing messages. Unexpected failures are logged and use the common 500 response. No delete endpoints are provided.

## Server-Rendered Page Data

The following data is expected to be loaded by Server Components through server-side functions rather than by calling the application's own API:

- The main Cherry Tree page.
- The Cherry Kin & Spouses list.
- The Add/Edit Cherry Kin pages.
- The Add/Edit Spouse pages.

These server-side data shapes should be kept close to the pages that use them. They do not need public HTTP contracts in this document unless browser-side requirements later make an endpoint useful.

## Route Handler Placement

Route Handlers should be placed in src/app/api/

Every Route Handler that uses PostgreSQL must use the Node.js runtime rather than the Edge runtime.
