# Requirements Document

## Introduction

This feature adds a Pinterest-style long-press contextual action menu to book tiles in "The Stack" grid on the `DashboardScreen`. When a user holds a book tile for approximately 400 ms, the tile lifts with a subtle scale and shadow effect, the rest of the screen dims behind a semi-transparent overlay, and three circular action buttons animate in around the tile. The three actions are: **Share** (navigate to the share card flow), **Pin/Unpin** (toggle the book to the top of the stack), and **Add to Shelf** (open a shelf picker bottom sheet). Tapping any action button executes the action and dismisses the overlay; tapping the dimmed background dismisses without action. The interaction must feel springy and native, and must be fully accessible via an alternative long-press menu for assistive technology users.

---

## Glossary

- **Book_Tile**: The `Pressable` component inside `StackBook` that renders a book cover, progress track, and page row in the three-column grid on `DashboardScreen`.
- **Long_Press_Menu**: The full overlay UI that appears after a successful long-press gesture, consisting of the Dim_Overlay, the elevated Book_Tile, and the three Action_Buttons.
- **Dim_Overlay**: The semi-transparent dark layer that covers the entire screen except the pressed Book_Tile when the Long_Press_Menu is active.
- **Action_Button**: One of the three circular floating buttons (Share, Pin, Shelf) that appear around the elevated Book_Tile.
- **Share_Action**: The action that navigates to `/share/[cardType]` with `cardType=passport` and the book's `id` as `sourceId`.
- **Pin_Action**: The action that toggles the `isPinned` boolean field on a `Book` record, causing pinned books to sort to the top of The Stack grid.
- **Shelf_Action**: The action that opens the Shelf_Picker bottom sheet for the selected book.
- **Shelf_Picker**: A bottom sheet modal that lists all user-created shelves and allows the user to add the selected book to one or more shelves.
- **Stack_Order**: The sort order applied to books in The Stack grid, which must place pinned books first, then apply the existing status/progress/title ordering.
- **Spring_Animation**: A physics-based animation with configurable stiffness and damping that produces a natural overshoot-and-settle motion, implemented via `react-native-reanimated` spring worklets.
- **Dashboard_Screen**: The `DashboardScreen` component in `src/features/dashboard/DashboardScreen.tsx`.
- **Book**: The `Book` interface in `src/features/books/types.ts`.
- **BookRow**: The `BookRow` interface representing the SQLite row shape in `src/features/books/types.ts`.
- **Books_Repository**: The repository in `src/features/books/repositories/books-repository.ts`.
- **Shelves_Repository**: The repository in `src/features/shelves/repositories/shelves-repository.ts`.

---

## Requirements

### Requirement 1: Long-Press Trigger

**User Story:** As a reader, I want to long-press a book tile to reveal quick actions, so that I can act on a book without navigating away from the dashboard.

#### Acceptance Criteria

1. WHEN a user presses and holds a Book_Tile for 400 ms or longer, THE Dashboard_Screen SHALL activate the Long_Press_Menu for that book.
2. WHEN a user releases a Book_Tile before 400 ms have elapsed, THE Dashboard_Screen SHALL treat the gesture as a normal tap and navigate to the book detail screen.
3. WHEN the Long_Press_Menu is active for one book, THE Dashboard_Screen SHALL ignore long-press gestures on all other Book_Tiles until the Long_Press_Menu is dismissed.
4. WHEN a long-press gesture begins, THE Dashboard_Screen SHALL provide haptic feedback using the device's medium-impact haptic engine at the moment the Long_Press_Menu activates (at the 400 ms threshold).

---

### Requirement 2: Dim Overlay

**User Story:** As a reader, I want the background to dim when I long-press a book tile, so that the selected tile and its actions are visually prominent.

#### Acceptance Criteria

1. WHEN the Long_Press_Menu activates, THE Dim_Overlay SHALL cover the full screen with a black background at 60% opacity.
2. WHEN the Long_Press_Menu activates, THE Dim_Overlay SHALL animate from 0% to 60% opacity over 200 ms using an ease-in-out curve.
3. WHILE the Long_Press_Menu is active, THE Dim_Overlay SHALL render above all other screen content except the elevated Book_Tile and the Action_Buttons.
4. WHEN the Long_Press_Menu is dismissed, THE Dim_Overlay SHALL animate from 60% to 0% opacity over 150 ms.
5. WHEN the user taps the Dim_Overlay (outside the elevated Book_Tile and Action_Buttons), THE Dashboard_Screen SHALL dismiss the Long_Press_Menu without executing any action.

---

### Requirement 3: Book Tile Elevation Effect

**User Story:** As a reader, I want the long-pressed book tile to visually lift above the overlay, so that I can clearly see which book I am acting on.

#### Acceptance Criteria

