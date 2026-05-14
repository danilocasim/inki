# Requirements Document

## Introduction

This spec covers a collection of UI fixes and improvements across multiple screens in the Inki app. The changes span onboarding flow consolidation, book detail interactivity improvements, add-book form refinements, long-press action menu layout standardisation, tab bar simplification, and pulse card legend accuracy. Together they reduce friction, improve visual consistency, and align the UI with the intended product direction.

---

## Glossary

- **Onboarding_Screen**: The `OnboardingScreen` component in `src/features/onboarding/OnboardingScreen.tsx`.
- **WhatPage_Step**: The onboarding step that collects the page number for the user's first bookmark (currently step index 3).
- **PickLine_Step**: The onboarding step that presents OCR candidates and a "type it" tab for line selection (currently step index 4).
- **Combined_Bookmark_Step**: The new merged step that replaces WhatPage_Step and PickLine_Step, showing the page number input above the line picker in a single scrollable view.
- **WhyThisLine_Step**: The onboarding step where the user adds a note and tags to their first bookmark.
- **Book_Detail_Screen**: The `BookDetailScreen` component in `src/features/books/screens/BookDetailScreen.tsx`.
- **Progress_Card**: The `Card` in `Book_Detail_Screen` labelled "YOUR PROGRESS" that displays the current reading percentage and progress bar.
- **Log_Today_Card**: The `Card` in `Book_Detail_Screen` labelled "log today" that contains the page number `TextInput` and save button.
- **Progress_Slider**: The draggable `Slider` component that replaces the static progress bar in `Progress_Card`.
- **Add_Book_Sheet**: The `AddBookSheet` component in `src/features/books/screens/AddBookSheet.tsx`.
- **Entry_Chooser**: The `EntryChooser` sub-component inside `Add_Book_Sheet` that presents the three entry options.
- **Book_Form**: The `BookForm` component in `src/features/books/components/BookForm.tsx`.
- **Genre_Picker**: The dropdown/modal picker that replaces the free-text genre `TextInput` in `Book_Form`.
- **Dashboard_Screen**: The `DashboardScreen` component in `src/features/dashboard/DashboardScreen.tsx`.
- **Stack_Book**: The `StackBook` sub-component inside `Dashboard_Screen` that renders a single book tile in the three-column grid.
- **Long_Press_Menu**: The overlay UI (dim layer + elevated tile + action buttons) activated by long-pressing a `Stack_Book`.
- **Action_Button**: One of the three circular floating buttons (Share, Pin, Shelf) in the `Long_Press_Menu`.
- **Shelf_Picker**: The `@gorhom/bottom-sheet` bottom sheet opened by the Shelf `Action_Button`, listing all user shelves for toggling book membership.
- **Pulse_Card**: The `PulseCard` sub-component inside `Dashboard_Screen` that renders the reading-consistency heatmap.
- **Heat_Cell**: A single cell in the `Pulse_Card` heatmap grid.
- **Legend_Cell**: A single cell in the `Pulse_Card` legend row.
- **Tab_Bar**: The bottom navigation bar defined in `app/(tabs)/_layout.tsx`.
- **Capture_Tab**: The "capture" tab entry in the `Tab_Bar` that links to `app/(tabs)/capture.tsx`.
- **Shelves_Repository**: The repository in `src/features/shelves/repositories/shelves-repository.ts`.
- **Shelf**: The `Shelf` interface in `src/features/shelves/types.ts`, which includes `id`, `title`, `accent`, and `count` fields.

---

## Requirements

### Requirement 1: Onboarding — Combine "What Page" and "Pick a Line" into One Step

**User Story:** As a new user going through onboarding, I want to enter my page number and pick my first line on the same screen, so that the flow feels shorter and more cohesive.

#### Acceptance Criteria

