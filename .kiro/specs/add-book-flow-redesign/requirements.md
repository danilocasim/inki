# Requirements Document

## Introduction

The add-book flow on the Inki dashboard is the primary way users grow their local library. Today the flow has several friction points: two overlapping entry points with unclear hierarchy, a scan option buried below a manual form, a misleading multi-step progress indicator with only one real step, and placeholder data pre-filled into the form for non-scanned flows. This redesign consolidates the entry points, promotes barcode scanning as a secondary option behind an "or" divider, removes false affordances, and produces a clean, intentional journey from the dashboard through to a saved book — all while preserving the app's offline-first, no-account model.

The redesign also addresses several visual and UX improvements: removing the camera icon from the dashboard top bar, implementing a native-feeling draggable bottom sheet, compacting the Pulse heatmap to the current month, upgrading fixture book cover colors to rich jewel tones, improving the shelf card UI to feel more like a real bookshelf, and adding an optional cover image upload field to the book form.

---

## Glossary

- **Add_Book_Sheet**: The bottom sheet (modal) that opens when the user initiates adding a book. Implemented as a native-feeling draggable bottom sheet using `@gorhom/bottom-sheet` or equivalent. Acts as the entry point chooser and, for the manual path, the form host.
- **Entry_Chooser**: The first view inside the Add_Book_Sheet, presenting the two input methods (manual and scan) with manual as the primary option and scan as a secondary option below an "— or —" divider.
- **Scan_Path**: The flow where the user scans an ISBN barcode to auto-fill book metadata.
- **Manual_Path**: The flow where the user types book metadata directly into the Book_Form.
- **Book_Form**: The form component for entering or editing book metadata (title, author, genre, page count, status, and optional cover image). Replaces the current `BookForm` component.
- **Barcode_Scanner**: The full-screen camera view used to scan an ISBN barcode. Corresponds to the current `BarcodeScanScreen`.
- **ISBN_Lookup**: The optional network call to Open Library that attempts to resolve an ISBN to book metadata.
- **Book_Draft**: The pre-populated, editable state of the Book_Form after a successful or partial ISBN_Lookup.
- **Dashboard**: The home tab screen (`DashboardScreen`). The starting point for all add-book flows.
- **Book_Detail**: The screen shown after a book is saved (`/book/[id]`).
- **Capture_Hub**: The existing `/capture/index` screen for camera-based actions (scan ISBN, capture quote). Accessible via the tab bar or a dedicated route, but no longer via a camera icon in the dashboard top bar.
- **Pulse_Card**: The heatmap card on the Dashboard showing reading consistency. Displays the current month only (approximately 4–5 weeks).
- **Shelf_Card**: A card in the `ShelfOverviewScreen` representing a single shelf. Displays shelf title, subtitle, book count, and a visual preview of book spine colors.
- **Cover_Image**: An optional user-selected photo from the device camera roll, stored locally and displayed in place of the color-based cover when present.

---

## Requirements

### Requirement 1: Consolidated Dashboard Entry Point

**User Story:** As a reader, I want a single, unambiguous way to add a book from the dashboard, so that I always know where to start without second-guessing which button to tap.

#### Acceptance Criteria

1. THE Dashboard SHALL provide exactly one primary add-book entry point: a "+" icon button in the top-right action bar.
2. WHEN the user taps the "+" icon button, THE Dashboard SHALL open the Add_Book_Sheet.
3. WHEN the user's book library is empty, THE Dashboard SHALL display an empty-state "Add Book" button that opens the Add_Book_Sheet.
4. THE Dashboard SHALL NOT display a camera icon button in the top-right action bar.
5. THE Dashboard top-right action bar SHALL contain only the bell (notifications) icon and the "+" (add book) icon.
6. THE Dashboard SHALL NOT present a second, separate add-book path through a camera icon.

---

### Requirement 2: Add Book Sheet with Clear Method Hierarchy

**User Story:** As a reader, I want the add-book sheet to immediately show me my two options — type or scan — with manual entry as the primary path and scan as a clearly available secondary option, so that I can choose the right method without hunting.

#### Acceptance Criteria