1. WHEN the Long_Press_Menu activates, THE Book_Tile SHALL animate to a scale of 1.05 using a Spring_Animation with stiffness 300 and damping 20.
2. WHEN the Long_Press_Menu activates, THE Book_Tile SHALL render above the Dim_Overlay using an elevated z-index or absolute positioning so it is not dimmed.
3. WHEN the Long_Press_Menu activates, THE Book_Tile SHALL display a drop shadow with a blur radius of 16 dp, a vertical offset of 8 dp, and 40% black opacity to convey elevation.
4. WHEN the Long_Press_Menu is dismissed, THE Book_Tile SHALL animate back to scale 1.0 and remove the drop shadow using a Spring_Animation with stiffness 300 and damping 20.
5. WHILE the Long_Press_Menu is active, THE Book_Tile SHALL remain fully interactive so that tapping it dismisses the Long_Press_Menu and navigates to the book detail screen.

---

### Requirement 4: Action Buttons — Appearance

**User Story:** As a reader, I want to see clearly labelled circular action buttons around the lifted book tile, so that I can identify and tap the action I want.

#### Acceptance Criteria

1. THE Long_Press_Menu SHALL display exactly three Action_Buttons: Share, Pin, and Shelf.
2. THE Share Action_Button SHALL display the Feather icon `share-2` and the label "Share".
3. THE Pin Action_Button SHALL display the Feather icon `map-pin` when the book is not pinned, and the Feather icon `map-pin` filled (or a visually distinct active state) when the book is pinned, with the label "Pin" or "Unpin" respectively.
4. THE Shelf Action_Button SHALL display the Feather icon `layers` and the label "Shelf".
5. EACH Action_Button SHALL be a circular surface with a diameter of 56 dp, a white or `tokens.color.surface` background, and a subtle 1 dp border using `tokens.color.border`.
6. EACH Action_Button SHALL display its label as a caption-sized text below the icon, using `tokens.color.ink` for normal state and `tokens.color.accent` for the active/pinned state of the Pin button.
7. EACH Action_Button SHALL have a minimum touch target of 44 × 44 dp as required by accessibility guidelines.

---

### Requirement 5: Action Buttons — Positioning

**User Story:** As a reader, I want the action buttons to appear in a predictable arc around the book tile, so that I can reach them without obscuring the tile.

#### Acceptance Criteria

1. WHEN the Long_Press_Menu activates, THE Action_Buttons SHALL be positioned in an arc above and to the sides of the elevated Book_Tile: Share centered above the tile, Pin to the upper-left, and Shelf to the upper-right.
2. WHEN a Book_Tile is in the leftmost column of the grid, THE Dashboard_Screen SHALL shift the Action_Button arc rightward so that no Action_Button is clipped by the screen edge.
3. WHEN a Book_Tile is in the rightmost column of the grid, THE Dashboard_Screen SHALL shift the Action_Button arc leftward so that no Action_Button is clipped by the screen edge.
4. THE center of each Action_Button SHALL be at least 8 dp from any screen edge.

---

### Requirement 6: Action Buttons — Animation

**User Story:** As a reader, I want the action buttons to animate in with a springy feel, so that the interaction feels alive and native.

#### Acceptance Criteria

1. WHEN the Long_Press_Menu activates, EACH Action_Button SHALL animate from scale 0 and opacity 0 to scale 1 and opacity 1 using a Spring_Animation with stiffness 400 and damping 22.
2. WHEN the Long_Press_Menu activates, THE Share Action_Button SHALL begin its entrance animation 0 ms after activation, THE Pin Action_Button SHALL begin 40 ms after activation, and THE Shelf Action_Button SHALL begin 80 ms after activation, producing a staggered cascade effect.
3. WHEN the Long_Press_Menu is dismissed, EACH Action_Button SHALL animate from scale 1 and opacity 1 to scale 0 and opacity 0 using a Spring_Animation with stiffness 400 and damping 22 over 120 ms.
4. WHEN a user taps an Action_Button, THE tapped Action_Button SHALL animate to scale 0.9 and back to scale 1.0 (a brief press feedback) before the Long_Press_Menu dismisses.

---

### Requirement 7: Share Action

**User Story:** As a reader, I want to share a book card directly from the stack, so that I can quickly post about a book I am reading.

#### Acceptance Criteria

1. WHEN the user taps the Share Action_Button, THE Dashboard_Screen SHALL dismiss the Long_Press_Menu and navigate to `/share/[cardType]` with `cardType` set to `"passport"` and `sourceId` set to the selected book's `id`.
2. WHEN the user taps the Share Action_Button, THE Dashboard_Screen SHALL pass the book `id` as the `sourceId` query parameter so the share screen can load the correct book data.
3. IF the share navigation fails due to a routing error, THEN THE Dashboard_Screen SHALL dismiss the Long_Press_Menu and display a brief error toast with the message "Unable to open share screen."

