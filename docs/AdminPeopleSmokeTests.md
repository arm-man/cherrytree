# Admin Smoke Tests

Run against the development database with the externally managed partners and ancestors tables already present. Do not change database/ files. Use uniquely named disposable records for mutation checks and remove only those fixtures afterward. Close browser and app processes and confirm test ports are no longer listening.

- Confirm the heading Cherry Kin, Spouses & Ancestors, Add Cherry Kin, Add Spouse and Add Ancestor controls, and exactly six columns: Full Name, Birthday, Death Day, Parent's Full Name, Phone Number, Spouse.
- All defaults to the combined alphabetized list. Cherry Kin shows only people rows; Spouse shows only partners rows; Ancestor shows only ancestors rows. All includes all three types, which use the same row colors.
- Verify Cherry Kin name, dates, resolved parent, formatted phone, and blank Spouse. Verify Spouse name, optional dates, blank parent/phone, and associated Cherry Kin name. Nulls remain blank and dates use abbreviated months.
- Search every displayed field. Check case-insensitive partial matching and trimming. Combine Search with each Type, change both in either order, and verify empty results. Legacy spouse fields must not match.
- Click both row types and their name links, including with keyboard navigation. Cherry Kin opens its existing edit route; Spouse opens its own partners id edit route, even when ids overlap.
- Verify Search and Type survive Cancel/Return, successful edit, and refresh.
- Add/Edit Cherry Kin has First Name, Last Name, Birthday, Death Day, Parent, Step / Adopted child and Phone Number in that order. Verify the checkbox defaults false, saves both values and reloads the stored value on Edit. Preserve parent eligibility, root protection, descendant exclusion, and date rules.
- Verify phones accept supported ten-digit formats, store digits only, display (703) 555-1234, reject invalid inputs, and can be cleared.
- Add/Edit Spouse has First Name, Last Name, optional Birthday/Death Day and required Spouse dropdown. Options contain only Cherry Kin aged 16 or older, alphabetized by Full Name, and display Full Name followed by Birthday in the same format as Parent options (e.g. Candee Arant — Dec 14, 1975). Include someone turning 16 today; exclude someone turning 16 tomorrow. For deceased Cherry Kin, use age at death. Edit selects the current eligible association and can change it; an ineligible existing association requires a new selection before saving.
- Verify blank optional dates save as SQL NULL. Reject Death Day without Birthday with a clear form error and direct API 400 response. Reject future/malformed dates or death before birth; accept equal dates.
- Verify required names and valid existing Cherry Kin association on client and server. Test invalid URL ids and missing records (404).
- Verify one Save button, pending protection, retained input on failure, unchanged-edit message, and matching form styles. Successful Cherry Kin/Spouse Add stays, clears the form, identifies the added record and permits another entry. Successful Edit returns to the fresh filtered list.
- After the externally managed column removal, verify Cherry Kin and Spouse POST/PUT requests still succeed with their current form fields. Spouse writes must not update people.
- Verify no delete controls or mutation operations were added (unsupported DELETE returns 405).
- Confirm Step / Adopted Cherry Kin remain visible, searchable and clickable without different row styling. Verify inherited Step / Adopted generation-heading counts, compact CHILDREN values and popups in both views, and normal-only # of Children sorting. Confirm no unrelated Cherry Kin/Spouse or Genealogy behavior changed.

## Ancestor checks

- Add/Edit Ancestor shows only First Name, Last Name, Birthday, Death Day and a text Spouse input. Names/Birthday are required; optional blanks store NULL. Test dates, whitespace, invalid types, and clearing Spouse/Death Day through both form and API.
- Ancestor rows show formatted dates, blank Parent/Phone and plain-text Spouse. Search all displayed fields and combine with Type. Use overlapping IDs across the three entities and verify each row opens the correct edit route.
- Successful Add and Edit return to the fresh filtered list; Cancel/Return preserves controls without saving. Unchanged edits show the existing notice. Verify POST returns 201, PUT returns 200, invalid input returns 400, invalid/missing IDs return 404, and DELETE returns 405.
- Verify exactly one info log per successful creation/edit with Added/Edited Ancestor, ID and Full Name. Invalid or unchanged submissions must not add success logs. In a rollback-only test, force log insertion to fail and confirm the Ancestor mutation is rolled back too.
- Public List includes all ancestors, with identical row styling, blank Children, and stored Spouse. Verify all eight sorts, blank values at bottom, name/Spouse search, live/deceased Age, dagger and death details by hover, keyboard and tap. Ancestor names are plain text and cannot select Root; existing Cherry Kin and Spouse interactions remain intact.
- Check desktop and narrow mobile layouts. Ancestors must not enter Genealogy View, ancestry sections, or descendant counts.
