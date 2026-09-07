# Phase 1 Admin Smoke Tests

Run against the development database with the externally managed partners table already present. Do not change database/ files. Use uniquely named disposable records for mutation checks and remove only those fixtures afterward. Close browser and app processes and confirm test ports are no longer listening.

- Confirm the heading Cherry Kin & Spouses, Add Cherry Kin and Add Spouse controls, and exactly six columns: Full Name, Birthday, Death Day, Parent's Full Name, Phone Number, Spouse.
- All defaults to the combined alphabetized list. Cherry Kin shows only people rows; Spouses shows only partners rows. Both use the same row colors.
- Verify Cherry Kin name, dates, resolved parent, formatted phone, and blank Spouse. Verify Spouse name, optional dates, blank parent/phone, and associated Cherry Kin name. Nulls remain blank and dates use abbreviated months.
- Search every displayed field. Check case-insensitive partial matching and trimming. Combine Search with each Type, change both in either order, and verify empty results. Legacy spouse fields must not match.
- Click both row types and their name links, including with keyboard navigation. Cherry Kin opens its existing edit route; Spouse opens its own partners id edit route, even when ids overlap.
- Verify Search and Type survive Cancel/Return, successful edit, and refresh.
- Add/Edit Cherry Kin has only First Name, Last Name, Birthday, Death Day, Parent and Phone Number. Preserve parent eligibility, root protection, descendant exclusion, and date rules.
- Verify phones accept supported ten-digit formats, store digits only, display (703) 555-1234, reject invalid inputs, and can be cleared.
- Add/Edit Spouse has First Name, Last Name, optional Birthday/Death Day and required Spouse dropdown. Options contain only Cherry Kin aged 16 or older, alphabetized by Full Name, and display Full Name followed by Birthday in the same format as Parent options (e.g. Candee Arant — Dec 14, 1975). Include someone turning 16 today; exclude someone turning 16 tomorrow. For deceased Cherry Kin, use age at death. Edit selects the current eligible association and can change it; an ineligible existing association requires a new selection before saving.
- Verify blank optional dates save as SQL NULL. Reject Death Day without Birthday with a clear form error and direct API 400 response. Reject future/malformed dates or death before birth; accept equal dates.
- Verify required names and valid existing Cherry Kin association on client and server. Test invalid URL ids and missing records (404).
- Verify one Save button, pending protection, retained input on failure, unchanged-edit message, and matching form styles. Successful Add stays, clears the form, identifies the added record and permits another entry. Successful Edit returns to the fresh filtered list.
- Submit legacy spouse properties directly to Cherry Kin POST/PUT; verify they are ignored. Snapshot existing legacy columns before mutations and confirm they remain identical afterward. Spouse writes must not update people.
- Verify no delete controls or mutation operations were added (unsupported DELETE returns 405).
- Confirm public pages and behavior are unchanged and database/ files match their pre-task state.
