# Admin People Smoke Tests

Run against development data after applying `003_migration_people_phone_spouse_dates.sql`. Use a disposable Person with an eligible Parent. Verify both form validation and direct POST/PUT requests so server validation is exercised independently.

- Save with no Phone Number or spouse dates; confirm all three columns are SQL NULL.
- Save `7035551234`, `703-555-1234`, `(703) 555-1234`, and `703 555 1234`; confirm storage is `7035551234` and list/edit display is `(703) 555-1234`.
- Reject fewer or more than 10 digits, country codes, letters, extensions, and unsupported characters.
- Clear an existing phone and both spouse dates; confirm SQL NULL and blank list/edit displays.
- Save Spouse's Birthday without Spouse's Death Day.
- Reject Spouse's Death Day without Spouse's Birthday.
- **Accept Spouse's Death Day equal to Spouse's Birthday.** Reject a Death Day before Birthday.
- Reject future spouse birthdays and death days, and invalid calendar dates.
- Verify Person Birthday cannot be future and Person Death Day must be on or after Birthday and no later than today; equal dates remain valid.
- Confirm all eight list columns in order: Full Name, Birthday, Death Day, Parent's Full Name, Phone Number, Spouse (Sp), Sp Birthday, Sp Death Day.
- Confirm abbreviated admin dates, including Parent options (e.g. `Dec 14, 1975`, `Mar 2, 2008`), and blank missing values.
- Verify edit values populate, unchanged Save shows `No changes were made.`, and successful edit returns to the filtered list.
- Verify successful Add remains on the cleared form with confirmation, and Cancel/Return preserves list search.
- Verify public List and Genealogy views retain their columns, full month names, and original payload; no phone or spouse-date fields appear.
- Apply the migration to a populated copy of the current schema. Confirm existing records are unchanged and all three new columns are nullable with NULL defaults. Confirm the named check rejects spouse death without spouse birth and permits equal dates.