1. THE Onboarding_Screen SHALL replace the separate WhatPage_Step (step index 3) and PickLine_Step (step index 4) with a single Combined_Bookmark_Step at step index 3.
2. THE Combined_Bookmark_Step SHALL display the page number input section at the top of the scrollable content, followed immediately by the line picker section (OCR candidates / type it tabs) below it.
3. THE Combined_Bookmark_Step SHALL display the eyebrow label "YOUR FIRST BOOKMARK · 1 OF 2".
4. THE WhyThisLine_Step SHALL display the eyebrow label "YOUR FIRST BOOKMARK · 2 OF 2".
5. THE Onboarding_Screen SHALL reduce its total step count from 10 to 9 as a result of this merge.
6. THE progress bar at the top of each step SHALL reflect the new 9-step total (i.e. render 8 segments instead of 9).
7. WHEN the user taps "next" on the Combined_Bookmark_Step, THE Onboarding_Screen SHALL advance to the WhyThisLine_Step.
8. WHEN the user taps the back button on the WhyThisLine_Step, THE Onboarding_Screen SHALL return to the Combined_Bookmark_Step.
9. THE Combined_Bookmark_Step SHALL preserve all existing behaviour of both merged steps: page number input with numeric keyboard, OCR candidate list, "type it" tab with multiline input, and highlight colour picker.
10. IF the user has not selected or typed a line, THE Combined_Bookmark_Step SHALL still allow advancing (line selection remains optional, matching existing behaviour).

---

### Requirement 2: Book Detail — Replace Static Progress Bar with a Draggable Slider

**User Story:** As a reader, I want to drag a slider to set my current page on the book detail screen, so that I can update my progress quickly without typing.

#### Acceptance Criteria

