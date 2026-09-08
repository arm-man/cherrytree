# Cherry Tree Product Specification

## Overview

Cherry Tree is a mobile-friendly, web-based family information website of the Cherry family.
Primary user goal: view birthdays, see how people are related, and conveniently search and sort the information.

## Terminology

- **View**: one of Genealogy or List.
- **Genealogy** : The View showing up to three ancestor generations, the Root Cherry Kin group, and Children, Grandchildren, Great Grandchildren, and Great Great Grandchildren, each as their own table.
- **Root Cherry Kin** : The selected Cherry Kin whose Spouses, ancestors, and descendants are displayed in Genealogy View.
- **List** : The View in which all Cherry Kin and all Spouses are shown in a table.
- **Cherry Kin** : A member of the Cherry family genealogy. Cherry Kin form the genealogy hierarchy and may have descendants.
- **Spouse** : A spouse or partner associated with a Cherry Kin. Spouses are family information but are not part of the genealogy hierarchy and do not affect Generations.
- **Full Name** : The concatenation of the First Name with the Last Name.
- **Generation** : One of Root Cherry Kin, Parents, Grandparents, Great Grandparents, Children, Grandchildren, Great Grandchildren, or Great Great Grandchildren.
- **Control** : The View, Sort, or Search controls.
- **Reset** : Set the View to Genealogy, select id=1 as the Root Cherry Kin, clear the Search box, set the displayed Sort to None (Blank), and reset the remembered List View Sort to Birthday.

## Data

- Every Cherry Kin has a First Name, Last Name, Birthday, and one parent relationship, except id=1, who is the single top-level Cherry Kin and has no parent. Death Day and Phone Number are optional and may be null/blank. Spouse information is stored separately and associated with Cherry Kin.
- The parent relationships are sufficient to derive the complete genealogy of descendants.
- Today's date means the current calendar date in the user's local time zone for all product rules that depend on today, including Age and Upcoming Birthday.
- Age is derived from Birthday and Death Day (if deceased) or today's date (if living) and is not independently maintained.
- Children is derived as the number of Cherry Kin whose parent is that Cherry Kin and is not independently maintained.

## Wordmark

- The page will have a Cherry Tree wordmark in the upper left.
- When the wordmark is clicked, perform a Reset.

## Control Section

- This section will show a View toggle, Sort dropdown menu, and a Search text box.
- On mobile, View and Sort share the first row, with View sized to its buttons and Sort filling the remaining width. Search spans the full second row. Use compact panel padding and spacing while keeping controls touch-friendly.
- The View control toggles between Genealogy and List.
  - Genealogy is the default.
  - When Genealogy is selected, the page switches to Genealogy View and the Root Cherry Kin that was last selected (remembered in React state during the current page lifetime) is restored. The Sort option is stored, then changed to None (Blank).
    - In Genealogy View, the Sort control displays a blank value because sorting does not apply to the overall Genealogy View. Note that Blank is not a selectable Sort option in the List View.
  - When List is selected, the page switches to List View and restores the most recently selected List View Sort. If no List View Sort has previously been selected, Birthday is used.
- Sort options include: Birthday, Age, Upcoming Birthday, Date of Passing, First Name, Last Name, Spouse, # of Children. Use the order presented here, not alphabetical.
  - Birthday is the default sort option.
  - Changing the Sort option switches the page to List View.
  - When a Sort option is selected, that option is remembered (in React state during the current page lifetime) and restored when switching Views using the View Control.
- The Search text box is a highlighter or filter depending on the View.
  - The Search text box shall use placeholder text: "Search for a name".
  - The Search text box will filter based on Full Name or Spouse. A match is true if any one of these columns match, i.e. use OR matching.
    - Search is case-insensitive and performs a partial-text match. Leading and trailing whitespace in the Search text is ignored.
  - In Genealogy View, the entire row is highlighted on a match.
  - In List View, the data is filtered such that only matches are shown.

## List View

- No phone icon, phone number, or Copy/Call controls appear in List View.
- The Cherry Kin are shown in a single table with columns: Name, Age, Birthed, Children, Spouse. When sorted by Date of Passing, insert Passed Away immediately after Birthed.
  - Name is the Full Name.
  - Birthed displays the Cherry Kin's Birthday. The term "Birthed" is used since it preserves the naming as used on the original site: http://roncherry.net/cherrytree/birthed.htm
