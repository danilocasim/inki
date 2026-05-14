# Requirements Document

## Introduction

Three targeted UI fixes for the Inki app:

1. **Share card — editable quote on the last step.** The final card in every share-card flow (`passport`, `shelf-wall`, `wrapped`) already renders a `card.detail` text line. This line should become an inline-editable `TextInput` so users can personalise the text before sharing. The `EditorialStoryTemplate` already has the `editingQuote` / `onChangeQuote` wiring; the fix connects it through `WrappedScreen`.

2. **Pulse card — centred PNG images in heat cells.** `HeatCell` and the legend cells in `PulseCard` render `pulse_min.png` / `pulse_max.png` with `resizeMode="cover"` and no centering styles, so images anchor to the top-left corner. The fix adds `alignItems: "center"` / `justifyContent: "center"` to the cell containers and switches `resizeMode` to `"contain"`.

3. **Long-press menu — lock scroll while overlay is active.** When `LongPressMenu` is open the underlying `ScrollView` (inside `Screen`) remains scrollable, causing the elevated tile to visually detach from its `measureInWindow` coordinates. The fix passes `scrollEnabled={false}` to `Screen` (and its inner `ScrollView`) whenever `activeLongPress` is non-null, scoped only to `DashboardScreen`.

## Glossary

- **WrappedScreen**: The share-card flow screen at `src/features/share-cards/screens/WrappedScreen.tsx`. Renders a sequence of `WrappedCardModel` items the user can step through before sharing.
- **WrappedCardModel**: Internal data model for a single share card, containing `kind`, `title`, `detail`, `kicker`, `value`, and `background`.
- **HeroCard**: Sub-component inside `WrappedScreen` that renders a non-genres card, currently displaying `card.detail` as a static `Text`.
- **GenresCard**: Sub-component inside `WrappedScreen` that renders the genres summary card (kind: `"genres"`).
- **EditorialStoryTemplate**: Reusable template at `src/features/share-cards/templates/EditorialStoryTemplate.tsx`. Accepts `editingQuote`, `onChangeQuote`, and `onFocusQuote` props to toggle between display and edit mode for the quote text.
- **captureRef**: The `React.RefObject<View>` passed to `onShareCard` in `WrappedScreen`; the view it points to is captured as an image for sharing.
- **DashboardScreen**: The home screen at `src/features/dashboard/DashboardScreen.tsx`. Contains `PulseCard`, the book stack grid, and the `LongPressMenu`.
- **PulseCard**: Sub-component inside `DashboardScreen` that renders the reading-consistency heatmap.
- **HeatCell**: Sub-component inside `PulseCard` that renders a single heatmap cell — either a plain bordered `View` (level 0) or an `Image` (levels 1–4).
- **LongPressMenu**: Modal overlay at `src/features/dashboard/components/LongPressMenu.tsx`. Rendered as a React Native `Modal` with `transparent={true}` when `activeLongPress` is non-null.
- **Screen**: Shared UI component at `src/ui/Screen.tsx`. Wraps content in a `SafeAreaView` → `KeyboardAvoidingView` → `ScrollView` stack.
- **activeLongPress**: State variable in `DashboardScreen` (`ActiveLongPress | null`) that tracks whether the long-press overlay is open.

---

## Requirements

### Requirement 1: Editable quote text on the last share card

**User Story:** As a user sharing a card, I want to tap the detail/quote line on the final card and edit it inline, so that I can personalise the text before the image is captured and shared.

#### Acceptance Criteria

1. WHEN the user navigates to the last card in the share-card sequence, THE `WrappedScreen` SHALL display the `card.detail` text with a visual affordance (dashed underline or faint edit icon) indicating it is editable.

2. WHEN the user taps the `card.detail` text on the last card, THE `WrappedScreen` SHALL switch that text into an inline `TextInput` styled with the same font family, font size, and colour as the surrounding card typography.

3. WHILE the `TextInput` is focused, THE `WrappedScreen` SHALL display the current edited value as the `TextInput` content.

4. WHEN the user taps outside the `TextInput` (anywhere on the card body that is not the input), THE `WrappedScreen` SHALL dismiss the keyboard and return the detail line to display mode showing the updated text.

5. WHEN the user submits the `TextInput` (e.g. via the keyboard return key), THE `WrappedScreen` SHALL dismiss the keyboard and return the detail line to display mode showing the updated text.

6. WHEN the share action is triggered via `captureRef`, THE `WrappedScreen` SHALL capture the card view containing the edited `card.detail` text so the shared image reflects the user's customisation.

7. WHEN the user navigates away from the last card to a different card and then returns to the last card, THE `WrappedScreen` SHALL reset the editable text to the original `card.detail` value and return to display mode.

8. THE `WrappedScreen` SHALL restrict the editable-detail behaviour to the last card in the sequence only; all other cards SHALL display `card.detail` as a non-interactive `Text` element.