1. THE Progress_Card SHALL replace the static `progressTrack` / `progressFill` `View` pair with a `Progress_Slider` component.
2. THE Progress_Slider SHALL use a slider library available in the project (React Native's built-in `Slider` or `@react-native-community/slider`) and SHALL range from `0` to `book.totalPages` when `book.totalPages` is defined, or from `0` to `100` when `book.totalPages` is undefined.
3. THE Progress_Slider SHALL initialise its thumb position to reflect the current `nextPage` state value when the screen mounts.
4. WHEN the user drags the Progress_Slider, THE Book_Detail_Screen SHALL update the `nextPage` state in real time so that the Log_Today_Card text input reflects the new value immediately.
5. WHEN the user types a value in the Log_Today_Card text input, THE Progress_Slider SHALL update its thumb position in real time to reflect the typed value.
6. THE Progress_Slider thumb position and the Log_Today_Card text input SHALL remain bidirectionally synchronised at all times while the user is interacting with either control.
7. THE Progress_Slider SHALL be styled to match the existing design tokens (accent colour for the filled track, border colour for the empty track).
8. THE Progress_Slider SHALL have a minimum touch target height of 44 dp to meet accessibility guidelines.

---

### Requirement 3: Book Detail — Real-Time Progress Percentage from "Log Today" Input

**User Story:** As a reader, I want the progress percentage and bar to update as I type a page number, so that I get immediate visual feedback without having to save first.

#### Acceptance Criteria

1. WHILE the user is editing the Log_Today_Card text input, THE Progress_Card SHALL derive the displayed progress percentage from `nextPage` rather than from `book.progress`.
2. WHEN the user types a valid integer page number in the Log_Today_Card text input, THE Progress_Card SHALL recalculate and display the updated percentage immediately (on each keystroke).
3. WHEN the user types a value that exceeds `book.totalPages`, THE Progress_Card SHALL cap the displayed percentage at 100%.
4. WHEN the user clears the Log_Today_Card text input entirely, THE Progress_Card SHALL display 0% rather than the previously saved progress value.
5. WHEN the user saves progress via the "save progress" button, THE Progress_Card SHALL continue to display the percentage derived from `nextPage` (which now matches the saved value), with no visual jump.
6. IF `book.totalPages` is undefined, THE Progress_Card SHALL display the raw `nextPage` value as a percentage (treating it as a 0–100 scale), matching the existing fallback behaviour.

---

### Requirement 4: Add Book — "Enter Manually" Option Uses logo.png

**User Story:** As a user adding a book manually, I want to see the Inki logo on the "Enter manually" button, so that the option feels branded and distinct from the scan options.

#### Acceptance Criteria

1. THE Entry_Chooser SHALL replace the Feather `edit-2` icon inside the `optionIconAccent` circle on the "Enter manually" option with the app's `logo.png` image (`src/assets/logo.png`).
2. THE logo.png image SHALL be displayed inside the same 44 dp circular container (`optionIconAccent`) that currently holds the icon.
3. THE logo.png image SHALL be sized at 28 × 28 dp within the container and use `resizeMode="contain"`.
4. THE circular container background SHALL remain `tokens.color.black` (unchanged from the current `optionIconAccent` style).
5. THE "Enter manually" option row layout, label text, description text, and arrow icon SHALL remain unchanged.

---

### Requirement 5: Add Book — Genre Field Becomes a Dropdown Picker

**User Story:** As a user adding a book, I want to pick a genre from a predefined list, so that genre data is consistent and I don't have to type it.

#### Acceptance Criteria

1. THE Book_Form SHALL replace the free-text `TextInput` for the GENRE field with a Genre_Picker that presents a predefined list of genres.
2. THE Genre_Picker SHALL offer exactly the following genres in the listed order: `"literary fiction"`, `"contemporary"`, `"sci-fi"`, `"fantasy"`, `"historical fiction"`, `"thriller"`, `"mystery"`, `"romance"`, `"non-fiction"`, `"biography"`, `"self-help"`, `"poetry"`, `"graphic novel"`, `"translated"`, `"classic"`, `"family saga"`, `"horror"`, `"essay"`, `"other"`.
3. ON iOS, THE Genre_Picker SHALL present the genre list using an action sheet or a modal bottom sheet picker.
4. ON Android, THE Genre_Picker SHALL present the genre list using a native spinner or a modal picker.
5. WHEN the user selects a genre, THE Book_Form SHALL update the `genre` field value and display the selected genre in the field area.
6. THE Genre_Picker field SHALL remain optional: when no genre is selected, the field SHALL display a placeholder (e.g. "select a genre") and the `genre` value SHALL be an empty string, which is treated as no genre on save.
7. WHEN the user has previously selected a genre and reopens the picker, THE Genre_Picker SHALL pre-select the currently chosen genre.
8. THE Genre_Picker SHALL be visually consistent with the other `Field` components in `Book_Form` (same label style, same container height and border).

---

### Requirement 6: Add Book — Remove Shelves Section from Book Form

**User Story:** As a user adding a book, I want a simpler form without a shelves section, so that I can focus on the book details and assign shelves later via the long-press menu.

#### Acceptance Criteria

1. THE Book_Form SHALL remove the `shelfBlock` section (the SHELVES label, shelf list rows, and shelf error text) from its rendered output entirely.
2. THE `BookFormProps` interface SHALL remove the `onToggleShelf`, `selectedShelfIds`, `shelfError`, and `shelfOptions` props.
3. THE Add_Book_Sheet SHALL stop loading shelves from the database on mount (remove the `listShelves` call and associated `useEffect`).
4. THE Add_Book_Sheet SHALL stop maintaining `shelves`, `selectedShelfIds`, and `shelfError` state.
5. THE Add_Book_Sheet SHALL stop passing `onToggleShelf`, `selectedShelfIds`, `shelfError`, and `shelfOptions` props to `Book_Form`.
6. THE `useSaveBook` hook call in `Add_Book_Sheet` SHALL continue to accept an optional `shelfIds` array for future use, but the array SHALL be empty (`[]`) since shelf assignment is no longer part of the add-book flow.
7. THE `BookDetailScreen`'s internal `BookForm` usage (for editing an existing book) SHALL be unaffected, as it does not pass shelf props.

---

### Requirement 7: Long-Press Menu — Standardised Button Arc Layout by Column Position

**User Story:** As a reader, I want the long-press action buttons to appear on the side of the tile that has the most screen space, so that buttons are never clipped by the screen edge.

#### Acceptance Criteria

1. WHEN the Long_Press_Menu activates for a Stack_Book in column 0 (leftmost), THE Dashboard_Screen SHALL position all three Action_Buttons to the RIGHT side of the elevated tile, stacked vertically in an arc that curves gently to the right.
2. WHEN the Long_Press_Menu activates for a Stack_Book in column 1 (middle), THE Dashboard_Screen SHALL position all three Action_Buttons ABOVE the elevated tile in a horizontal arc (the current default behaviour).
3. WHEN the Long_Press_Menu activates for a Stack_Book in column 2 (rightmost), THE Dashboard_Screen SHALL position all three Action_Buttons to the LEFT side of the elevated tile, stacked vertically in an arc that curves gently to the left.
4. THE arc for left-column and right-column layouts SHALL use a gentle curve: each successive button SHALL be offset slightly outward (away from the tile edge) to produce a natural arc shape rather than a straight vertical line.
5. THE center of each Action_Button SHALL remain at least 8 dp from any screen edge in all three layout modes.
6. THE column position (0, 1, or 2) SHALL be determined by the book's index in the `visibleBooks` array modulo 3 (`index % 3`).
7. THE staggered entrance animation order SHALL be preserved in all three layout modes: the first button in the arc animates in first, the second 40 ms later, and the third 80 ms later.
8. THE existing Requirement 5 acceptance criteria in the `book-tile-long-press-actions` spec (edge-avoidance shift for leftmost and rightmost columns) SHALL be superseded by this requirement's column-based layout rules.

---

### Requirement 8: Long-Press Menu — Shelf Picker Reuses BookForm Shelf Row UI

**User Story:** As a reader, I want the shelf picker opened from the long-press menu to look and behave like the shelf rows I've seen elsewhere in the app, so that the UI feels consistent.

#### Acceptance Criteria

1. THE Shelf_Picker SHALL be implemented as a `@gorhom/bottom-sheet` bottom sheet, matching the visual style of `Add_Book_Sheet` (same `backgroundStyle`, `handleIndicatorStyle`, `backdropComponent`, and `enablePanDownToClose` settings).
2. THE Shelf_Picker SHALL display each shelf as a row using the same visual pattern as the `shelfRow` in `Book_Form`: a left-side accent colour bar (`shelfAccent`), shelf title and book count text (`shelfCopy`), and a right-side icon.
3. WHEN a shelf already contains the selected book, THE Shelf_Picker SHALL display a `check-circle` Feather icon (accent colour) on that shelf row.
4. WHEN a shelf does not contain the selected book, THE Shelf_Picker SHALL display a `plus-circle` Feather icon (muted colour) on that shelf row.
5. WHEN the user taps a shelf row for a shelf that does not contain the book, THE Shelf_Picker SHALL add the book to that shelf, show a brief confirmation message ("Added to [shelf name]"), and close the bottom sheet.
6. WHEN the user taps a shelf row for a shelf that already contains the book, THE Shelf_Picker SHALL remove the book from that shelf, show a brief confirmation message ("Removed from [shelf name]"), and close the bottom sheet.
7. WHEN the user's shelf list is empty, THE Shelf_Picker SHALL display an empty state with the message "No shelves yet" and a "Create shelf" button.
8. IF adding or removing a book from a shelf fails, THEN THE Shelf_Picker SHALL display an inline error message and keep the bottom sheet open.
9. THE Shelf_Picker SHALL include a "New shelf" row at the bottom of the list that, when tapped, opens an inline text input for the user to name and create a new shelf before adding the book.
10. THE existing Requirement 10 acceptance criteria in the `book-tile-long-press-actions` spec SHALL be updated to reflect this UI pattern (accent bar, title, book count, check/plus icon) as the canonical shelf row design.

---

### Requirement 9: Tab Bar — Remove the Capture Tab

**User Story:** As a user, I want a simpler tab bar with only the core navigation tabs, so that the bottom navigation is less cluttered and the capture feature is accessible via the add-book flow instead.

#### Acceptance Criteria

1. THE Tab_Bar SHALL remove the Capture_Tab entry from `app/(tabs)/_layout.tsx` so that the tab bar displays exactly three tabs: home, shelf, and profile.
2. THE `app/(tabs)/capture.tsx` route file SHALL remain on disk and SHALL remain navigable via direct `router.push` calls (e.g. from `Add_Book_Sheet`'s "Scan a line / quote" option), but SHALL NOT appear as a visible tab in the Tab_Bar.
3. THE Tab_Bar SHALL hide the `capture` screen from the tab bar by using Expo Router's `href: null` option on the `Tabs.Screen` for `capture`, or by removing the `Tabs.Screen` entry entirely while keeping the file.
4. THE remaining three tabs (home, shelf, profile) SHALL retain their existing icons, labels, and navigation behaviour unchanged.
5. THE tab bar height, padding, and style SHALL remain unchanged after the capture tab is removed.

---

### Requirement 10: Pulse Card — Simplified Three-State Legend and Heatmap Cells

**User Story:** As a reader, I want the pulse card legend to clearly show the three reading activity levels (none, low, high), so that I can interpret the heatmap at a glance.

#### Acceptance Criteria

1. THE Pulse_Card legend row SHALL display exactly three Legend_Cell items, in this order: a plain bordered cell (level 0), the `pulse_min.png` image (levels 1–2), and the `pulse_max.png` image (levels 3–4).
2. THE level-0 Legend_Cell SHALL be rendered as a plain `View` with `borderColor: tokens.color.white` and `borderWidth: 1` and no background image, representing "no reading".
3. THE level-1–2 Legend_Cell SHALL be rendered as an `Image` with `source={pulseMinImg}` and `resizeMode="cover"`, representing low activity.
4. THE level-3–4 Legend_Cell SHALL be rendered as an `Image` with `source={pulseMaxImg}` and `resizeMode="cover"`, representing high activity.
5. THE "less" and "more" text labels SHALL remain in the legend row, flanking the three Legend_Cell items on the left and right respectively.
6. THE `heatLevels` array used to render the legend SHALL be replaced with a three-item array representing the three states: `[0, 1, 3]` (or equivalent values that map to the three distinct visual states via `cellImage`).
7. THE `cellImage` function SHALL continue to return `undefined` for level 0, `pulseMinImg` for levels 1–2, and `pulseMaxImg` for levels 3–4, so that both the legend and the heatmap grid cells use the same three-state logic.
8. THE Heat_Cell rendering logic SHALL be unchanged: level 0 renders a plain bordered `View`, levels 1–2 render `pulse_min.png`, and levels 3–4 render `pulse_max.png`.
9. THE Legend_Cell items SHALL use the same size and border-radius styling as the current `legendCell` style (16 × 16 dp, `borderRadius: 3`, `borderWidth: 1`, `borderColor: tokens.color.white`).

---

### Requirement 11: Correctness Properties

**User Story:** As a developer, I want key logic in these UI changes to be verifiable through property-based or example-based tests, so that regressions are caught automatically.

#### Acceptance Criteria

1. FOR ALL valid integer page values between 0 and `book.totalPages`, the progress percentage derived from `nextPage` SHALL equal `Math.min(100, Math.round((nextPage / book.totalPages) * 100))` (invariant: same formula as the existing `progressFromPages` helper).
2. FOR ALL `nextPage` values typed into the Log_Today_Card text input, the Progress_Slider thumb value and the text input value SHALL represent the same integer page number (bidirectional sync invariant).
3. FOR ALL books with a defined `totalPages`, setting the Progress_Slider to its maximum value SHALL result in a displayed progress of 100% (boundary invariant).
4. THE Genre_Picker SHALL contain exactly 19 genre options in the specified order; applying the picker selection for any genre in the list and reading back the `genre` field value SHALL return the same string (round-trip property).
5. FOR ALL `heatLevel` values in `{0, 1, 2, 3, 4}`, the `cellImage` function SHALL return `undefined` for 0, `pulseMinImg` for 1 and 2, and `pulseMaxImg` for 3 and 4 (exhaustive example test).
6. FOR ALL `visibleBooks` arrays of length 1–6, the column index computed as `index % 3` SHALL correctly assign column 0 to indices 0 and 3, column 1 to indices 1 and 4, and column 2 to indices 2 and 5 (invariant used by the arc layout logic).
7. THE Combined_Bookmark_Step SHALL render both the page number input and the line picker in a single step; navigating forward from it SHALL advance to WhyThisLine_Step (step index 4 in the new 9-step sequence) — verifiable as an example-based integration test.
