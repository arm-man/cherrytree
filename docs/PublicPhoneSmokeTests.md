# Public Phone Smoke Tests

Use development data with at least one Person whose phone number is set and one whose phone number is NULL. Apply `003_migration_people_phone_spouse_dates.sql` first.

- In Genealogy View, verify the phone icon appears immediately after each name with a number, including the Parent and all descendant generations. Names without numbers have no icon.
- On a hover-capable, fine-pointer device, hover over an icon and move into the popup. Verify the formatted number and Copy remain available and Call does not appear. Move away to dismiss a hover preview.
- Click or tap the icon to keep the popup open; activate it again, click/tap outside, or press Escape to dismiss it. Scrolling or resizing also dismisses it. Compare with the Age popup.
- On a hover-capable, fine-pointer device, tab to the icon and then to Copy. Verify visible focus and that the popup stays open until focus leaves. Check the icon's accessible name identifies the Person and the popup controls are exposed as an interactive group.
- Copy on localhost or HTTPS, then paste into a text field. Verify the displayed phone number is copied without `tel:` and Copy briefly changes to Copied. With clipboard permission denied, verify Could not copy appears and the number remains selectable.
- On a touch-oriented, coarse-pointer device, tap an icon. Verify the formatted number and Call appear and Copy does not. Verify Call is an anchor whose href is `tel:+1` followed by the stored 10 digits.
- Verify Copy and Call do not change the displayed Parent on their respective device types. Verify clicking the Person's name still navigates as before.
- At narrow mobile widths, tap an icon and then Call. Verify the popup stays inside the viewport and escapes the table's clipping. Verify tapping outside dismisses it.
- Switch to List View with a phone popup open. Verify no phone icons, phone text, or Copy/Call controls remain. Check sorting, filtering, and name navigation back to Genealogy.
- Check living ages remain plain text and deceased Age popups still show death details on hover, focus, click, and tap, with their existing dismissal behavior.
- Verify no spouse dates appear in the public UI or server-to-client payload.