1. WHEN the Add_Book_Sheet opens, THE Entry_Chooser SHALL be the first and only content visible.
2. THE Entry_Chooser SHALL present two options: "Enter manually" (primary) and "Scan barcode" (secondary, accent-styled).
3. THE Entry_Chooser SHALL display the "Enter manually" option above an "— or —" divider row.
4. THE Entry_Chooser SHALL display the "Scan barcode" option below the "— or —" divider row.
5. THE Entry_Chooser SHALL include a short descriptor beneath each option label explaining what it does (e.g., "type title, author & more" and "auto-fill from ISBN").
6. THE Add_Book_Sheet SHALL display a sheet title of "add a book" in the header.
7. THE Add_Book_Sheet SHALL display a close ("×") button that dismisses the sheet without saving.
8. WHEN the user taps the close button, THE Add_Book_Sheet SHALL dismiss and return the user to the Dashboard without any navigation side-effects.

---

### Requirement 3: Scan Path — Barcode Scanner Launch

**User Story:** As a reader, I want tapping "Scan barcode" to immediately open the camera, so that I can scan a book's ISBN without extra navigation steps.

#### Acceptance Criteria

1. WHEN the user taps "Scan barcode" in the Entry_Chooser, THE Add_Book_Sheet SHALL dismiss and THE Barcode_Scanner SHALL open as a full-screen view.
2. THE Barcode_Scanner SHALL display a title of "scan barcode" and a back ("←") button that returns the user to the Add_Book_Sheet Entry_Chooser.
3. WHEN the user taps the back button on the Barcode_Scanner, THE Barcode_Scanner SHALL close and THE Add_Book_Sheet SHALL reopen showing the Entry_Chooser.
4. THE Barcode_Scanner SHALL display a live camera viewfinder with an alignment frame and instructional text.
5. THE Barcode_Scanner SHALL display a "enter manually" fallback button that opens the Book_Form inside the Add_Book_Sheet without closing the sheet.

---

### Requirement 4: Scan Path — ISBN Lookup and Book Draft

**User Story:** As a reader, I want the app to look up my scanned ISBN and pre-fill the form with whatever it finds, so that I spend as little time typing as possible.

#### Acceptance Criteria

1. WHEN the Barcode_Scanner detects a valid EAN-13 ISBN barcode, THE Barcode_Scanner SHALL trigger the ISBN_Lookup for that ISBN.
2. WHILE the ISBN_Lookup is in progress, THE Add_Book_Sheet SHALL display a loading indicator and the message "looking up ISBN…".
3. WHEN the ISBN_Lookup returns metadata, THE Add_Book_Sheet SHALL transition to the Book_Form pre-populated with the returned title, author, and genre fields.
4. WHEN the ISBN_Lookup returns no metadata or fails, THE Add_Book_Sheet SHALL transition to the Book_Form with only the scanned ISBN pre-populated and all other fields empty.
5. THE Book_Form SHALL display a "scanned" badge or label near the ISBN field when the source is a barcode scan, so the user knows the ISBN was captured automatically.
6. IF the Barcode_Scanner detects a barcode that is not a valid book ISBN, THEN THE Barcode_Scanner SHALL display the message "That barcode is not a valid book ISBN. Try the EAN-13 barcode on the back cover or enter manually." and SHALL NOT navigate away.

---

### Requirement 5: Manual Path — Book Form

**User Story:** As a reader, I want a clean, honest form for entering book details manually, so that I can add a book quickly without being confused by placeholder data or fake progress steps.

#### Acceptance Criteria

1. WHEN the user taps "Enter manually" in the Entry_Chooser, THE Add_Book_Sheet SHALL transition to the Book_Form with all fields empty.
2. THE Book_Form SHALL NOT pre-populate any field with placeholder or example data (e.g., "Normal People", "Sally Rooney", "273") when the source is manual entry.
3. THE Book_Form SHALL display the following fields: title (required), author (required), genre (optional), page count (optional, numeric), and reading status (segmented control, required).
4. THE Book_Form SHALL NOT display a step progress indicator (e.g., "step 1 of 4") unless a genuine multi-step flow exists.
5. THE Book_Form SHALL display a "Save book" primary action button.
6. THE Book_Form SHALL display a "← back" link that returns the user to the Entry_Chooser without losing any data the user has already typed.
7. WHEN the user taps "← back" from the Book_Form, THE Add_Book_Sheet SHALL show the Entry_Chooser and SHALL preserve the typed field values in memory so they are restored if the user returns to the form in the same session.
8. THE Book_Form SHALL NOT display a separate "scan barcode" card or secondary scan affordance below the form fields.

