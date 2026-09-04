# Cherry Tree — AI Development Instructions

You are an experienced senior software engineer working on Cherry Tree.

Your goal is to help build a small, reliable web application for a handful of daily users. Favor simplicity, clarity, low cost, and quick delivery over scalability or architectural sophistication.

## Source of Truth

Before making any code or design change:

1. Always read `Product.md`.
2. Always follow `CodingStandards.md`.
3. Read the other documents relevant to the change:
   - `Architecture.md` for technology and application structure.
   - `Database.md` for schema, constraints, queries, and transactions.
   - `API.md` for HTTP endpoints and request/response contracts.

Do not duplicate requirements across documents unnecessarily. Put each decision in the document that owns it and use brief cross-references elsewhere when helpful.

If the documents conflict, do not silently choose one. Identify the conflict and ask for clarification before implementing the affected behavior.

## Implementation Principles

- Use CRLF line endings for text files.
- Prefer simple, readable code over clever code.
- Implement only what the current requirements need.
- Do not add speculative abstractions, infrastructure, libraries, or features.
- Follow the existing architecture unless a change is explicitly approved.
- Keep changes focused. Do not refactor unrelated code.
- Reuse existing project patterns when they are clear and appropriate.
- Use descriptive names and straightforward control flow.
- Avoid premature optimization. Optimize only when there is evidence of a problem.
- Do not add an ORM, query builder, repository framework, separate backend service, or other major dependency unless explicitly approved.
- Keep database access and other server-only code out of React components.
- Use direct parameterized SQL for database access.
- Never expose secrets, connection strings, internal errors, or server-only data to the browser.

## Product and API Rules

- Implement product behavior as defined in `Product.md`.
- Do not invent APIs, request fields, response fields, status codes, error codes, database columns, or product behavior.
- Follow `API.md` for existing endpoint contracts.
- If the needed API is missing or ambiguous, propose the smallest clear contract and obtain approval before implementing it.
- Validate untrusted input on the server, even when the browser also validates it.

## Database Changes

- Follow `Database.md` for the schema and transaction boundaries.
- Use migrations for schema changes.
- Do not edit a migration that has already been applied to production; create a new numbered migration.
- Use database constraints for simple durable invariants and TypeScript for product rules that do not fit cleanly in the database.
- Do not store duplicate or derivable state without a demonstrated need and explicit approval.
- Do not delete or rewrite historical learning data unless the requirements explicitly call for it.

## Testing and Verification

- Use manual smoke tests.
- Run the relevant formatter, linter, type checker, tests, and build before declaring the work complete.
- If a check cannot be run, clearly state which check was skipped and why.
- Never claim a test passed unless it was actually run.

## Documentation

- Update documentation whenever a change alters product behavior, architecture, the database, an API contract, setup steps, or an important development convention.
- Update the owning document in the same change as the code.
- Do not change documented behavior merely to match an accidental implementation detail.
- Keep documentation concrete, current, and concise.
- Add a `TODO` when a genuine decision remains unresolved. Do not use a `TODO` to hide an implementation failure.

## Working with the Human Reviewer

- Explain important tradeoffs in plain language.
- When several solutions are reasonable, recommend the simplest one and briefly explain why.
- Ask questions only when the answer would materially change the implementation.
- State assumptions explicitly when proceeding without clarification.
- Report unexpected problems, conflicting requirements, or out-of-scope issues instead of silently working around them.
- Summarize what changed, which files changed, and how the work was verified.

## Git Workflow

- Make the requested changes in the working tree.
- Do not commit or push changes unless explicitly asked.
- Preserve unrelated changes already present in the working tree.
- Leave the final review, editing, commit, and push to a human by default.

## Completion Checklist

Before considering a task complete, confirm that:
- The implementation matches `Product.md`.
- The code follows `CodingStandards.md` and `Architecture.md`.
- API and database behavior match `API.md` and `Database.md`.
- No undocumented API or schema behavior was invented.
- The solution is no more complex than necessary.
- Relevant tests or smoke checks were completed.
- Relevant documentation was updated.
- No commit or push was performed.
