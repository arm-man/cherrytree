# Cherry Tree Product Specification

## Overview

Cherry Tree is a mobile-friendly, web-based family information website of the Cherry family.
Primary user goal: view birthdays, see how people are related, and conveniently search and sort the information.

## Terminology

- **View**: one of Genealogy or List.
- **Genealogy** : The View in which the Root Person, Children, Grandchildren, Great Grandchildren, and Great Great Grandchildren are shown, each as their own table.
- **Root Person** : The Person whose descendants are displayed in Genealogy View.
- **List** : The View in which all People are shown in a table.
- **People** : Each entry displays the following data: First Name, Last Name, Age, Birthday, Children, Spouse.
- **Person** : The same as People but when used for a one People entry; the term Person is used simply because it is the singular of People in English.
- **Full Name** : The concatenation of the First Name with the Last Name.
- **Generation** : One of Root Person, Children, Grandchildren, Great Grandchildren, or Great Great Grandchildren.
- **Control** : The View, Sort, or Search controls.
- **Reset** : Set the View to Genealogy, select id=1 as the Root Person, clear the Search box, set the displayed Sort to None (Blank), and reset the remembered List View Sort to Birthday.

## Data

- Every Person has a First Name, Last Name, Birthday, and one parent relationship, except id=1, who is the single top-level Person and has no parent. Death Day, Spouse, Phone Number, Spouse's Birthday, and Spouse's Death Day are optional and may be null/blank. Phone Number and spouse dates are administrative data only and are not shown on public pages.
- The parent relationships are sufficient to derive the complete genealogy of descendants.
- Today's date means the current calendar date in the user's local time zone for all product rules that depend on today, including Age and Upcoming Birthday.
- Age is derived from Birthday and Death Day (if deceased) or today's date (if living) and is not independently maintained.
- Children is derived as the number of People whose parent is that Person and is not independently maintained.

## Wordmark

- The page will have a Cherry Tree wordmark in the upper left.
- When the wordmark is clicked, perform a Reset.

## Control Section

- This section will show a View toggle, Sort dropdown menu, and a Search text box.
- On mobile, View and Sort share the first row, with View sized to its buttons and Sort filling the remaining width. Search spans the full second row. Use compact panel padding and spacing while keeping controls touch-friendly.
- The View control toggles between Genealogy and List.
  - Genealogy is the default.
  - When Genealogy is selected, the page switches to Genealogy View and the Root Person that was last selected (remembered in React state during the current page lifetime) is restored. The Sort option is stored, then changed to None (Blank).
    - In Genealogy View, the Sort control displays a blank value because sorting does not apply to the overall Genealogy View. Note that Blank is not a selectable Sort option in the List View.
  - When List is selected, the page switches to List View and restores the most recently selected List View Sort. If no List View Sort has previously been selected, Birthday is used.
- Sort options include: Birthday, Upcoming Birthday, Death Day, First Name, Last Name, Spouse, Children. Use the order presented here, not alphabetical.
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

- The People are shown in a single table with columns: Name, Age, Birthed, Children, Spouse.
  - Name is the Full Name.
  - Birthed displays the Person's Birthday. The term "Birthed" is used since it preserves the naming as used on the original site: http://roncherry.net/cherrytree/birthed.htm
- When the Sort option is Upcoming Birthday, ignore the year and sort each Person by the next occurrence of their birthday relative to today's date, including today. Birthdays wrap across calendar years. Any birthday within the next 7 days (today and the next 6 days) will be highlighted. Include People with a Death Day in the Upcoming Birthday list.
- When the Sort option is Birthday, the order includes the year and is sorted ascending so that the oldest person is listed first, youngest person is listed last.
- When the Sort option is Death Day, the order includes the year and is sorted ascending so that the person who died first is listed first, and the most recently deceased is listed last.
- When the Sort option is Spouse, sort alphabetically. Ignore the fact that the name may contain a first or last name, simply order the text data alphabetically.
- When the Sort option is Children, sort descending.
- When the Sort option is Death Day or Spouse, any entry without data is omitted.
- When a sort has the same value, e.g. the same Children, the secondary sort is by Full Name. Any additional conflicts are not necessary to resolve and defaulting to the database order is ok.
  - When the Sort option is First Name, sort alphabetically ascending by First Name. Secondary sort is by Last Name. Any additional conflicts are not necessary to resolve and defaulting to the database order is ok.
  - When the Sort option is Last Name, sort alphabetically ascending by Last Name. Secondary sort is by First Name. Any additional conflicts are not necessary to resolve and defaulting to the database order is ok.