9. IF the `card.detail` text is empty, THEN THE `WrappedScreen` SHALL display a placeholder string (e.g. "Add a note…") in the `TextInput` when in edit mode.

---

### Requirement 2: Centred PNG images in Pulse heat cells

**User Story:** As a user viewing the Pulse card, I want the reading-intensity icons to be visually centred within their cells, so that the heatmap looks polished and intentional rather than misaligned.

#### Acceptance Criteria

1. THE `HeatCell` component SHALL apply `alignItems: "center"` and `justifyContent: "center"` to its container style so that child `Image` elements are centred within the cell bounds.

2. WHEN a `HeatCell` renders a `pulse_min.png` or `pulse_max.png` image, THE `HeatCell` SHALL use `resizeMode="contain"` so the PNG renders at its natural proportions without cropping.

3. THE legend cells in the `pulseLegend` row of `PulseCard` SHALL apply `alignItems: "center"` and `justifyContent: "center"` to their container style.

4. WHEN a legend cell renders a `pulse_min.png` or `pulse_max.png` image, THE legend cell SHALL use `resizeMode="contain"` so the PNG renders at its natural proportions without cropping.

5. THE `HeatCell` component SHALL preserve its existing `flex: 1` and `aspectRatio: 1` layout behaviour after the centering fix is applied.

6. THE legend cells SHALL preserve their existing `height: 16` and `width: 16` fixed dimensions after the centering fix is applied.

---

### Requirement 3: Lock scroll while long-press menu is active

**User Story:** As a user who has long-pressed a book tile, I want the page to stay still while the overlay is open, so that the elevated tile does not visually detach from its original position when I accidentally scroll.

#### Acceptance Criteria

1. THE `Screen` component SHALL accept an optional `scrollEnabled` prop of type `boolean` and pass it to its inner `ScrollView`.

2. WHEN `activeLongPress` is non-null in `DashboardScreen`, THE `DashboardScreen` SHALL pass `scrollEnabled={false}` to the `Screen` component, preventing the underlying `ScrollView` from scrolling.

3. WHEN `activeLongPress` is set back to `null` (the long-press menu is dismissed), THE `DashboardScreen` SHALL pass `scrollEnabled={true}` (or omit the prop) to the `Screen` component, re-enabling scrolling immediately.

4. THE `scrollEnabled` prop on `Screen` SHALL default to `true` so that all other screens that use `Screen` are unaffected by this change.

5. WHILE the `LongPressMenu` modal is visible, THE `DashboardScreen` SHALL keep the `ScrollView` locked regardless of how the modal was opened (long-press gesture or accessibility action).

6. IF the `scrollEnabled` prop is not provided to `Screen`, THEN THE `Screen` component SHALL behave identically to its current behaviour (scrolling enabled).

---

## Correctness Properties

### Property 1 — Edit state resets on card navigation (Requirement 1, criterion 7)

For any sequence of cards of length N ≥ 2, navigating from the last card (index N−1) to any other card and back SHALL result in the editable text equalling the original `card.detail` value and the edit mode being inactive. Formally:

```
navigate_to(N-1) → edit_text(x) → navigate_to(k) → navigate_to(N-1)
  ⟹ displayedText == originalDetail  AND  editMode == false
```

This is an **invariant**: the edit state is local to a single visit of the last card and does not persist across navigation.

### Property 2 — Captured image reflects edited text (Requirement 1, criterion 6)

For any edited detail string `s`, the view captured via `captureRef` at share time SHALL contain `s` as rendered text. This is a **round-trip** property: edit → capture → share produces an image whose text content matches the edit.

### Property 3 — Only the last card is editable (Requirement 1, criterion 8)

For all card indices `i` where `0 ≤ i < cards.length − 1`, the `card.detail` element SHALL be a non-interactive `Text` node (not a `TextInput` or `Pressable` that triggers edit mode). This is a **metamorphic** property: the editability predicate is false for all cards except the last.

### Property 4 — Heat cell centering is idempotent (Requirement 2)

Applying the centering styles (`alignItems: "center"`, `justifyContent: "center"`, `resizeMode="contain"`) to a `HeatCell` or legend cell that already has those styles SHALL produce the same visual output. The layout is **idempotent**: re-applying the fix does not change the result.

### Property 5 — Scroll lock mirrors menu visibility (Requirement 3, criteria 2–3)

At all times, the following invariant SHALL hold in `DashboardScreen`:

```
scrollEnabled == (activeLongPress === null)
```

This is a **state invariant**: the scroll-enabled state is always the logical complement of the long-press-active state. There is no intermediate state where both are true or both are false simultaneously.

### Property 6 — Screen default behaviour is unchanged (Requirement 3, criterion 4 & 6)

For any `Screen` usage that does not pass `scrollEnabled`, the rendered `ScrollView` SHALL have `scrollEnabled={true}`. This is a **round-trip / backward-compatibility** property: adding an optional prop with a default value does not alter existing call sites.