---

### Requirement 8: Pin Action — Data Model

**User Story:** As a reader, I want to pin a book to the top of my stack, so that my most important book is always the first one I see.

#### Acceptance Criteria

1. THE Book interface SHALL include an `isPinned` boolean field, defaulting to `false`.
2. THE BookRow interface SHALL include an `is_pinned` integer column (0 or 1) to persist the pinned state in SQLite.
3. THE Books_Repository SHALL expose a `togglePin(bookId: string): Promise<Book>` method that flips the `is_pinned` value for the given book and returns the updated `Book`.
4. WHEN `togglePin` is called with a `bookId` that does not exist in the database, THEN THE Books_Repository SHALL throw an error with the message "Book not found."
5. THE SQLite `books` table SHALL include an `is_pinned INTEGER NOT NULL DEFAULT 0` column, added via a migration.
6. THE `mapBookRow` function SHALL map the `is_pinned` column to the `isPinned` boolean field on `Book`.

---

### Requirement 9: Pin Action — Behavior

**User Story:** As a reader, I want the pin toggle to immediately update the stack order, so that I can see the effect of pinning without refreshing.

#### Acceptance Criteria

1. WHEN the user taps the Pin Action_Button for an unpinned book, THE Dashboard_Screen SHALL call `onPinBook` with the book's `id`, dismiss the Long_Press_Menu, and optimistically update the book tile to show the pinned state.
2. WHEN the user taps the Pin Action_Button for a pinned book, THE Dashboard_Screen SHALL call `onPinBook` with the book's `id`, dismiss the Long_Press_Menu, and optimistically update the book tile to show the unpinned state.
3. WHEN `isPinned` is `true` for a book, THE Stack_Order function SHALL sort that book before all unpinned books within the same status group.
4. WHEN multiple books are pinned, THE Stack_Order function SHALL sort pinned books among themselves by the existing progress/title ordering.
5. IF the `togglePin` database call fails, THEN THE Dashboard_Screen SHALL revert the optimistic update and display a brief error toast with the message "Unable to update pin."
6. WHEN the Long_Press_Menu is active for a pinned book, THE Pin Action_Button SHALL display the label "Unpin" and use the active visual state to indicate the current pinned status.

---

### Requirement 10: Shelf Action — Shelf Picker UI

**User Story:** As a reader, I want to add a book to a shelf directly from the stack, so that I can organise my library without navigating to the shelves screen.

#### Acceptance Criteria

1. WHEN the user taps the Shelf Action_Button, THE Dashboard_Screen SHALL dismiss the Long_Press_Menu and open the Shelf_Picker as a bottom sheet modal.
2. THE Shelf_Picker SHALL display a list of all user-created shelves, showing each shelf's title, accent color bar, and current book count.
3. WHEN the user's shelf list is empty, THE Shelf_Picker SHALL display an empty state with the message "No shelves yet" and a "Create shelf" button.
4. WHEN the user taps a shelf row in the Shelf_Picker, THE Shelf_Picker SHALL add the selected book to that shelf, show a brief confirmation ("Added to [shelf name]"), and close the bottom sheet.
5. WHEN the book is already a member of a shelf, THE Shelf_Picker SHALL display a checkmark or distinct visual indicator on that shelf row.
6. WHEN the user taps a shelf row for a shelf that already contains the book, THE Shelf_Picker SHALL remove the book from that shelf, show a brief confirmation ("Removed from [shelf name]"), and close the bottom sheet.
7. IF adding or removing a book from a shelf fails, THEN THE Shelf_Picker SHALL display an inline error message and keep the bottom sheet open.
8. THE Shelf_Picker SHALL include a "New shelf" row at the bottom of the list that, when tapped, opens an inline text input for the user to name and create a new shelf before adding the book.

---

### Requirement 11: Shelf Action — Data Layer

**User Story:** As a developer, I want a repository method to add and remove books from shelves, so that the Shelf_Picker can persist membership changes.

#### Acceptance Criteria

1. THE Shelves_Repository SHALL expose an `addBook(shelfId: string, bookId: string): Promise<void>` method that inserts a row into the `shelf_books` join table.
2. THE Shelves_Repository SHALL expose a `removeBook(shelfId: string, bookId: string): Promise<void>` method that deletes the matching row from the `shelf_books` join table.
3. THE Shelves_Repository SHALL expose a `listShelvesForBook(bookId: string): Promise<Shelf[]>` method that returns all shelves containing the given book.
4. WHEN `addBook` is called with a `shelfId` and `bookId` combination that already exists in `shelf_books`, THE Shelves_Repository SHALL treat the call as a no-op and not throw an error.
5. WHEN `removeBook` is called with a `shelfId` and `bookId` combination that does not exist in `shelf_books`, THE Shelves_Repository SHALL treat the call as a no-op and not throw an error.