- Only in List View, the NAME, AGE, BIRTHED, CHILDREN and SPOUSE column headings are buttons that select the existing Sort dropdown option using these exact mappings: NAME → First Name, AGE → Age, BIRTHED → Birthday, CHILDREN → # of Children, SPOUSE → Spouse.
  - Reuse the dropdown's existing Sort state, event handler and sorting logic. The dropdown immediately displays the selected option, with exactly the same ordering, filtering and remembered List Sort behavior as selecting it manually. Repeated header activation keeps that same sort; it never toggles direction or introduces separate sorting behavior.
  - Make these headings visibly interactive with an underline and pointer cursor. Support keyboard activation with Enter and Space and retain a visible focus indicator.
  - Passed Away and all Genealogy headings remain noninteractive. NAME selects First Name even though the column displays Full Name.
- When the Sort option is Upcoming Birthday, ignore the year and sort each Cherry Kin by the next occurrence of their birthday relative to today's date, including today. Birthdays wrap across calendar years. Any birthday within the next 7 days (today and the next 6 days) will be highlighted. Include Cherry Kin with a Death Day in the Upcoming Birthday list.
- When the Sort option is Birthday, the order includes the year and is sorted ascending so that the oldest person is listed first, youngest person is listed last.
- When the Sort option is Age, sort numerically descending by the same calculated integer Age shown in the Age column, from oldest to youngest.
  - For living Cherry Kin and Spouses, use completed years from their own Birthday through today's local calendar date. For deceased Cherry Kin and Spouses, use completed years from their own Birthday through their own Death Day.
  - Reuse the existing Age-calculation logic used for display so displayed and sorted ages cannot diverge. Living and deceased entries and both row types participate together, without separate groups.
  - Entries whose Age cannot be calculated always appear at the bottom. For equal calculated Ages, use Birthday ascending (older Birthday first) as the secondary sort. Remaining ties may retain the existing row order.
- When the Sort option is Date of Passing, omit Cherry Kin and Spouse entries whose Death Day is NULL. The order includes the year and is sorted ascending so that the person who died first is listed first, and the most recently deceased is listed last.
  - Show the additional column PASSED AWAY immediately after BIRTHED, displaying each Cherry Kin or Spouse's own Death Day in the same full English month format as Birthday, e.g. March 14, 2008. Hide this column for all other sorts.
  - Use compact cell spacing while keeping names, dates, ages, and column headings on one line. Allow horizontal scrolling within the table when needed to reach the Spouse column; do not split words or force the six columns to fit the viewport.
- When the Sort option is Spouse, sort alphabetically. Ignore the fact that the name may contain a first or last name, simply order the text data alphabetically.
- When the Sort option is # of Children, sort descending.
  - A sole Spouse uses the associated Cherry Kin's Children count, including 0, and sorts normally. Spouses in multiple-spouse relationships have blank Children, sorted after all numeric counts.
- Except for Date of Passing, sorting never omits rows. Blank values in the selected sort field always appear after populated values, for both ascending sorts and the descending Age and # of Children sorts. Missing Birthdays are not highlighted by Upcoming Birthday.
- Except for Age and the name sorts below, when a sort has the same value, e.g. the same Children, the secondary sort is by Full Name. Any additional conflicts are not necessary to resolve and defaulting to the database order is ok.
  - When the Sort option is First Name, sort alphabetically ascending by First Name. Secondary sort is by Last Name. Any additional conflicts are not necessary to resolve and defaulting to the database order is ok.
  - When the Sort option is Last Name, sort alphabetically ascending by Last Name. Secondary sort is by First Name. Any additional conflicts are not necessary to resolve and defaulting to the database order is ok.
- Each Cherry Kin's Name is clickable. When clicked, the View changes to Genealogy and the Cherry Kin clicked becomes the Root Cherry Kin. The Sort option is stored, then changed to None (Blank).
- If Search produces no results, display "No people found."

### Public Spouse Records

- Public Spouse information comes exclusively from `partners`, associated through `partners.partner_id = people.id`. Each record is independent; duplicate names are allowed and are never matched or deduplicated by name.
- Every Cherry Kin and every Spouse produces exactly one List row, including Spouses without Birthdays. With Search empty, the List row count equals the number of people rows plus the number of partners rows, except when sorted by Date of Passing, which includes only entries with a non-NULL Death Day.
- Spouse rows use their own First Name, Last Name, Birthday and Death Day. Age, deceased indicators and death-detail popups use the same calculations and presentation as Cherry Kin. Missing Birthday leaves Age and Birthed blank.
- A Spouse row's Spouse column shows the associated Cherry Kin Full Name. If its partner_id occurs exactly once in partners, its Children equals the associated Cherry Kin's child count, including 0. Otherwise Children is blank. Count all partner records regardless of Birthday or Search; this display rule does not add partners to genealogy or child-count calculations. Spouse rows never have telephone icons or inherit Cherry Kin phone numbers.
- Spouse names and rows are non-clickable throughout public Genealogy and List Views, including the Root group and all ancestry sections. Render names as plain text with no click handler, pointer cursor, link styling, or selection hover effect. Spouses never select a Root Cherry Kin. Their existing Age detail controls remain available.
- A Cherry Kin's Spouse column shows all associated Spouse Full Names, separated by commas, including those without Birthdays.
- Both row types use the List sorting rules above, including Age, and case-insensitive, trimmed partial search against Full Name OR Spouse only. Age and Birthed are not searched. There is no sort-direction control. Blank Birthdays sort after real dates.
- Phase 2 changes only public application behavior. Legacy spouse columns remain physically present in `people` until Phase 3, but the application does not read or synchronize them. Database, migration and seed files are unchanged.