- Each Person's Name is clickable. When clicked, the View changes to Genealogy and the Person clicked becomes the Root Person. The Sort option is stored, then changed to None (Blank).
- If Search produces no results, display "No people found."

## Genealogy View

- Instead of a single table as used in List View, Genealogy View uses multiple tables, one table for each Generation.
- The Root Person section contains exactly one Person: the Root Person.
- Each Genealogy table displays the same Person data columns as List View except Children, which is omitted.
- The number of children, grandchildren, etc. is listed in the Generation title, e.g. "Children (5)" if the Root Person has 5 children or "Grandchildren (18)" if the Root Person has 18 grandchildren.
  - The numbers in parenthesis do not change based on the entries highlighted by the Search text box.
- When Search is empty, no rows are highlighted based on Search.
- If the Root Person has zero of a certain Generation, that Generation is omitted, with the exception of the Children Generation, in which case that section is shown but with the message "No Children".
- Each Person's Name is clickable. When a descendant's Name is clicked, that Person becomes the Root Person.
- When the current Root Person's Name is clicked, that Person's parent becomes the new Root Person. If the current Root Person has no parent, the Root Person does not change.
- The Children table is sorted by Birthday, ascending (oldest first).
- For Grandchildren, Great Grandchildren, and Great Great Grandchildren:
  - Include an additional column called Parent, which displays the Person's immediate parent.
  - These tables are sorted first by the immediate Parent's birthday, ascending (oldest first), then by the Person's Birthday, ascending (oldest first).

## User Experience

- Root Person is always displayed as "Parent" in the UI. The user should never encounter the term Root within the website.
  - Be aware that in the UI, there will be a Parent that is the Root Person and a Parent of a Grandchild. This is ok for the user experience.
- Age displays completed whole years, comparing the full Birthday with today's local calendar date for living People or Death Day for deceased People.
  - Living People's ages are plain, noninteractive text.
  - Deceased People's ages show age at death followed by a dagger, e.g. "82 †", on a subtly underlined button. Its accessible label communicates the age, deceased status, and availability of death details; the dagger is not the only indication of death.
  - Hover, keyboard focus, click, or tap reveal a small popup with "Died March 14, 2008" and "Would be 100 today", using that Person's Death Day and hypothetical completed age as of today. Activation keeps the popup open; activating again, pressing Escape, clicking/tapping outside, or moving focus away dismisses it. Hover previews remain available while the pointer is over the age or popup.
  - Retain visible keyboard focus. Keep the popup within the viewport and outside table clipping, without adding horizontal scrolling; dismiss it when the viewport is resized or scrolled.
- Neither View has a Death Day column. Keep Death Day in stored and internal Person data for age calculations, death details, and the existing Death Day sort.
- Public dates use full English month names, e.g. March 14, 2008 or May 17, 1947, matching the existing Birthed display. Birthday and Death Day remain calendar dates without time-zone conversion.
- Children to be shown as a number.
- If there is no Spouse, that field remains blank.
- The Spouse is not a Person in the database and is not clickable. A Spouse is simply an informational field that accompanies a Person. A Person may have one Spouse or no Spouse; cases of remarrying are not considered.
- Generations contain only descendants of the Root Person; Spouses have no effect on Generations.
- If the Person has no children, display 0.
- The color palette shall use the same colors as those found at http://roncherry.net/cherrytree/, i.e. #FDEBCF as the main background color and #F3979D as the secondary/highlight color. Other colors, particularly black and white, are allowed, the guidance here is on the two main colors for the palette.
- Edge cases related to February 29 (leap year) can be ignored for now as there is no date data for February 29.

## Administration