---

### Requirement 12: Dismissal Behavior

**User Story:** As a reader, I want the action overlay to dismiss predictably, so that I can cancel the menu without accidentally triggering an action.

#### Acceptance Criteria

1. WHEN the user taps the Dim_Overlay outside the elevated Book_Tile and Action_Buttons, THE Dashboard_Screen SHALL dismiss the Long_Press_Menu without executing any action.
2. WHEN the user taps any Action_Button, THE Dashboard_Screen SHALL execute the corresponding action and then dismiss the Long_Press_Menu.
3. WHEN the user presses the hardware back button (Android) while the Long_Press_Menu is active, THE Dashboard_Screen SHALL dismiss the Long_Press_Menu without executing any action and SHALL NOT navigate back.
4. WHEN the user swipes down on the Dim_Overlay (iOS swipe-to-dismiss gesture), THE Dashboard_Screen SHALL dismiss the Long_Press_Menu without executing any action.
5. WHEN the Long_Press_Menu is dismissed for any reason, THE Dashboard_Screen SHALL restore the Book_Tile to its normal scale and remove the Dim_Overlay.

---

### Requirement 13: Accessibility

**User Story:** As a reader who uses assistive technology, I want to access book tile actions without relying on a long-press gesture, so that I can use the feature regardless of my motor ability.

#### Acceptance Criteria

1. EACH Book_Tile SHALL expose an accessibility action named `"Book options"` via the `accessibilityActions` prop so that screen reader users can activate the Long_Press_Menu without performing a long-press gesture.
2. WHEN a screen reader user activates the `"Book options"` accessibility action on a Book_Tile, THE Dashboard_Screen SHALL open the Long_Press_Menu for that book.
3. WHILE the Long_Press_Menu is active, THE Dim_Overlay SHALL have `accessibilityLabel` set to `"Close menu"` and `accessibilityRole` set to `"button"` so screen reader users can dismiss it.
4. EACH Action_Button SHALL have an `accessibilityLabel` that describes its action and current state (e.g., `"Share book"`, `"Pin book"`, `"Unpin book"`, `"Add to shelf"`).
5. WHEN the Long_Press_Menu opens, THE Dashboard_Screen SHALL move accessibility focus to the first Action_Button (Share) so screen reader users can navigate the menu immediately.
6. WHERE the device has `reduceMotion` enabled, THE Dashboard_Screen SHALL replace all Spring_Animations with instant opacity transitions (no scale animation) to respect the user's motion preference.

---

### Requirement 14: Animation and Motion Quality

**User Story:** As a reader, I want the long-press interaction to feel polished and native, so that the app feels high-quality.

#### Acceptance Criteria

1. THE Long_Press_Menu SHALL implement all animations using `react-native-reanimated` shared values and worklets so that animations run on the UI thread and do not block the JS thread.
2. THE Book_Tile scale animation and the Dim_Overlay opacity animation SHALL run concurrently and complete within 300 ms of the long-press threshold being reached.
3. THE staggered Action_Button entrance animations SHALL all complete within 400 ms of the long-press threshold being reached.
4. THE dismissal animation (overlay fade-out, tile scale-down, button scale-out) SHALL complete within 200 ms of the dismiss trigger.
5. WHILE any Long_Press_Menu animation is in progress, THE Dashboard_Screen SHALL not process new long-press gestures.

---

### Requirement 15: Correctness Properties

**User Story:** As a developer, I want property-based tests for the pin ordering and shelf membership logic, so that edge cases are caught automatically.

#### Acceptance Criteria

1. FOR ALL lists of `Book` objects with arbitrary `isPinned` and `status` values, THE Stack_Order function SHALL place every pinned book before every unpinned book within the same `status` group.
2. FOR ALL lists of `Book` objects, THE Stack_Order function SHALL be stable with respect to title: two books with the same `isPinned`, `status`, and `progress` values SHALL always appear in ascending alphabetical order by title.
3. FOR ALL lists of `Book` objects, THE Stack_Order function SHALL be idempotent: applying Stack_Order twice SHALL produce the same result as applying it once.
4. FOR ALL valid `bookId` and `shelfId` pairs, calling `addBook` followed by `listShelvesForBook` SHALL return a list that includes the shelf with the given `shelfId` (round-trip property).
5. FOR ALL valid `bookId` and `shelfId` pairs where the book is a member of the shelf, calling `removeBook` followed by `listShelvesForBook` SHALL return a list that does NOT include the shelf with the given `shelfId` (round-trip property).
6. FOR ALL valid `bookId` values, calling `togglePin` twice in succession SHALL return the book to its original `isPinned` state (idempotence of double-toggle).
7. FOR ALL lists of `Book` objects, THE Stack_Order function SHALL preserve the total count of books: the output list SHALL have the same length as the input list (invariant).