## Genealogy View

- Instead of a single table as used in List View, Genealogy View uses multiple tables, one table for each Generation.
- The Root Cherry Kin section contains exactly one Cherry Kin: the Root Cherry Kin.
  - Place one subtle box around the entire group, including the Root Cherry Kin and all of their Spouses. Use the existing site palette; do not add separate boxes around individuals. With no Spouses, the box contains just the Root Cherry Kin.
  - The Root group has no heading, regardless of the number of linked Spouses. With no Spouses, only the Root Cherry Kin appears.
  - Display the Genealogy column headings inside the shaded Root group box, above its rows. Other Genealogy tables retain column headings for screen readers but do not display them visually.
  - Show all linked Spouses immediately after the Cherry Kin using the existing table columns, even without Birthdays. A sole Spouse's name aligns with the Cherry Kin's name; with two or more Spouses, slightly indent every Spouse name.
  - Spouse rows appear in the Root group and ancestry sections, never in any descendant section or descendant count.
- Above the boxed Root group, show up to three ancestry tables in top-down order: `Great Grandparents`, `Grandparents`, `Parents`. The Root group sits between Parents and Children, with the remaining descendants below Children.
  - Follow only `people.parent_id`: Parents is the Root's parent, Grandparents is that parent's parent, and Great Grandparents is that grandparent's parent. Never follow Spouse ancestry or add branches through Spouses.
  - Each table contains the referenced ancestor Cherry Kin followed by all Spouses associated through `partners.partner_id = people.id`, with the same columns, Spouse indentation, search highlighting, Age details, and Cherry Kin phone behavior as the Root group.
  - Show a heading only when that ancestor Cherry Kin exists. Stop at a NULL parent or missing Cherry Kin; omit that section and all later ancestry sections. A Root with NULL parent has no ancestry sections. Never show ancestors beyond Great Grandparents.
  - Use IDs and existing relationships only, without name matching or deduplication. Duplicate names remain separate records. For example, for 40 → 30 → 20 → 1 → NULL, Root 40 shows ancestors 1, 20, 30 from top down; Root 20 shows only 1; Root 1 shows none.
- When a Cherry Kin has a non-null Phone Number, show a subtle telephone icon immediately after their Name as a separate, keyboard-accessible button labeled "Phone number for <Full Name>".
  - Hover, keyboard focus, click, or tap reveal a small popup using the same styling, positioning, and dismissal behavior as Age details. Moving focus or the pointer into the popup keeps its controls available.
  - Display the number as (703) 555-1212. On hover-capable, fine-pointer devices, follow it with Copy only. Copy writes the displayed number (without a tel: prefix) to the clipboard, briefly shows Copied on success, and reports Could not copy if clipboard access fails.
  - On touch-oriented or coarse-pointer devices, follow the number with Call only. Call is a tel: link using +1 followed by the stored 10 U.S. digits.
  - Phone, Copy, and Call interactions do not activate Cherry Kin navigation; the Name remains independently clickable.
- Each Genealogy table displays the same Cherry Kin data columns as List View except Children and the Date of Passing sort's Passed Away column, which are omitted.
- The number of children, grandchildren, etc. is listed in the Generation title, e.g. "Children (5)" if the Root Cherry Kin has 5 children or "Grandchildren (18)" if the Root Cherry Kin has 18 grandchildren.
  - The numbers in parenthesis do not change based on the entries highlighted by the Search text box.