---

### Requirement 6: Form Validation

**User Story:** As a reader, I want the form to tell me clearly when I've missed a required field, so that I don't accidentally save an incomplete book record.

#### Acceptance Criteria

1. WHEN the user taps "Save book" and the title field is empty, THE Book_Form SHALL display an inline error message "Title is required" adjacent to the title field and SHALL NOT submit the form.
2. WHEN the user taps "Save book" and the author field is empty, THE Book_Form SHALL display an inline error message "Author is required" adjacent to the author field and SHALL NOT submit the form.
3. WHEN the user taps "Save book" and the page count field contains a non-numeric value, THE Book_Form SHALL display an inline error message "Page count must be a number" adjacent to the page count field and SHALL NOT submit the form.
4. WHEN the user taps "Save book" and all required fields are valid, THE Book_Form SHALL submit the form and display a loading state on the "Save book" button.
5. IF the save operation fails, THEN THE Book_Form SHALL display an error message at the top of the form and SHALL re-enable the "Save book" button.

---

### Requirement 7: Successful Save and Navigation

**User Story:** As a reader, I want to land on my new book's detail page immediately after saving, so that I can confirm the entry looks right and start a reading session.

#### Acceptance Criteria

1. WHEN the Book_Form save operation succeeds, THE Add_Book_Sheet SHALL dismiss.
2. WHEN the Add_Book_Sheet dismisses after a successful save, THE Dashboard SHALL navigate to the Book_Detail screen for the newly saved book.
3. THE Book_Detail screen SHALL display the book's title, author, genre, page count, and reading status as saved.
4. WHEN the user navigates back from the Book_Detail screen, THE Dashboard SHALL be visible and SHALL reflect the newly added book in the appropriate status tab.

---

### Requirement 8: Camera Permission Handling

**User Story:** As a reader, I want the app to handle camera permission gracefully, so that I can still add a book manually if I decline camera access.

#### Acceptance Criteria

1. WHEN the user taps "Scan barcode" and camera permission has not been requested, THE Barcode_Scanner SHALL display a permission rationale explaining that the camera is used only for local ISBN scanning.
2. WHEN the user grants camera permission, THE Barcode_Scanner SHALL activate the live camera viewfinder without requiring the user to tap again.
3. WHEN the user denies camera permission, THE Barcode_Scanner SHALL display the message "Camera access is blocked. Enable it in system settings, or add the book manually." and SHALL display an "enter manually" button.
4. WHEN the user taps "enter manually" from the permission-denied state, THE Add_Book_Sheet SHALL transition to the Book_Form with all fields empty.
5. IF the camera fails to start after permission is granted, THEN THE Barcode_Scanner SHALL display the message "Camera failed to start. You can still enter the ISBN manually." and SHALL display an "enter manually" button.

---

### Requirement 9: Offline Operation

**User Story:** As a reader, I want to add books without an internet connection, so that the app works reliably anywhere.

#### Acceptance Criteria

1. THE Book_Form SHALL save a book to local storage without requiring a network connection.
2. WHILE the device has no network connection, THE Add_Book_Sheet SHALL allow the user to complete the Manual_Path without displaying a network error.
3. WHILE the device has no network connection and the user is on the Scan_Path, THE Barcode_Scanner SHALL scan the ISBN and THE Add_Book_Sheet SHALL open the Book_Form with the ISBN pre-populated and all other fields empty.
4. THE Add_Book_Sheet SHALL NOT block form submission or display a network-required error for any field.

---

### Requirement 10: Draggable Native Bottom Sheet

**User Story:** As a reader, I want the add-book sheet to feel like a native iOS/Android bottom sheet — draggable, snapping, and dismissible by swiping down — so that the interaction feels polished and familiar.

#### Acceptance Criteria

