# Inki Offline-First Full Feature Execution Plan

Version: 1.0
Date: 2026-05-14
Status: Recommended senior engineering execution plan
Source plan: `docs/design/expo-mobile-offline-first-plan.md`
Source screenshots: `/Users/danilo/inki-assets/ss-screen/Screenshot 2026-05-14 at 00.35.51.png` through `00.37.59.png`

## 1. Goal

Build the full Inki mobile app as a local-only, offline-first Expo React Native application that implements every screenshot-proven screen and the feature set in `expo-mobile-offline-first-plan.md`.

Core product goal:

- A user can manage a private reading life entirely on device: add books, scan ISBNs, log reading sessions, save quotes, create shelves, view reading stats, generate share/wrapped cards, schedule local reminders, and export/import their library.
- There is no backend, no user account, no hosted API owned by Inki, no remote auth, no remote analytics, no push-token server, and no AI/LLM server.
- Optional external lookup is limited to Open Library metadata fetches, initiated from book search/ISBN flows, and must never block manual local entry.

This plan supersedes the old “empty repo” assumption in the source plan. The current repo already has a committed SDK 54 Expo Router static shell. The next work is to turn that shell into a fully functional local app while preserving the screenshot visual language.

Out of scope for this implementation plan:

- Backend accounts, collaborative shelves, social feeds, cloud-hosted APIs, remote push, server OCR, server share-card rendering, AI recommendations, analytics/tracking SDKs.
- Automatic multi-device sync in v1 unless explicitly approved after an iCloud/Drive feasibility spike. v1 backup should be manual export/import.

## 2. Success criteria

Functional success:

- Fresh install opens directly to local library UI, with no login/account wall.
- All 19 provided screenshot states are represented as implemented routes, modals, or share-card states.
- User can add/edit/delete a book offline, including title, author, status, page count, genre/source metadata, notes, and optional cover image.
- User can scan an ISBN using on-device camera and optionally populate metadata from Open Library; manual save works without network.
- User can log reading sessions, update page progress, finish a book, answer the post-read prompt, and see Home/Profile stats update.
- Home dashboard uses local SQLite data for The Stack, The Pulse, continuity, velocity, bookmarks, reading streak, yearly books, pages, ink density, and post-read prompt surfaces.
- User can open book detail, create bookmarks/quotes, view notes, and see progress from SQLite.
- User can create/edit/delete shelves; add/remove/pin books; switch shelf detail `grid`, `list`, and `spine` views; view archive wall.
- User can capture a quote by page image with manual fallback; OCR must fail gracefully without losing typed text.
- User can view notifications inbox/history and configure local share/read reminders. Implementation must not request or store push tokens.
- User can generate wrapped/share-card screens matching screenshots 15-19 and export/share them as local PNGs.
- User can export/import local data as a versioned JSON package with relative local file references.
- User can generate annual book passport as a local PDF.

Non-functional success:

- Core app is usable offline after install.
- Dashboard reads complete under 100 ms for normal libraries and under 500 ms for 5,000 books / 50,000 sessions on mid-tier devices.
- Large book/shelf lists use `FlatList`/virtualized rendering, not unbounded `ScrollView` children.
- Share-card PNG export completes under 3 seconds for simple cards and under 8 seconds for wrapped/archive cards on recent devices.
- DB migrations are additive and never wipe user data as recovery.
- Permission prompts are just-in-time and include denied/blocked UX.
- Every public route validates route/search params at the boundary.
- `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, and `npx expo install --check` pass at each PR boundary.

## 3. Assumptions

- Current app target is Expo SDK 54 because the user’s available Expo Go supports SDK 54. Native-feature work may later require a development build/custom dev client.
- Current baseline commit includes static routes and fixture screens under `app/` and `src/features/*`.
- SQLite implementation should use raw `expo-sqlite` repositories, not an ORM, unless raw SQL becomes a proven maintainability problem.
- Core local persistence uses SQLite; binary assets such as cover images, quote images, exported PNGs, and PDFs use local file storage with app-relative paths.
- Open Library is optional and best-effort. It is not an Inki backend.
- OCR remains a risk area. The default plan is to ship manual quote capture first, then enable OCR only after real-device proof.
- Manual export/import is v1 backup. Automatic iCloud sync remains an open question and should not block the local app.
- Figma remains primary visual source when available; the 19 screenshots are the current executable visual coverage list.

## 4. Current state (files/flows)

Current committed baseline:

- Expo SDK 54 project scaffold.
- Expo Router routes:
  - `app/_layout.tsx`
  - `app/(tabs)/_layout.tsx`
  - `app/(tabs)/index.tsx`
  - `app/(tabs)/shelves.tsx`
  - `app/(tabs)/profile.tsx`
  - `app/shelves/[id].tsx`
  - `app/settings.tsx`
- Static feature screens:
  - `src/features/dashboard/DashboardScreen.tsx`
  - `src/features/shelves/ShelfOverviewScreen.tsx`
  - `src/features/shelves/ShelfDetailScreen.tsx`
  - `src/features/profile/PrivateProfileScreen.tsx`
  - `src/features/settings/SettingsScreen.tsx`
- Shared UI primitives:
  - `src/ui/tokens.ts`
  - `src/ui/Text.tsx`
  - `src/ui/Button.tsx`
  - `src/ui/Screen.tsx`
  - `src/ui/Card.tsx`
  - `src/ui/SegmentedControl.tsx`
  - `src/ui/StatTile.tsx`
  - `src/ui/EmptyState.tsx`
  - `src/ui/ErrorState.tsx`
- Fixture data:
  - `src/features/dashboard/fixtures.ts`
  - `src/test/fixtures/*`
- Test baseline:
  - `src/ui/__tests__/primitives.test.tsx`
  - `src/features/__tests__/figma-screens.test.tsx`

Missing today:

- SQLite provider, schema, migrations, repositories, seed data.
- Real local state hooks/use cases.
- Add Book modal and edit flows.
- Book detail route and reading session flows.
- Camera/capture routes.
- Notifications inbox/settings implementation.
- Share/wrapped routes and export services.
- Import/export, file adapters, PDF generation.
- Real design parity for all 19 screenshot states.

Screenshot inventory to implement:

| #   | Screenshot time | Target route/component      | Main UI/function                                                      |
| --- | --------------- | --------------------------- | --------------------------------------------------------------------- |
| 1   | 00.35.51        | Home dashboard              | `inki`, tabs, The Stack, books/progress, The Pulse, bottom nav        |
| 2   | 00.36.01        | Home stats expanded         | Pulse, bookmarks, continuity, velocity, 90-day stats                  |
| 3   | 00.36.10        | Home stats variant          | Same as #2; regression reference                                      |
| 4   | 00.36.16        | Home post-read/share prompt | Post-read prompt quote card and privacy copy                          |
| 5   | 00.36.55        | Add Book modal              | title/author/page count form, scan barcode CTA, Open Library autofill |
| 6   | 00.36.59        | Notifications inbox         | local reminders/share streak/history, no push servers                 |
| 7   | 00.37.03        | Capture hub                 | scan ISBN and capture quote entry points                              |
| 8   | 00.37.06        | Barcode scanner             | camera frame for ISBN scanning                                        |
| 9   | 00.37.12        | Page scanner                | camera frame for OCR quote capture                                    |
| 10  | 00.37.20        | Book detail                 | progress, metadata chips, view notes, create bookmark                 |
| 11  | 00.37.30        | Shelf overview              | search/add, filters, system/custom shelves, archive wall              |
| 12  | 00.37.35        | Shelf overview variant      | same route; share wall/archive emphasis                               |
| 13  | 00.37.39        | Profile                     | local-only badge, stats, wrapped/passport/export/sync, genres         |
| 14  | 00.37.42        | Settings                    | notifications, backup, data export/import/passport, erase local data  |
| 15  | 00.37.51        | Wrapped card 1              | 2026 totals card, share wrapped                                       |
| 16  | 00.37.54        | Wrapped card 2              | time-of-day/month reading card                                        |
| 17  | 00.37.55        | Wrapped card 3              | fastest read card                                                     |
| 18  | 00.37.57        | Wrapped card 4              | changed-you card                                                      |
| 19  | 00.37.59        | Wrapped card 5              | top genres/year conclusion card                                       |

Current architectural gap:

- Screens are fixture-driven. The next PR must introduce local SQLite state before adding more UI complexity, otherwise behavior will fragment across mock state.

## 5. Proposed approach (recommended)

Use a local-only layered architecture:

```text
app/ route boundary
  -> feature screen
    -> feature hook/use case
      -> repository/service interface
        -> SQLite + local files + Expo device adapters
```

Key boundaries:

- `app/`: route params, modal/stack/tabs, provider wiring, error boundaries only.
- `src/features/*/screens`: screen composition and UI state.
- `src/features/*/components`: feature UI, reusable inside one feature.
- `src/features/*/hooks`: query/mutation orchestration and loading/error state.
- `src/features/*/repositories`: SQL read/write operations.
- `src/features/*/services`: pure calculations and feature orchestration.
- `src/lib/db`: SQLite provider, migration runner, query helpers, transaction wrapper.
- `src/lib/files`: local file copy/delete/export directories and app-relative paths.
- `src/lib/permissions`: camera/photos/notifications permission adapters.
- `src/ui`: primitive design system only.

Recommended local data model v1:

- `books`
  - id, title, author, status, totalPages, currentPage, coverPath, isbn, genre, source, moodTag, isChangedYou, startedAt, finishedAt, createdAt, updatedAt.
- `reading_sessions`
  - id, bookId, pagesRead, startedPage, endedPage, durationMinutes, note, readAt, createdAt.
- `quotes`
  - id, bookId, text, page, sourceImagePath, captureMethod (`manual`/`ocr`), createdAt, updatedAt.
- `shelves`
  - id, name, description, kind (`system`/`custom`), visibility (`private`), sortOrder, createdAt, updatedAt.
- `shelf_books`
  - shelfId, bookId, sortOrder, pinnedAt, addedAt.
- `tags`, `book_tags`
  - normalized many-to-many tags.
- `app_settings`
  - key/value store for reminder times, view preferences, backup metadata, local flags.
- `notifications_log`
  - id, type, title, body, scheduledFor, sentAt, tappedAt, isRead, localNotificationId.
- `share_events`
  - id, cardType, sourceId, sharedAt, outputPath, usedForStreak.
- `open_library_cache`
  - cacheKey, responseJson, fetchedAt, expiresAt. Optional and purgeable.

Data flow examples:

- Add book manually:
  - `AddBookModal` -> validate draft -> `saveBookUseCase` -> DB transaction -> optional cover file copy -> `books` insert/update -> dashboard invalidates/refetches.
- Scan ISBN:
  - `CaptureHub` -> `BarcodeScanScreen` -> camera permission -> ISBN parse -> optional Open Library lookup with timeout -> editable `BookForm` -> local save.
- Log session:
  - `BookDetailScreen` -> session form -> transaction inserts `reading_sessions`, updates `books.currentPage/status/updatedAt`, recomputes derived stats on read.
- Finish book:
  - finish sheet -> transaction updates book, optional post-read note/quote/share prompt -> dashboard/profile stats update.
- Quote capture:
  - capture route -> image stored locally -> OCR adapter if available -> line picker/manual form -> `quotes` insert.
- Share wrapped:
  - local stats query -> wrapped view model -> fixed-size card component -> `react-native-view-shot` PNG -> share sheet/save -> `share_events` insert.
- Export:
  - read SQLite rows -> build versioned JSON manifest -> include relative file paths -> write export package -> share through OS.

Error semantics:

- Validation: inline field errors, never discard drafts.
- Permission denied: show manual fallback and Settings deep link.
- Network unavailable: “Open Library unavailable. You can still add this manually.”
- OCR unavailable: manual quote form remains first-class.
- Export/share failed: keep preview, offer retry, preserve generated temp path if available.
- Migration failed: block with recovery/export diagnostics; never reset database automatically.
- Destructive erase: settings screen must require explicit confirmation phrase and be unavailable as a casual one-tap action.

Design implementation posture:

- Treat screenshots as acceptance references. Add a screenshot fixture registry with IDs 1-19 and required labels.
- Promote repeated values to tokens before tuning screen UI.
- Split the large current screens into small feature components before wiring DB.
- Use `FlatList` for any unbounded book/shelf/quote list.
- Preserve tab labels: `home`, `shelf`, `profile`.
- Add routes for screenshot-mapped screens:
  - `app/(modals)/log-book.tsx`
  - `app/notifications.tsx`
  - `app/capture/index.tsx`
  - `app/capture/barcode.tsx`
  - `app/capture/page.tsx`
  - `app/book/[id].tsx`
  - `app/share/wrapped.tsx` or `app/share/[cardType].tsx`

## 6. Alternatives (with tradeoffs)

### Alternative A: Raw `expo-sqlite` repositories (recommended)

Pros:

- Minimal dependency surface.
- Explicit SQL/index/transaction control.
- Easy to audit for local-only behavior.
- Matches current plan and app size.

Cons:

- More manual row typing and mapping.
- Migrations/repositories require discipline.

Recommendation: use this.

### Alternative B: Drizzle ORM over SQLite

Pros:

- Better schema typing and query builder ergonomics.
- Easier compile-time table/column checks.

Cons:

- More dependency/setup complexity.
- Can obscure SQL performance and migration behavior.
- Unnecessary until schema complexity grows.

Recommendation: defer unless raw SQL becomes a concrete maintenance problem.

### Alternative C: Build all screens from fixtures first, DB later

Pros:

- Fast visual coverage of screenshots.
- Useful for design review.

Cons:

- Delays real behavior.
- Risks duplicate mock state and expensive rewrites.

Recommendation: do not continue this path. The app already has enough static shell; wire SQLite next.

### Alternative D: Custom dev client immediately

Pros:

- More realistic for camera, view-shot, files, notifications, OCR/native experiments.
- Avoids Expo Go limitations.

Cons:

- More build setup before core local data works.
- Slower iteration for early DB/form work.

Recommendation: stay Expo Go-compatible through DB/forms/basic UI; introduce dev client before camera/share/OCR real-device PRs.

### Alternative E: Platform-native OCR instead of `tesseract.js`

Pros:

- Better real-device performance and accuracy.

Cons:

- Native modules/config plugins, different iOS/Android behavior, privacy review.

Recommendation: ship manual quote capture first; spike OCR behind an adapter; choose native OCR only if `tesseract.js` is not viable.

## 7. Step plan (< 30 min each)

Suggested PR sequence from the current baseline:

1. PR 2: local SQLite foundation and seed data.
2. PR 3: books, add/edit, sessions, book detail, dashboard data.
3. PR 4: screenshot design parity pass for Home/Add Book/Book Detail.
4. PR 5: shelves, tags, archive wall.
5. PR 6: capture hub, ISBN scan, Open Library fallback, manual quote/OCR spike.
6. PR 7: notifications, settings, import/export, passport.
7. PR 8: share cards/wrapped, PNG export.
8. PR 9: backup/sync adapter, performance/accessibility/release readiness.

### PR 2: Local SQLite foundation

#### Step 1: Install local-first dependencies

Estimate: 20 minutes
Files: `package.json`, `package-lock.json`
Changes: add `expo-sqlite`, `zod`, `expo-file-system`.
Verify: `npx expo install --check`, `npm run typecheck`.

#### Step 2: Add database provider

Estimate: 25 minutes
Files: `app/_layout.tsx`, `src/lib/db/database-provider.tsx`
Changes: wrap the app in a DB provider; expose initialization loading/error state.
Verify: app starts and existing static screen tests still pass.

#### Step 3: Define schema SQL and migrations

Estimate: 30 minutes
Files: `src/lib/db/schema.sql.ts`, `src/lib/db/migrations.ts`, `src/lib/db/types.ts`
Changes: create v1 tables, constraints, indexes, `PRAGMA foreign_keys = ON`, WAL, `user_version = 1`.
Verify: migration unit test asserts all tables/indexes exist.

#### Step 4: Add DB test harness

Estimate: 25 minutes
Files: `src/test/db-test-utils.ts`, `src/lib/db/__tests__/migrations.test.ts`
Changes: create isolated in-memory/test DB helper for repository tests.
Verify: migration test runs locally without device.

#### Step 5: Add query and transaction helpers

Estimate: 25 minutes
Files: `src/lib/db/query.ts`, `src/lib/db/transaction.ts`, `src/lib/errors/db-error.ts`
Changes: typed wrappers for reads/writes and error normalization.
Verify: unit tests cover success and normalized failure.

#### Step 6: Add core repository interfaces

Estimate: 30 minutes
Files: `src/features/books/repositories/books-repository.ts`, `src/features/sessions/repositories/sessions-repository.ts`, `src/features/shelves/repositories/shelves-repository.ts`, `src/features/settings/repositories/settings-repository.ts`
Changes: minimal create/read/list APIs with SQL kept out of screens.
Verify: repository tests assert parameters and returned domain objects.

#### Step 7: Add fixture-to-SQLite dev seed

Estimate: 30 minutes
Files: `src/lib/db/dev-seed.ts`, `src/features/dashboard/fixtures.ts`, `app/settings.tsx`
Changes: seed screenshot books/shelves/sessions in dev only.
Verify: seed can run twice idempotently; no duplicate shelves/books.

### PR 3: Books, sessions, and dynamic dashboard

#### Step 8: Add book domain types and validation

Estimate: 25 minutes
Files: `src/features/books/types.ts`, `src/features/books/validation.ts`, `src/features/books/book-status.ts`
Changes: strict local domain types and zod validators.
Verify: invalid status/pages/date tests fail then pass.

#### Step 9: Split current BookCover and dashboard components

Estimate: 25 minutes
Files: `src/features/dashboard/components/*`, `src/features/books/BookCover.tsx`
Changes: extract `TheStack`, `ThePulse`, `VelocityStats`, `PostReadPrompt`.
Verify: existing screen smoke tests still find screenshot labels.

#### Step 10: Add Add Book modal route

Estimate: 25 minutes
Files: `app/(modals)/log-book.tsx`, `app/_layout.tsx`, `src/features/books/screens/AddBookScreen.tsx`
Changes: present screenshot #5 as a modal/sheet route.
Verify: Add Book CTA opens modal.

#### Step 11: Build manual BookForm

Estimate: 30 minutes
Files: `src/features/books/components/BookForm.tsx`, `src/features/books/hooks/use-save-book.ts`
Changes: title, author, total pages, status, genre/source fields; offline save.
Verify: component test submits valid form and shows required title error.

#### Step 12: Connect Add Book save to SQLite

Estimate: 30 minutes
Files: `src/features/books/hooks/use-save-book.ts`, repositories, AddBook screen
Changes: save book locally and navigate back to Home/Book Detail.
Verify: airplane mode manual add appears in The Stack.

#### Step 13: Add cover image local adapter

Estimate: 30 minutes
Files: `src/lib/files/app-files.ts`, `src/features/books/services/cover-image-service.ts`, `src/features/books/components/CoverPicker.tsx`
Changes: copy selected cover to app documents and store relative path.
Verify: restart app; cover still renders.

#### Step 14: Add Book Detail route

Estimate: 30 minutes
Files: `app/book/[id].tsx`, `src/features/books/screens/BookDetailScreen.tsx`, `src/features/books/hooks/use-book-detail.ts`
Changes: implement screenshot #10, validate id param.
Verify: invalid id shows error; valid id shows progress and metadata.

#### Step 15: Add reading session form

Estimate: 30 minutes
Files: `src/features/sessions/components/SessionForm.tsx`, `src/features/sessions/hooks/use-save-session.ts`
Changes: pages, duration, note, date; update book progress transactionally.
Verify: add session updates current page and dashboard stats.

#### Step 16: Add create bookmark/quote from Book Detail

Estimate: 30 minutes
Files: `src/features/quotes/components/ManualQuoteForm.tsx`, `src/features/quotes/repositories/quotes-repository.ts`, Book Detail screen
Changes: manual quote/bookmark creation without OCR.
Verify: quote persists and appears on book detail.

#### Step 17: Add finish book/post-read flow

Estimate: 30 minutes
Files: `src/features/books/components/FinishBookSheet.tsx`, `src/features/books/hooks/use-finish-book.ts`, `src/features/dashboard/components/PostReadPrompt.tsx`
Changes: mark finished, changed-me, mood/source tag, post-read note.
Verify: finish transaction updates profile changed-me count.

#### Step 18: Build stats services

Estimate: 30 minutes
Files: `src/features/dashboard/services/stats-service.ts`, `src/features/dashboard/services/pulse-service.ts`, `src/features/profile/services/profile-stats-service.ts`
Changes: continuity, velocity, streaks, year books, pages, ink density, bookmarks.
Verify: deterministic tests with fixed clock.

#### Step 19: Wire Home dashboard to SQLite

Estimate: 30 minutes
Files: `src/features/dashboard/DashboardScreen.tsx`, dashboard hooks/components
Changes: replace fixture rendering with local queries plus empty states.
Verify: seeded data matches screenshot labels; empty install shows useful CTA.

### PR 4: Home/Add Book/Book Detail design parity

#### Step 20: Refine tokens from screenshots 1-5 and 10

Estimate: 25 minutes
Files: `src/ui/tokens.ts`, `src/ui/*`
Changes: add precise typography, black cards, cream background, chip styles, progress rings/bars.
Verify: visual smoke on 393x852 simulator.

#### Step 21: Add screenshot fixture registry

Estimate: 20 minutes
Files: `src/test/fixtures/screenshot-registry.ts`
Changes: map screenshot IDs 1-19 to labels/routes.
Verify: test asserts every screenshot has a target.

#### Step 22: Implement Home expanded stat layout

Estimate: 30 minutes
Files: dashboard components
Changes: screenshot #2/#3 stats: continuity, velocity, 90-day rolling, bookmarks.
Verify: RNTL smoke finds `Continuity`, `Velocity`, `90 DAY ROLLING`.

#### Step 23: Implement post-read prompt card

Estimate: 30 minutes
Files: `src/features/dashboard/components/PostReadPrompt.tsx`
Changes: screenshot #4 quote/share prompt and privacy copy.
Verify: finished seeded book shows prompt; dismiss persists in local setting.

#### Step 24: Polish Add Book screenshot state

Estimate: 30 minutes
Files: Add Book screen/form
Changes: step 1 visual layout, barcode CTA, page count optional, Open Library copy.
Verify: component test finds screenshot #5 labels.

### PR 5: Shelves, tags, and archive wall

#### Step 25: Add shelf domain validation

Estimate: 20 minutes
Files: `src/features/shelves/types.ts`, `src/features/shelves/validation.ts`
Changes: custom/system shelf models, view preferences.
Verify: invalid empty shelf name test.

#### Step 26: Add system shelf service

Estimate: 25 minutes
Files: `src/features/shelves/services/system-shelf-service.ts`
Changes: derived shelves: currently reading, finished, want to read, not yet, changed me.
Verify: query tests for each system shelf.

#### Step 27: Wire Shelf overview to SQLite

Estimate: 30 minutes
Files: `src/features/shelves/ShelfOverviewScreen.tsx`, shelf hooks/repositories
Changes: screenshots #11/#12 from local system + custom shelves.
Verify: empty custom shelves still show system shelves.

#### Step 28: Add create/edit shelf flow

Estimate: 30 minutes
Files: `src/features/shelves/components/ShelfForm.tsx`, `src/features/shelves/hooks/use-save-shelf.ts`
Changes: `+ new shelf`, name/description save.
Verify: created shelf appears after restart.

#### Step 29: Add shelf book management

Estimate: 30 minutes
Files: `src/features/shelves/repositories/shelf-books-repository.ts`, `src/features/shelves/components/AddBookToShelfSheet.tsx`
Changes: add/remove/pin book; duplicate prevention.
Verify: duplicate insert fails safely and surfaces friendly message.

#### Step 30: Wire shelf detail views to SQLite

Estimate: 30 minutes
Files: `app/shelves/[id].tsx`, shelf detail components
Changes: grid/list/spine render real books and persist selected view.
Verify: switch view, restart app, preference remains.

#### Step 31: Add tags

Estimate: 30 minutes
Files: `src/features/tags/repositories/tags-repository.ts`, `src/features/tags/components/TagPicker.tsx`, book form
Changes: normalized tags and book tag linking.
Verify: duplicate tags normalize to one row.

#### Step 32: Add Archive Wall

Estimate: 30 minutes
Files: `src/features/shelves/components/ArchiveWall.tsx`, shelf overview
Changes: screenshot #12 archive wall/share wall section from finished books.
Verify: 0/5/100 books render without scroll jank.

### PR 6: Capture, barcode, Open Library, quote capture

#### Step 33: Install camera/image dependencies

Estimate: 20 minutes
Files: `package.json`, `package-lock.json`, `app.json`
Changes: add `expo-camera`, `expo-image-picker`; permission strings.
Verify: `npx expo install --check`.

#### Step 34: Add permission adapter

Estimate: 25 minutes
Files: `src/lib/permissions/permissions-service.ts`, `src/lib/permissions/PermissionGate.tsx`
Changes: unknown/granted/denied/blocked model and Settings deep link.
Verify: unit tests cover permission mapping.

#### Step 35: Add Capture hub route

Estimate: 25 minutes
Files: `app/capture/index.tsx`, `src/features/capture/CaptureHubScreen.tsx`
Changes: screenshot #7 with scan ISBN and capture quote choices.
Verify: both CTAs navigate.

#### Step 36: Add barcode scanner screen

Estimate: 30 minutes
Files: `app/capture/barcode.tsx`, `src/features/books/screens/BarcodeScanScreen.tsx`, `src/features/books/services/isbn-service.ts`
Changes: `CameraView`, EAN-13 settings, scan debounce, screenshot #8 frame.
Verify: real-device ISBN scan; denied permission fallback.

#### Step 37: Add optional Open Library client

Estimate: 30 minutes
Files: `src/features/open-library/open-library-client.ts`, mapper/cache files
Changes: fetch with timeout, no personal identifiers, local cache.
Verify: mocked tests for success/timeout/offline.

#### Step 38: Connect scan to editable book draft

Estimate: 30 minutes
Files: barcode screen, `BookForm`, save hook
Changes: scanned ISBN prepopulates draft when lookup succeeds; manual when not.
Verify: airplane mode scan still opens manual draft.

#### Step 39: Add page capture screen

Estimate: 30 minutes
Files: `app/capture/page.tsx`, `src/features/quotes/screens/PageCaptureScreen.tsx`
Changes: screenshot #9 alignment UI, image capture/import.
Verify: captured/imported image stored locally.

#### Step 40: Add manual quote capture flow

Estimate: 30 minutes
Files: `src/features/quotes/screens/QuoteCaptureScreen.tsx`, `ManualQuoteForm.tsx`, quote repository
Changes: manual fallback first; attach image if available.
Verify: quote saved without OCR.

#### Step 41: OCR adapter spike

Estimate: 30 minutes initial doc/code spike
Files: `src/features/quotes/services/ocr-service.ts`, `docs/design/ocr-spike-notes.md`
Changes: adapter interface, real-device feasibility notes, fallback decision.
Verify: proof or documented blocker.

### PR 7: Notifications, settings, data management

#### Step 42: Install notification/export dependencies

Estimate: 20 minutes
Files: `package.json`, `app.json`
Changes: add `expo-notifications`, `expo-document-picker`, `expo-sharing`, `expo-print`, media/file deps as needed.
Verify: dependency check passes.

#### Step 43: Add notification scheduler adapter

Estimate: 30 minutes
Files: `src/features/notifications/notification-scheduler.ts`, `notification-types.ts`, `app/_layout.tsx`
Changes: local schedules only; Android channel; no push token APIs.
Verify: unit tests assert no push-token call path.

#### Step 44: Add notifications inbox

Estimate: 30 minutes
Files: `app/notifications.tsx`, `src/features/notifications/screens/NotificationsScreen.tsx`
Changes: screenshot #6 from `notifications_log` plus read/tap state.
Verify: seeded notifications render labels and timestamps.

#### Step 45: Implement settings screen from local settings

Estimate: 30 minutes
Files: `src/features/settings/SettingsScreen.tsx`, setting hooks/repository
Changes: screenshot #14 notifications, backup, data, about sections.
Verify: toggles persist after restart.

#### Step 46: Add notification settings UI

Estimate: 25 minutes
Files: `src/features/notifications/components/NotificationSettings.tsx`
Changes: daily share streak and read reminder toggles/times.
Verify: toggling reschedules/cancels local notifications.

#### Step 47: Add import/export manifest schema

Estimate: 30 minutes
Files: `src/features/import-export/export-schema.ts`, `export-manifest.ts`
Changes: versioned payload with rows and relative file references.
Verify: exported fixture validates with zod.

#### Step 48: Add export service

Estimate: 30 minutes
Files: `src/features/import-export/export-service.ts`, `src/lib/files/export-files.ts`
Changes: write JSON/package locally and share through OS.
Verify: real-device export while offline.

#### Step 49: Add import dry-run service

Estimate: 30 minutes
Files: `src/features/import-export/import-service.ts`, `import-conflicts.ts`
Changes: validate version, files, duplicates; produce summary before writes.
Verify: invalid version/missing file/duplicate tests.

#### Step 50: Add data management UI

Estimate: 25 minutes
Files: `src/features/settings/components/DataManagementSection.tsx`, settings screen
Changes: export/import/passport/erase all data actions.
Verify: destructive erase requires explicit confirmation and is test-covered.

#### Step 51: Add annual passport PDF service

Estimate: 30 minutes
Files: `src/features/profile/services/passport-pdf-service.ts`, settings/profile button
Changes: local PDF generation from SQLite stats.
Verify: offline PDF generated and share sheet opens.

### PR 8: Share cards and wrapped

#### Step 52: Install share card dependencies

Estimate: 20 minutes
Files: `package.json`
Changes: add `react-native-view-shot`, `expo-media-library` if saving to photos.
Verify: use dev client if Expo Go limitation appears.

#### Step 53: Define share card registry

Estimate: 25 minutes
Files: `src/features/share-cards/share-card-types.ts`, `share-card-registry.ts`
Changes: register card types including wrapped pages/screenshots #15-19.
Verify: test asserts every registered card has title/loader/component.

#### Step 54: Add share preview route

Estimate: 30 minutes
Files: `app/share/[cardType].tsx`, `src/features/share-cards/screens/SharePreviewScreen.tsx`
Changes: route param validation and local data loading.
Verify: invalid card type shows safe error.

#### Step 55: Add fixed card canvas

Estimate: 30 minutes
Files: `src/features/share-cards/components/ShareCardCanvas.tsx`, `card-tokens.ts`
Changes: deterministic dimensions, local typography, overflow protection.
Verify: long title/quote tests do not overflow critical actions.

#### Step 56: Implement wrapped card screens 15-19

Estimate: 30 minutes per 1-2 cards
Files: `src/features/share-cards/components/cards/Wrapped*.tsx`, profile wrapped service
Changes: totals, time-of-day, fastest read, changed-you, top genres cards.
Verify: component tests find exact screenshot labels.

#### Step 57: Add share export service

Estimate: 30 minutes
Files: `src/features/share-cards/services/share-export-service.ts`
Changes: capture PNG, write local file, share/save, log `share_events`.
Verify: real-device PNG export/share.

#### Step 58: Add wrapped flow navigation

Estimate: 30 minutes
Files: profile screen, share routes, wrapped screen
Changes: reading wrapped action opens swipe/step wrapped sequence.
Verify: screenshots #15-19 reachable in order.

### PR 9: Backup adapter, polish, release readiness

#### Step 59: Add sync adapter interface

Estimate: 25 minutes
Files: `src/features/sync/sync-adapter.ts`, `noop-sync-adapter.ts`
Changes: available/backup/restore/lastSyncedAt capabilities.
Verify: unavailable states test-covered.

#### Step 60: Implement manual backup path

Estimate: 30 minutes
Files: `src/features/sync/local-file-backup-adapter.ts`, settings backup UI
Changes: backup is export-to-Files/share flow, not automatic backend sync.
Verify: iOS/Android manual backup path works.

#### Step 61: iCloud feasibility note

Estimate: 30 minutes
Files: `docs/design/icloud-sync-spike.md`
Changes: document whether automatic iCloud is v1/post-v1.
Verify: decision recorded; no accidental cloud dependency introduced.

#### Step 62: Performance pass

Estimate: 30 minutes per screen group
Files: dashboard/shelves/share-card components
Changes: `FlatList`, memoized view models, image sizing, no large `ScrollView` lists.
Verify: seeded 1k and 5k book libraries on device.

#### Step 63: Accessibility pass

Estimate: 30 minutes per screen group
Files: `src/ui/*`, feature components
Changes: roles, labels, focus order, dynamic type, 44+ pt targets.
Verify: VoiceOver/TalkBack smoke on core flows.

#### Step 64: Add E2E smoke flows

Estimate: 30 minutes per flow
Files: `.maestro/*.yaml`, `package.json`
Changes: add book offline, add session, finish book, create shelf, quote, wrapped/share, export/import.
Verify: Maestro suite runs on simulator/emulator.

#### Step 65: Release/privacy docs

Estimate: 30 minutes
Files: `docs/release/privacy.md`, `docs/release/qa-checklist.md`, app config
Changes: no data collection, permission list, offline QA matrix.
Verify: QA checklist matches implemented permissions/features.

## 8. Test plan

Unit tests:

- Validators: book, shelf, session, quote, settings, import/export payloads.
- Stats services: continuity, velocity, streaks, pages, ink density, top genres, fastest read, changed-you count.
- Pulse service: maps session dates to heatmap intensity with fixed clock/timezone.
- Repositories: SQL params, duplicate constraints, transaction boundaries.
- Open Library: success, timeout, offline, malformed response.
- OCR parser: blank lines, hyphenated breaks, OCR noise cleanup.
- Share/wrapped view models: empty library, long titles, missing cover, partial year.

Component tests:

- Screenshot label smoke tests for all 19 screenshot states.
- Book form required fields and save callback.
- Add Book modal and barcode fallback CTA.
- Book Detail progress/session/quote states.
- Shelf overview empty/custom/system states.
- Settings toggles and destructive erase confirmation.
- Share preview invalid card type and valid wrapped card.

Integration tests:

- SQLite migration creates all tables/indexes.
- Add book + session transaction updates dashboard query outputs.
- Finish book transaction updates profile stats and prompt state.
- Export then import into clean DB round-trip.
- Notification scheduler with Expo API mocks: schedule/cancel/tap log.

E2E/manual tests:

- Airplane mode: add book, add session, finish book.
- Real device: camera ISBN scan, page capture, local notification, PNG share, PDF export.
- Import/export on simulator and physical device.
- Large library performance with 1,000 / 5,000 books.
- VoiceOver/TalkBack core flows.

Regression policy:

- Every bug gets a failing test first.
- Every schema version gets an upgrade test from previous `PRAGMA user_version`.
- Every import/export schema change gets backward compatibility fixtures.

## 9. Rollout & rollback plan

Development rollout:

- Land in small PRs listed above; each PR must pass typecheck/lint/test and a manual Expo smoke run.
- Keep fixture fallback screens until each route has local data and empty states.
- Use dev-only seed tooling to verify screenshot parity without polluting production builds.
- Introduce custom dev client only when camera/share/OCR dependencies require it.

User/data rollout:

- Schema v1 ships once DB migrations are stable.
- Future schema changes use additive migrations, then code switch, then cleanup in later versions.
- Export/import must be available before any risky schema changes after v1.
- No destructive reset path is allowed as automatic recovery.

Rollback:

- Code rollback: revert feature PR; schema remains additive and compatible.
- Migration rollback: do not downgrade/wipe user DB. Leave unused additive columns/tables if necessary and stop reading them.
- Feature rollback: hide route/CTA behind local app setting/dev flag; keep existing data intact.
- Native capability rollback: if OCR/share/save breaks on device, disable capability and keep manual entry/share preview.

## 10. Risks & mitigations

Risk: OCR is too slow or incompatible in Expo runtime.
Mitigation: manual quote capture ships first; OCR behind adapter and feature flag; document spike results.

Risk: Expo Go cannot support all native features.
Mitigation: stay SDK 54/Expo Go for DB/forms; move to custom dev client before camera/share/OCR release testing.

Risk: Large libraries make dashboard/shelves janky.
Mitigation: indexed queries, derived stats services, `FlatList`, memoized view models, seeded performance tests.

Risk: Import overwrites or corrupts local data.
Mitigation: validate manifest, dry-run summary, non-destructive merge default, transaction boundaries, pre-import export prompt.

Risk: Accidental backend/cloud/analytics creep.
Mitigation: dependency review, no tracking SDKs, no push token APIs, optional Open Library only, privacy tests/docs.

Risk: Visual drift from screenshots.
Mitigation: screenshot registry, label tests, tokenized design system, PR-level visual smoke on 393x852.

Risk: Destructive erase is tapped accidentally.
Mitigation: hidden under settings, confirm phrase, extra warning, optional export-before-erase prompt.

## 11. Open questions

- Should automatic iCloud sync be excluded from v1 entirely, with only manual export/import and “Save to iCloud Drive” via Files share sheet?
- Should Open Library lookup be enabled by default, or should the UI ask before the first network metadata lookup?
- What exact cover image source is allowed for Open Library covers: remote image URL cache, local-only placeholder, or downloaded local copy after user confirmation?
- Which OCR path should be approved after spike: `tesseract.js`, native OCR/ML Kit, or manual-only v1?
- Should “erase all data” be shipped in v1 or reserved for debug/internal builds until export/import is proven?
- Should wrapped/share cards be available for any date range or only yearly/monthly presets shown in screenshots?
- Should notifications inbox show generated local reminders only, or also local app activity events such as exports and finished books?
- Should Android backup mention generic Files/Drive export only, since iCloud is iOS-specific?