- When Search is empty, no rows are highlighted based on Search.
- If the Root Cherry Kin has zero of a certain descendant Generation, that Generation is omitted, with the exception of the Children Generation, in which case that section is shown but with the message "No Children".
- Each Cherry Kin's Name is clickable. In every section, clicking a Cherry Kin selects that exact Cherry Kin as the Root and recalculates the boxed group, Spouses, ancestry, and descendants using the existing Root selection state. Clicking the current Root keeps that Cherry Kin selected. Clicking from List still switches to Genealogy and preserves the remembered List Sort and Search.
- The Children table is sorted by Birthday, ascending (oldest first).
- For Grandchildren, Great Grandchildren, and Great Great Grandchildren:
  - Include an additional column called Parent, which displays the Cherry Kin's immediate parent.
  - These tables are sorted first by the immediate Parent's birthday, ascending (oldest first), then by the Cherry Kin's Birthday, ascending (oldest first).

## User Experience

- The Root Cherry Kin group is identified by its shaded box and has no heading. The user should never encounter the term Root within the website.
- Age displays completed whole years, comparing the full Birthday with today's local calendar date for living Cherry Kin or Death Day for deceased Cherry Kin.
  - Living Cherry Kin ages are plain, noninteractive text.
  - Deceased Cherry Kin ages show age at death followed by a dagger, e.g. "82 †", on a subtly underlined button. Its accessible label communicates the age, deceased status, and availability of death details; the dagger is not the only indication of death.
  - Hover, keyboard focus, click, or tap reveal a small popup with "Died March 14, 2008" and "Would be 100 today", using that Cherry Kin's Death Day and hypothetical completed age as of today. Activation keeps the popup open; activating again, pressing Escape, clicking/tapping outside, or moving focus away dismisses it. Hover previews remain available while the pointer is over the age or popup.
  - Retain visible keyboard focus. Keep the popup within the viewport and outside table clipping, without adding horizontal scrolling; dismiss it when the viewport is resized or scrolled.
- Death Day appears as Passed Away only in List View when sorted by Date of Passing. Genealogy View and all other List sorts omit this column. Keep Death Day in stored and internal Cherry Kin data for age calculations, death details, and the Date of Passing sort.
- Public dates use full English month names, e.g. March 14, 2008 or May 17, 1947, matching the existing Birthed display. Birthday and Death Day remain calendar dates without time-zone conversion.
- Children to be shown as a number.
- If there is no Spouse, that field remains blank.
- Public Spouse information is read from the partners table and associated with Cherry Kin. Spouse names are informational and are not clickable.
- Descendant generations contain only descendants of the Root Cherry Kin; ancestor generations follow only Cherry Kin parent relationships. Spouses have no effect on genealogy relationships or descendant counts.
- If the Cherry Kin has no children, display 0.
- The color palette shall use the same colors as those found at http://roncherry.net/cherrytree/, i.e. #FDEBCF as the main background color and #F3979D as the secondary/highlight color. Other colors, particularly black and white, are allowed, the guidance here is on the two main colors for the palette.
- Edge cases related to February 29 (leap year) can be ignored for now as there is no date data for February 29.

## Administration

- Admin pages use #E8F1F5 as the main background color and #5B8FA8 as the secondary/highlight color to distinguish them from regular pages.
- The initial administration feature is part of the same Cherry Tree application and is available without authentication. Administrator authentication may be added later.
- The Cherry Kin & Spouses list is available at `/admin/people`.
  - Load Cherry Kin from people and Spouses from partners, combined and sorted alphabetically by Full Name.
  - Each entry is clickable with columns in exactly this order: Full Name, Birthday, Death Day, Parent's Full Name, Phone Number, Spouse.
  - Cherry Kin rows retain their name, dates, Parent and Phone Number, with blank Spouse. Spouse rows display their own name and optional dates, blank Parent and Phone Number, and the associated Cherry Kin Full Name in Spouse.
  - Both row types use the same table and row colors.
  - Use compact table text and cell spacing, with more available width on large screens, to minimize horizontal scrolling. Use slightly larger text with dense rows and minimal vertical gaps to show more names at once. Long names and column headings may wrap; dates and phone numbers stay on one line. Keep every value fully accessible, name links at least 24 pixels tall, and horizontal scrolling where needed.
  - All null optional values remain blank. The single top-level Cherry Kin's Parent remains blank. Admin date displays, including Parent options, use abbreviated English months, e.g. Dec 14, 1975; public date formatting is unchanged.
  - A Search text box filters the list immediately using a case-insensitive partial-text match against all six displayed fields, including formatted dates and phone numbers. Hidden legacy fields are never searched.
  - A Type dropdown next to Search offers All (default), Cherry Kin, and Spouses. Search and Type combine with AND logic. Leading and trailing whitespace in the Search text is ignored.
  - If Search produces no results, display "No Cherry Kin or Spouses found."
  - Preserve Search and Type when returning from any Add or Edit form.
  - An Add Cherry Kin button navigates to `/admin/people/new`.
  - Clicking a Cherry Kin navigates to `/admin/people/[id]/edit` for that Cherry Kin.