1. THE Add_Book_Sheet SHALL be implemented as a draggable bottom sheet using `@gorhom/bottom-sheet` or an equivalent native-feeling library, replacing the current full-screen modal approach.
2. THE Add_Book_Sheet SHALL display a drag handle pill at the top center of the sheet.
3. THE Add_Book_Sheet SHALL snap to a half-height position when the Entry_Chooser is visible and expand to full-height when the Book_Form is open.
4. WHEN the user drags the sheet downward past a dismiss threshold, THE Add_Book_Sheet SHALL dismiss and return the user to the Dashboard.
5. THE Add_Book_Sheet SHALL have rounded top corners with a border radius of approximately 28px.
6. THE Add_Book_Sheet SHALL use a dark background color matching the app canvas (`tokens.color.canvas`).
7. WHEN the Add_Book_Sheet opens, THE Add_Book_Sheet SHALL animate in from the bottom of the screen using a slide-up transition.
8. WHEN the user transitions from the Entry_Chooser to the Book_Form within the Add_Book_Sheet, THE Add_Book_Sheet SHALL animate the content change using a horizontal slide or cross-fade transition rather than an abrupt replacement.
9. WHEN the Barcode_Scanner closes after a successful scan and the Add_Book_Sheet opens with the Book_Draft, THE Add_Book_Sheet SHALL animate in from the bottom of the screen so the transition does not feel like a hard navigation reset.
10. WHEN the Add_Book_Sheet dismisses, THE Add_Book_Sheet SHALL animate out downward to the bottom of the screen.
11. THE Add_Book_Sheet SHALL NOT use a full-screen push navigation transition for internal step changes (Entry_Chooser → Book_Form).

---

### Requirement 11: Remove Camera Icon from Dashboard Top Bar

**User Story:** As a reader, I want the dashboard top bar to be uncluttered, so that the primary actions (notifications and add book) are immediately clear without visual noise.

#### Acceptance Criteria

1. THE Dashboard top-right action bar SHALL NOT contain a camera icon button.
2. THE Dashboard top-right action bar SHALL contain exactly two icon buttons: the bell (notifications) icon and the "+" (add book) icon.
3. THE Capture_Hub SHALL remain accessible via the tab bar or a dedicated route, but SHALL NOT be reachable from the dashboard top bar.
4. WHEN the camera icon is removed, THE Dashboard layout SHALL NOT leave an empty gap or misaligned spacing in the top-right action bar.

---

### Requirement 12: "— or —" Divider in Entry Chooser

**User Story:** As a reader, I want the add-book entry chooser to use a familiar "or" divider pattern — like a login form — so that the hierarchy between manual entry and scan is immediately clear.

#### Acceptance Criteria

1. THE Entry_Chooser SHALL display the "Enter manually" option as the primary (top) choice.
2. THE Entry_Chooser SHALL display an "— or —" divider row between the "Enter manually" option and the "Scan barcode" option.
3. THE "— or —" divider SHALL be styled as a horizontal rule with centered muted text, consistent with login-form divider conventions.
4. THE Entry_Chooser SHALL display the "Scan barcode" option below the "— or —" divider as the secondary choice.
5. THE "Scan barcode" option SHALL remain visually distinct using accent styling (e.g., accent color border or background tint) to indicate it is a fast-path alternative.
6. THE Entry_Chooser SHALL NOT display "Scan barcode" above "Enter manually".

---

### Requirement 13: Pulse Card — Current Month Heatmap

**User Story:** As a reader, I want the Pulse heatmap to show only the current month, so that the card is compact and the data feels immediately relevant.

#### Acceptance Criteria

1. THE Pulse_Card SHALL display a heatmap grid covering only the current calendar month (approximately 4–5 weeks of columns).
2. THE Pulse_Card SHALL display the label "This month" in place of the previous "Last 16 weeks" label.
3. THE Pulse_Card heatmap grid SHALL use the same cell style, cell size, gap, and color levels as the previous 16-week implementation.
4. THE Pulse_Card SHALL display the same legend (less → more color scale) below the heatmap grid.
5. THE Pulse_Card SHALL NOT display more than 5 weeks of columns in the heatmap grid.

---

### Requirement 14: Improved Fixture Book Cover Colors

**User Story:** As a reader, I want the pre-made book covers in the dashboard to use rich, saturated colors that feel intentional and beautiful on the dark canvas, so that the app looks editorial and polished.

#### Acceptance Criteria

