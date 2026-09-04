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

The initial release does not contain any API endpoints.

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

- `200 OK` for successful actions and previews.

### Error Shape

All expected API errors use this minimal shape:

```json
{
  "error": {
    "code": "USERNAME_NOT_FOUND",
    "message": "That Username does not exist."
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

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Malformed JSON, missing field, wrong type, or invalid value. |
| `404 Not Found` | The requested resource does not exist. |
| `500 Internal Server Error` | Unexpected server failure. |

## Server-Rendered Page Data

The following data is expected to be loaded by Server Components through server-side functions rather than by calling the application's own API:
- The main Cherry Tree page.

These server-side data shapes should be kept close to the pages that use them. They do not need public HTTP contracts in this document unless browser-side requirements later make an endpoint useful.

## Route Handler Placement

Route Handlers should be placed in src/app/api/

Every Route Handler that uses PostgreSQL must use the Node.js runtime rather than the Edge runtime.