- The Add Cherry Kin and Edit Cherry Kin forms contain fields in exactly this order: First Name, Last Name, Birthday, Death Day, Parent, Phone Number.
  - First Name, Last Name, Birthday, and Parent are required, except that id=1 is the single top-level Cherry Kin and has no Parent.
  - Death Day and Phone Number are optional. Blank optional values are stored as null and existing values can be cleared.
  - Birthday must not be in the future. Death Day, when provided, must not be before Birthday or in the future.
  - Phone Number accepts exactly 10 U.S. digits after removing spaces, parentheses, hyphens, and periods. Reject other characters, country codes, and extensions; do not validate area codes or exchanges. Store digits only; display as (703) 555-1234 in the list and edit form. Validate on both client and server.
  - The Parent control is a searchable dropdown sorted alphabetically by Full Name. Each option displays the Cherry Kin's Full Name and Birthday.
  - Parent appears immediately after Death Day and before Phone Number in the form. On the Add Cherry Kin page, Parent remains disabled until a valid Birthday is entered.
  - A Cherry Kin is eligible to be selected as Parent only if the proposed Parent was at least 15 years old when the Cherry Kin was born.
  - On the Edit Cherry Kin page, the Cherry Kin being edited and all of that Cherry Kin's descendants are excluded from the Parent options.
  - When editing id=1, Parent displays no value and is disabled. No other Cherry Kin may have a null Parent.
  - Client-side validation provides immediate feedback, but the server validates all fields and relationship rules before saving.
  - While a save request is pending, disable the form's action buttons to prevent duplicate submissions.
  - If validation fails, remain on the form, preserve the entered values, and show field-specific or form-level errors.
- The Edit Cherry Kin page contains Save and Cancel buttons.
  - Cancel returns to the Admin Cherry Kin & Spouses List without saving.
  - If Save succeeds, return to the Admin Cherry Kin & Spouses List.
  - If Save is selected when no editable values have changed, remain on the Edit Cherry Kin page and display "No changes were made."
- The Add Cherry Kin page contains Save and Cancel/Return buttons.
  - If Save succeeds, remain on the Add Cherry Kin page, clear the form, and display a confirmation that identifies the Cherry Kin added and indicates that another Cherry Kin may be entered.
  - Cancel/Return returns to the Admin Cherry Kin & Spouses List without saving the current form.
- The initial administration feature does not provide a way to delete a Cherry Kin.

### Spouse Forms

- Add Spouse links to /admin/partners/new. A Spouse list row opens /admin/partners/[id]/edit for its own partners.id; its heading is Edit Spouse.
- Add/Edit Spouse fields are First Name, Last Name, Birthday, Death Day, Spouse, in that order. Names and Spouse are required. Both dates are optional and blank dates become null.
- Spouse is a dropdown of Cherry Kin from people only whose Age is at least 16, alphabetized by Full Name. Age uses today's local calendar date for living Cherry Kin and Death Day for deceased Cherry Kin, including the sixteenth birthday. Each option displays Full Name and Birthday using the same abbreviated date format as the Parent dropdown, e.g. Candee Arant — Dec 14, 1975. It stores people.id in partners.partner_id. Edit selects the current association when eligible and permits changing it; if the existing association is under 16, select an eligible Cherry Kin before saving.
- Birthday cannot be future. Death Day requires Birthday, must be on or after it, and cannot be future. Equal dates are allowed. Validate on client and server with clear errors.
- Use the Cherry Kin form layout and error/pending conventions, one Save button, and Cancel/Return. Successful creation clears the form, stays on Add Spouse, refreshes options, and identifies the Spouse added. Successful editing returns to the list. Unchanged edits display "No changes were made." Cancel/Return leaves without saving.
- Neither entity supports deletion in the UI or API.

## Mobile Requirements

- The application must work well on common mobile, tablet, and desktop screen sizes.
- On narrow screens, table rows shall not be stacked, rather, horizontal scrolling will be enabled. All information available in the desktop table must remain accessible.
  - Use an appropriate text size as a tradeoff between having to horizontally scroll a lot versus readability of the text.
  - Public mobile tables use content-driven widths instead of a desktop minimum width, reduced horizontal cell padding, and smaller column labels. Preserve readable body text, single-line names and dates, row height, and comfortable name-button padding; allow horizontal scrolling when the content still needs it.
- Controls must be touch-friendly.
- Interactions must not depend on hover.
- Responsive changes must not reduce the readability or usability of the wider-screen layout.