1. THE fixture books in `fixtures.ts` SHALL use cover colors that are rich, saturated, and editorially considered — such as deep jewel tones, warm terracottas, rich forest greens, and inky blues — rather than muted or desaturated colors.
2. EACH fixture book SHALL have a distinct cover color that is visually differentiated from the other fixture books.
3. EACH fixture book SHALL have a complementary spine color that is a darker or more saturated variant of the cover color.
4. THE text color for all fixture books SHALL remain `#FFF9F0`.
5. THE cover colors SHALL be chosen to look like real book covers on a dark shelf background.
6. THE following muted colors SHALL be replaced: `#D6C6A3` (Piranesi), `#C98A6A` (Klara), `#81906E` (The Overstory), and any other desaturated cover colors in the fixture set.

---

### Requirement 15: Improved Shelf Card UI

**User Story:** As a reader, I want the shelf cards to feel like a real bookshelf — with richer visuals, better typography hierarchy, and mini book spine previews — so that browsing my shelves feels editorial and immersive.

#### Acceptance Criteria

1. THE Shelf_Card SHALL display the shelf title using a prominent typographic style (e.g., `sectionTitle` variant) as the primary visual element.
2. THE Shelf_Card SHALL display the shelf subtitle as muted body text below the title.
3. THE Shelf_Card SHALL display the book count as an eyebrow label (e.g., "6 BOOKS") above or alongside the title, using a small caps or eyebrow text style.
4. THE Shelf_Card SHALL display mini book spine previews — colored vertical strips representing the cover colors of books on the shelf — as the primary visual decoration, either replacing or augmenting the current three-swatch stack.
5. THE Shelf_Card SHALL use the shelf accent color as a visual accent element (e.g., a colored left border, a tinted background strip, or a highlighted swatch).
6. THE Shelf_Card layout SHALL feel more like a real bookshelf row than a generic list card, with the spine previews evoking physical books on a shelf.
7. THE Shelf_Card SHALL maintain accessibility: each card SHALL have an accessible label and role for screen readers.

---

### Requirement 16: Cover Image Upload in Book Form

**User Story:** As a reader, I want to optionally attach a photo from my camera roll as the book cover, so that my library feels personal and visually rich even for books without a scanned ISBN.

#### Acceptance Criteria

1. THE Book_Form SHALL display a cover image placeholder at the top of the form, showing the current color-based cover preview (using `palette.cover`) when no image has been selected.
2. WHEN the user taps the cover image placeholder, THE Book_Form SHALL open the device photo library using `expo-image-picker`.
3. WHEN the user selects an image from the photo library, THE Book_Form SHALL display a preview of the selected image in the cover placeholder, replacing the color-based preview.
4. WHEN the user saves the book with a selected cover image, THE Book_Form SHALL store the image path locally in the `coverPath` field of the `Book` record (mapped to `cover_path` in `BookRow`).
5. WHEN the user saves the book without selecting a cover image, THE Book_Form SHALL save the book using the color-based cover (`palette.cover`) as the fallback, with `coverPath` left undefined.
6. THE cover image field SHALL be optional — the form SHALL be submittable without a cover image selected.
7. WHEN the user has selected a cover image and taps the placeholder again, THE Book_Form SHALL allow the user to replace the image by reopening the photo library.
8. IF the user denies photo library permission, THEN THE Book_Form SHALL display a message explaining that photo library access is needed to select a cover image, and SHALL NOT crash or block form submission.
9. THE cover image upload SHALL use `expo-image-picker` and SHALL store images locally on the device without any network upload.

---

### Requirement 17: Capture Hub Accessibility Without Dashboard Camera Icon

**User Story:** As a reader, I want to still be able to access the Capture Hub (quote capture and camera actions) even after the camera icon is removed from the dashboard, so that I don't lose access to that functionality.

#### Acceptance Criteria

1. THE Capture_Hub SHALL remain accessible via the app tab bar or a dedicated navigation route.
2. THE app navigation SHALL NOT require the dashboard camera icon to reach the Capture_Hub.
3. WHEN the camera icon is removed from the dashboard top bar, THE Capture_Hub route (`/capture/index`) SHALL remain functional and navigable.
4. THE tab bar or alternative navigation entry point for the Capture_Hub SHALL have an accessible label and icon consistent with its purpose (camera/capture actions).