- Admin pages use #E8F1F5 as the main background color and #5B8FA8 as the secondary/highlight color to distinguish them from regular pages.
- The initial administration feature is part of the same Cherry Tree application and is available without authentication. Administrator authentication may be added later.
- The Admin People List is available at `/admin/people`.
  - Load all People and sort them alphabetically by Full Name.
  - Each Person is a clickable entry with columns in exactly this order: Full Name, Birthday, Death Day, Parent's Full Name, Phone Number, Spouse (Sp), Sp Birthday, Sp Death Day.
  - Use compact table text and cell spacing, with more available width on large screens, to minimize horizontal scrolling. Use slightly larger text with dense rows and minimal vertical gaps to show more names at once. Long names and column headings may wrap; dates and phone numbers stay on one line. Keep every value fully accessible, name links at least 24 pixels tall, and horizontal scrolling where needed.
  - All null optional values remain blank. The single top-level Person's Parent remains blank. Admin date displays, including Parent options, use abbreviated English months, e.g. Dec 14, 1975; public date formatting is unchanged.
  - A Search text box filters the list immediately using a case-insensitive partial-text match against Full Name or Spouse. Leading and trailing whitespace in the Search text is ignored.
  - If Search produces no results, display "No people found."
  - Preserve the Search text when returning from an Add Person or Edit Person page.
  - An Add Person button navigates to `/admin/people/new`.
  - Clicking a Person navigates to `/admin/people/[id]/edit` for that Person.
- The Add Person and Edit Person forms contain fields in exactly this order: First Name, Last Name, Birthday, Death Day, Parent, Phone Number, Spouse, Spouse's Birthday, Spouse's Death Day.
  - First Name, Last Name, Birthday, and Parent are required, except that id=1 is the single top-level Person and has no Parent.
  - Death Day, Phone Number, Spouse, Spouse's Birthday, and Spouse's Death Day are optional. Blank optional values are stored as null and existing values can be cleared.
  - Birthday must not be in the future. Death Day, when provided, must not be before Birthday or in the future.
  - Spouse's Birthday must not be in the future. Spouse's Death Day requires Spouse's Birthday and must be on or after it and not in the future. Equal birth/death dates are allowed for both the Person and Spouse. Spouse dates do not require a Spouse name.
  - Phone Number accepts exactly 10 U.S. digits after removing spaces, parentheses, hyphens, and periods. Reject other characters, country codes, and extensions; do not validate area codes or exchanges. Store digits only; display as (703) 555-1234 in the list and edit form. Validate on both client and server.
  - The Parent control is a searchable dropdown sorted alphabetically by Full Name. Each option displays the Person's Full Name and Birthday.
  - The Spouse, Spouse's Birthday, and Spouse's Death Day inputs use a subtle contrasting background tint.
  - Parent appears immediately after Death Day and before Phone Number in the form. On the Add Person page, Parent remains disabled until a valid Birthday is entered.
  - A Person is eligible to be selected as Parent only if the proposed Parent was at least 15 years old when the Person was born.
  - On the Edit Person page, the Person being edited and all of that Person's descendants are excluded from the Parent options.
  - When editing id=1, Parent displays no value and is disabled. No other Person may have a null Parent.
  - Client-side validation provides immediate feedback, but the server validates all fields and relationship rules before saving.
  - While a save request is pending, disable the form's action buttons to prevent duplicate submissions.
  - If validation fails, remain on the form, preserve the entered values, and show field-specific or form-level errors.
- The Edit Person page contains Save and Cancel buttons.
  - Cancel returns to the Admin People List without saving.
  - If Save succeeds, return to the Admin People List.
  - If Save is selected when no editable values have changed, remain on the Edit Person page and display "No changes were made."
- The Add Person page contains Save and Cancel/Return buttons.
  - If Save succeeds, remain on the Add Person page, clear the form, and display a confirmation that identifies the Person added and indicates that another Person may be entered.
  - Cancel/Return returns to the Admin People List without saving the current form.
- The initial administration feature does not provide a way to delete a Person.

## Mobile Requirements

- The application must work well on common mobile, tablet, and desktop screen sizes.
- On narrow screens, table rows shall not be stacked, rather, horizontal scrolling will be enabled. All information available in the desktop table must remain accessible.
  - Use an appropriate text size as a tradeoff between having to horizontally scroll a lot versus readability of the text.
- Controls must be touch-friendly.
- Interactions must not depend on hover.
- Responsive changes must not reduce the readability or usability of the wider-screen layout.
