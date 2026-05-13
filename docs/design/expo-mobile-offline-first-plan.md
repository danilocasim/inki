# Inki Expo Mobile Offline-First Implementation Plan

Version: 1.1  
Date: 2026-05-14  
Status: Recommended implementation plan  
Scope: React Native + Expo mobile app, local-only, no backend, no auth, no AI

## 1. Goal

Build Inki as a production mobile app using React Native + Expo that implements the corrected local-only product specification:

- Offline-first mobile app for iOS and Android.
- Local SQLite database on device via `expo-sqlite`.
- Local file storage for covers, OCR images, exports, and generated share cards.
- Local-only notifications via `expo-notifications`.
- On-device share card PNG generation via `react-native-view-shot`.
- Optional Open Library lookup for book metadata with graceful offline fallback.
- No backend, no authentication, no AI/LLM, no cloud storage, no social network, no server-side processing.

The recommended approach is an Expo-managed app with a custom development client as soon as OCR/share/native capability risk requires it. Keep the runtime architecture local-only and isolate every OS/external boundary behind adapters.

## 2. Success criteria

### Functional

- A fresh user can install the app, skip login entirely, and log a book while offline.
- Home dashboard renders The Stack, The Pulse, and velocity stats from local SQLite data.
- Books, sessions, shelves, quotes, tags, settings, and notification logs persist locally across app restarts.
- ISBN scanning works offline using Expo Camera barcode scanning; Open Library lookup is optional and non-blocking.
- OCR quote capture runs on-device or fails gracefully to manual quote entry without data loss.
- All 11 share card types render on-device and export/share as PNG through native OS flows.
- Daily share streak and read reminder notifications are scheduled locally, never through push tokens.
- Data export/import works without an account and includes JSON plus local images.
- iCloud backup/sync path is isolated behind a sync adapter and can ship initially as user-driven iCloud Drive export/import if automatic iCloud is not ready.

### Non-functional

- App launches to usable UI in under 2 seconds on recent mid-tier devices.
- Local dashboard queries complete in under 100 ms for normal libraries and under 500 ms for 5,000 books / 50,000 sessions.
- Share card PNG export completes in under 3 seconds for normal cards and under 8 seconds for archive/wrapped cards.
- OCR is treated as a long-running task with progress, cancellation, and manual fallback.
- No runtime dependency on Inki-owned servers.
- No personal data leaves the device except explicit user-initiated share/export and optional Open Library lookup containing only search terms/ISBN.
- Permission requests are just-in-time and have denial/blocked states.

## 3. Assumptions

- The repository is currently an empty git repo for app work: no `package.json`, no `app/`, no `src/`, no existing local implementation.
- Figma Desktop MCP is now the primary visual/source-of-truth context for v1 UI structure. The inspected file is `2js5xldlkB09Q3oQXtfN2n`, page node `0:1`, with 9 mobile frames at `393 x 852`.
- Figma variables returned `{}`, so implementation must infer tokens from the Figma layer metadata/screenshots and then centralize them in `src/ui/tokens.ts` before feature screens are built.
- Full `get_design_context` reference-code output is blocked until Figma Dev Mode MCP settings allow an asset-write directory. Metadata is available and sufficient for route/component mapping; final visual polish should rerun `get_design_context` after allowing the repo or disabling asset downloads.
- Expo SDK should be the latest stable at implementation time. Context checked against Expo docs that include SDK 55/56 examples.
- `expo-barcode-scanner` should not be the default implementation because Expo docs identify it as deprecated/no longer available after SDK 51. Use `expo-camera` `CameraView` barcode scanning instead.
- `tesseract.js` is the requested OCR direction, but React Native/Expo runtime compatibility and bundle size are implementation risks. Treat OCR as an early spike behind an `OcrService` adapter.
- iCloud behavior needs product clarification: manual iCloud Drive backup/import is much easier in Expo than automatic CloudKit-style sync. Automatic iCloud may require native entitlements/config plugins/custom dev client.
- Android has no iCloud equivalent. Android users should at minimum get local JSON/image export/import; Google Drive sync is out of scope unless explicitly requested.

## 4. Current state (files/flows)

### Repository inventory

Current workspace: `/Users/danilo/repos/inki`

Observed files/directories:

```text
.git/
browser-outputs/        # untracked Playwright/browser artifacts, not app source
docs/design/            # created for this plan
```

No app source exists yet:

- No `package.json`
- No Expo config
- No `app/` routes
- No `src/` modules
- No tests
- No local schema/migrations
- No project-local `.opencode/skills`

### External references provided by product spec and Figma MCP

- Corrected Inki spec v3.2, May 2026.
- Figma design file: `https://www.figma.com/design/2js5xldlkB09Q3oQXtfN2n/Untitled?node-id=0-1&t=OB8BSCVtmcmoxOSA-1`.
- Figma MCP page node: `0:1`.
- Figma variables: `{}`.
- Figma frame size: `393 x 852`.
- Screenshot references in `/Users/danilo/inki-assets/ss-screen/*.png` are secondary references only if they differ from Figma.

### Figma screen inventory

The Figma page contains 9 top-level mobile frames. Treat these as the concrete v1 route/component map:

| Frame ID | Screen                        | Route/component target                                                   | Main content from Figma                                                                                                     |
| -------- | ----------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `1:2`    | Home dashboard, primary state | `app/(tabs)/index.tsx`, `src/features/dashboard/*`                       | `inki`, `Add Book`, tabs `reading/recent/want to read`, `The Stack`, `The Pulse`, bookmark and continuity stats, bottom nav |
| `2:2`    | Home dashboard variant        | same route; fixture/regression variant                                   | Same content as `1:2` without some date labels                                                                              |
| `2:384`  | Home dashboard variant        | same route; fixture/regression variant                                   | Same dashboard hierarchy as `1:2`                                                                                           |
| `4:2`    | Shelf overview                | `app/(tabs)/shelves.tsx`, `src/features/shelves/ShelfOverviewScreen.tsx` | filters `all/reading/finished/want to read/not yet`, `MY SHELVES — 4`, shelf cards, `ARCHIVE WALL`, share wall              |
| `4:129`  | Shelf overview variant        | same route; fixture/regression variant                                   | Same shelf overview without top `shelf` title in extracted text                                                             |
| `4:256`  | Shelf detail grid             | `app/shelves/[id].tsx?view=grid`                                         | `midnight reads`, `grid/list/spine`, 6 book cover cards, `share shelf`                                                      |
| `4:355`  | Shelf detail list             | `app/shelves/[id].tsx?view=list`                                         | row list with `Normal People` progress `72%`, other books/authors, `share shelf`                                            |
| `4:466`  | Shelf detail spine            | `app/shelves/[id].tsx?view=spine`                                        | sort chips `year/color/genre/author`, vertical spine cards, selected book detail panel                                      |
| `4:691`  | Private profile               | `app/(tabs)/profile.tsx`, `src/features/profile/*`                       | `@anya`, local-only badge, stats, reading wrapped, annual passport, export library, iCloud sync, top genres                 |

### Figma-derived sample data

Use these names as seed fixtures and test expectations so UI is built against the actual design vocabulary rather than generic placeholders:

- Home stack books: `Piranesi`, `Klara and the Sun`, `The Overstory`, `Tomb of Sand`, `Bewilderment`, `Crossroads`.
- Shelf detail books: `Normal People`, `Demon Copperhead`, `Remains of the Day`, `Piranesi`, `Babel`, `Pachinko`.
- Authors: `Susanna Clarke`, `Kazuo Ishiguro`, `Richard Powers`, `Geetanjali Shree`, `Jonathan Franzen`, `S. Rooney`, `B. Kingsolver`, `R.F. Kuang`, `M. Lee`.
- Profile: user handle `@anya`, local-only privacy badge, genre chips `literary fiction`, `contemporary`, `romance`, `sci-fi`.

### Current behavior

There is no implemented behavior in this repo yet.

### Required flows

- Zero-friction onboarding: open app -> blank local library -> add/log first book.
- Manual book entry: create/edit books offline.
- Barcode flow: camera permission -> scan ISBN -> optional Open Library lookup -> editable book form -> save locally.
- Reading session flow: select book -> add pages/time/note -> update local stats.
- Finish book flow: mark finished -> post-read debrief -> changed-me/mood/source tags -> optional share card.
- Shelf flow: system/custom shelves -> add/remove/pin books -> grid/list/spine/archive views.
- OCR quote flow: camera/photo permission -> capture/import image -> OCR -> line picker -> save quote.
- Share flow: select card type -> preview -> capture PNG -> share sheet/save image.
- Notification flow: enable setting -> local schedule -> tap notification -> full-screen share prompt/read reminder.
- Profile/settings flow: local stats -> notification settings -> export/import -> optional iCloud toggle.

### Data model/contracts involved

Use the corrected local SQLite model as the source of truth:

- `books`
- `shelves`
- `shelf_books`
- `reading_sessions`
- `quotes`
- `tags`
- `book_tags`
- `app_settings`
- `notifications_log`

Recommended additions to make the schema production-safe:

- Foreign keys enabled with `PRAGMA foreign_keys = ON`.
- WAL enabled with `PRAGMA journal_mode = WAL`.
- `CHECK` constraints for enum fields where supported.
- `UNIQUE(shelfId, bookId)` on `shelf_books`.
- `UNIQUE(name)` on `tags`.
- `PRIMARY KEY(bookId, tagId)` on `book_tags`.
- Indexes for dashboard and detail query patterns:
  - `books(status, updatedAt)`
  - `books(finishDate)`
  - `reading_sessions(date)`
  - `reading_sessions(bookId, date)`
  - `shelf_books(shelfId, sortOrder, addedAt)`
  - `quotes(bookId, createdAt)`
  - `notifications_log(type, sentAt)`

### Constraints

- Privacy: no account, no analytics, no tracking, no Inki server.
- Offline: all core actions work without network.
- Mobile permissions: request camera/photos/notifications only when needed.
- App Store/Google Play: permissions, privacy labels, and local data policy must be accurate.
- Performance: large local libraries require indexed queries, memoized derived stats, and virtualized lists.
- Visual fidelity: share cards should be deterministic at export sizes and not depend on remote rendering.

## 5. Proposed approach (recommended)

### Architecture summary

Use a feature-first Expo Router app with thin screens, local SQLite repositories, domain services for calculations, and OS boundary adapters.

```text
app/                         # Expo Router route boundaries only
  _layout.tsx                 # providers: theme, db, notifications, errors
  (tabs)/
    index.tsx                 # Home
    shelves.tsx               # Shelf entry
    profile.tsx               # Profile entry
  book/[id].tsx               # Book detail
  scan/index.tsx              # OCR/barcode entry
  share/[cardType].tsx        # Share card preview/export
  settings.tsx
  (modals)/log-book.tsx
  (modals)/share-prompt.tsx

src/
  features/
    books/
    dashboard/
    sessions/
    shelves/
    quotes/
    share-cards/
    notifications/
    profile/
    settings/
    import-export/
    sync/
    open-library/
  lib/
    db/                       # schema, migrations, typed query helpers
    files/                    # local file paths/copy/delete
    permissions/              # centralized permission adapters
    platform/                 # iOS/Android shims
    time/                     # clock/date helpers
    errors/                   # local error taxonomy
  ui/                         # reusable primitives, tokens, icons
  assets/                     # fonts, images, OCR assets if bundled
  test/                       # fixtures/builders/mocks
```

### Recommended dependency posture

Start with Expo-managed + TypeScript:

- Core: `expo`, `react-native`, `typescript`, `expo-router`.
- Local DB: `expo-sqlite` using `SQLiteProvider`, `useSQLiteContext`, async APIs, and `PRAGMA user_version` migrations.
- Camera/barcode: `expo-camera` `CameraView` with `barcodeScannerSettings` for ISBN formats.
- Files: `expo-file-system`, `expo-document-picker`, `expo-sharing`, `expo-media-library`, `expo-image-picker`.
- Image rendering: `react-native-view-shot`, plus `expo-image` for efficient cover display.
- Notifications: `expo-notifications` with local schedules only; do not request push tokens.
- PDF: `expo-print` for local Annual Book Passport PDF generation.
- OCR: isolate `tesseract.js` in `src/features/quotes/services/ocr-service.ts`; validate in a spike before committing UI promises.
- Validation: `zod` for import/export payloads and route param validation.
- Testing: `jest-expo`, `@testing-library/react-native`, and Maestro for a small mobile E2E suite.

Avoid these entirely:

- Supabase, Firebase, S3, tRPC, Vercel runtime/API routes, server actions.
- OpenAI/Anthropic/LLM SDKs.
- Remote analytics/crash telemetry unless there is later explicit opt-in/privacy approval.
- Remote push tokens for notifications.

### Data flow

#### Normal local write

```text
Screen/Form
  -> feature hook/use case
  -> repository transaction
  -> expo-sqlite
  -> local file adapter when images are involved
  -> local invalidation/refetch
  -> UI update
```

#### Optional Open Library lookup

```text
Barcode/manual search
  -> OpenLibraryClient.searchByIsbn/searchByTitle
  -> timeout/cache/offline fallback
  -> editable draft book form
  -> user confirms
  -> local save
```

Open Library should never be required for saving a book.

#### Share export

```text
Card route params validated
  -> local SQLite queries
  -> deterministic card view model
  -> ShareCardPreview component
  -> captureRef() via react-native-view-shot
  -> save temp PNG in local exports directory
  -> Sharing.shareAsync() or MediaLibrary.saveToLibraryAsync()
```

#### Notifications

```text
Settings change
  -> NotificationScheduler adapter
  -> cancel/reschedule local notification ids
  -> app_settings stores enabled/time/ids
  -> notifications_log records sent/tapped/read when observable
```

#### Import/export

```text
Export request
  -> read DB rows in schema versioned payload
  -> include images under relative paths
  -> zip JSON + image files
  -> save/share to Files/iCloud Drive

Import request
  -> pick zip/json
  -> validate manifest/version with zod
  -> copy images into app directory
  -> transactional upsert into SQLite
  -> show import summary/conflicts
```

### Error handling and user-visible semantics

- Validation errors: inline field messages; never discard drafts.
- Permission denied: show feature-specific fallback and a Settings deep link.
- Network unavailable: show “Open Library unavailable. You can still add this manually.”
- OCR failed/slow: show progress, allow cancel, route to manual quote entry.
- Share export failed: keep preview visible and show retry/save diagnostics.
- DB migration failed: block app with recovery screen that offers export diagnostics, not destructive reset.
- Import conflict: ask user to merge/skip/replace; default to non-destructive merge.

### Backwards compatibility and migrations

- Use `PRAGMA user_version` with additive migrations.
- Never wipe user data as a recovery strategy.
- Keep export payload versioned:

```json
{
  "app": "inki",
  "schemaVersion": 1,
  "exportedAt": "2026-05-14T00:00:00.000Z",
  "data": {},
  "files": []
}
```

- Store file paths as app-relative paths when possible so imports/backups survive sandbox path changes.
- Add migration tests before changing schema after v1.

### UI/UX design direction

- Implement a Figma-derived design token layer first: color, spacing, radius, typography, shadows, animation timings. Because Figma variables are empty, every hardcoded visual value must be promoted to tokens during the first UI pass.
- Translate the 9 Figma MCP frames into reusable primitives before building feature screens. Start from metadata IDs `1:2`, `4:2`, `4:256`, `4:355`, `4:466`, and `4:691` rather than generic mockups.
- Use native-safe areas and large touch targets.
- Keep the app fully usable with empty states; no onboarding account wall.
- Use bottom tabs for Home, Shelf, Profile to match Figma labels exactly (`home`, `shelf`, `profile`). Route shelf detail views through a stack route with a persisted segmented control for `grid`, `list`, and `spine`.
- Build share cards as deterministic fixed-size layout components independent from screen UI.

### Figma-to-implementation mapping

Recommended screen/component boundaries:

```text
app/(tabs)/index.tsx
  -> DashboardScreen
     -> TopBar, FilterTabs, TheStack, ThePulse, StatTiles, PostReadPrompt

app/(tabs)/shelves.tsx
  -> ShelfOverviewScreen
     -> ShelfFilterTabs, ShelfCardList, ArchiveWallCard

app/shelves/[id].tsx
  -> ShelfDetailScreen
     -> ShelfHeader, ShelfViewTabs, ShelfGridView, ShelfListView, ShelfSpineView, ShareShelfFooter

app/(tabs)/profile.tsx
  -> PrivateProfileScreen
     -> ProfileHeader, LocalOnlyBadge, ProfileStatsRow, ProfileActionList, TopGenres
```

Do not create separate routes for each Figma duplicate frame. Use duplicate/variant frames as visual regression references and fixture states.

## 6. Alternatives (with tradeoffs)

### Alternative A: Expo managed app with raw `expo-sqlite` repositories (recommended)

Pros:

- Small dependency surface.
- Fits local-only/offline-first spec.
- Easy to reason about data leaving device.
- Expo tooling accelerates builds, permissions, and App Store setup.
- Raw SQL makes indexes/query plans explicit.

Cons:

- More manual typing around query results.
- Migrations/repositories need discipline.
- OCR/iCloud native capability may require custom dev client/prebuild.

Use this unless the team strongly prefers an ORM.

### Alternative B: Expo + Drizzle ORM over SQLite

Pros:

- Better type-safety for schema/query definitions.
- Cleaner migrations if the team already knows Drizzle.
- Reduces stringly typed SQL in repositories.

Cons:

- Additional abstraction and dependency.
- More setup in Expo/SQLite.
- Can hide SQL performance details for a small local app.

Use only if raw SQL starts causing correctness issues.

### Alternative C: Bare React Native instead of Expo

Pros:

- Full native control for OCR/iCloud/CloudKit.
- Easier to add custom native modules without config plugin work.

Cons:

- Slower setup and more native maintenance.
- Higher iOS/Android build complexity.
- More opportunity to drift from simple product needs.

Do not start here. Move toward prebuild/custom dev client only when a specific capability requires it.

### Alternative D: Use platform-native OCR instead of `tesseract.js`

Pros:

- Better mobile performance and battery behavior.
- Often better camera-text UX.

Cons:

- Requires native modules/config plugins.
- Different iOS/Android behavior.
- May add Google ML Kit dependency on Android, which needs privacy review even if on-device.

Keep as fallback if `tesseract.js` is not viable in Expo runtime.

## 7. Step plan (< 30 min each)

### Suggested PR breakdown

1. PR 1: Expo scaffold, tooling, Figma-derived tokens, routing shell, fixture data, and static Figma screen shells.
2. PR 2: SQLite schema, migrations, repositories, seed/dev tooling, and fixture-to-local-data mapping.
3. PR 3: Book logging, sessions, and dynamic Home dashboard.
4. PR 4: Shelf overview/detail views (`grid`, `list`, `spine`), tags, archive wall.
5. PR 5: Camera/barcode, Open Library fallback, OCR spike/quote capture.
6. PR 6: Share card system and PNG export.
7. PR 7: Profile, notifications, settings, export/import.
8. PR 8: iCloud backup/sync adapter, accessibility/performance polish, release readiness.

This revises the earlier data-first ordering. The UI shell and Figma fixture pass now happen before SQLite wiring so the intended visual routes and component boundaries are frozen before local persistence is connected.

### PR 1: Expo scaffold and app shell

#### Step 1: Scaffold Expo TypeScript app

Estimate: 20 minutes  
Dependencies: none

Files to touch:

- `package.json`
- `app.json` or `app.config.ts`
- `tsconfig.json`
- `app/_layout.tsx`
- `.gitignore`

Changes:

- Create Expo app in the repo root with TypeScript and Expo Router.
- Configure app name/bundle identifiers placeholders.
- Ensure no auth/backend templates are included.

Verification:

- `npx expo start --clear` starts Metro.
- TypeScript project loads without config errors.

#### Step 2: Add lint/format/test baseline

Estimate: 25 minutes  
Dependencies: Step 1

Files to touch:

- `package.json`
- `eslint.config.*`
- `prettier.config.*`
- `jest.config.*`
- `src/test/setup.ts`

Changes:

- Add scripts: `typecheck`, `lint`, `test`, `test:watch`.
- Install Jest Expo and React Native Testing Library.
- Keep CI-ready commands deterministic.

Verification:

- `npm run typecheck`
- `npm run lint`
- `npm test -- --runInBand` or equivalent.

#### Step 3: Create feature-first folder skeleton

Estimate: 15 minutes  
Dependencies: Step 1

Files to touch:

- `src/features/*/.gitkeep` or initial `index.ts`
- `src/lib/*/.gitkeep`
- `src/ui/*`
- `src/assets/README.md`

Changes:

- Establish module ownership before features grow.

Verification:

- Imports resolve via configured path aliases if aliases are added.
- No circular imports introduced.

#### Step 4: Define Figma-derived tokens and base UI primitives

Estimate: 25 minutes  
Dependencies: Step 3

Files to touch:

- `src/ui/tokens.ts`
- `src/ui/Text.tsx`
- `src/ui/Button.tsx`
- `src/ui/Screen.tsx`
- `src/ui/Card.tsx`
- `src/ui/SegmentedControl.tsx`
- `src/ui/StatTile.tsx`

Changes:

- Add shared colors, spacing, radius, typography, shadows, and icon sizing inferred from the Figma frames.
- Add accessible primitives used by all screens.
- Include primitives specifically required by Figma: segmented tabs (`reading/recent/want to read`, `grid/list/spine`), book cards, stat tiles, and bottom-nav labels.
- Keep tap targets at least 44 pt even where Figma metadata shows smaller icon frames.

Verification:

- Component tests render Button/Text.
- Component tests render SegmentedControl and StatTile states.
- Manual smoke in simulator shows typography, safe area, and bottom-nav spacing close to the 393 px Figma frame.

#### Step 5: Add tab/stack route shell

Estimate: 25 minutes  
Dependencies: Step 4

Files to touch:

- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/shelves.tsx`
- `app/(tabs)/profile.tsx`
- `app/settings.tsx`

Changes:

- Add Home/Shelf/Profile bottom tabs with labels matching Figma: `home`, `shelf`, `profile`.
- Add Settings route from Profile action list, but do not expose it as a fourth tab.
- No auth route group.
- Add shelf detail route `app/shelves/[id].tsx` with query/state support for `grid`, `list`, and `spine`.

Verification:

- Navigate across tabs on iOS and Android simulator.
- No login/account screen exists.
- Opening a shelf can switch among `grid`, `list`, and `spine` without remounting the whole app shell.

#### Step 6: Add local error boundary and empty-state component

Estimate: 20 minutes  
Dependencies: Step 5

Files to touch:

- `app/_layout.tsx`
- `src/ui/ErrorState.tsx`
- `src/ui/EmptyState.tsx`
- `src/lib/errors/local-error.ts`

Changes:

- Add reusable error/empty UI for offline-first screens.

Verification:

- Unit test ErrorState action callback.
- Manual route renders empty state without data.

#### Step 6A: Add Figma fixture data

Estimate: 20 minutes  
Dependencies: Step 4

Files to touch:

- `src/test/fixtures/figma-books.ts`
- `src/test/fixtures/figma-shelves.ts`
- `src/test/fixtures/figma-profile.ts`
- `src/features/dashboard/fixtures.ts`

Changes:

- Encode Figma-extracted sample books, shelves, profile stats, tabs, and labels as typed fixture data.
- Include frame IDs in comments/metadata so implementers can trace fixture groups back to Figma (`1:2`, `4:2`, `4:256`, `4:355`, `4:466`, `4:691`).
- Use these fixtures for the first static screens and later seed the local SQLite development database.

Verification:

- `npm run typecheck` validates fixture types.
- Unit tests assert key labels from Figma are present: `The Stack`, `The Pulse`, `midnight reads`, `@anya`, `share shelf`.

#### Step 6B: Build static Figma screen shells from fixtures

Estimate: 25 minutes  
Dependencies: Step 5 and Step 6A

Files to touch:

- `app/(tabs)/index.tsx`
- `app/(tabs)/shelves.tsx`
- `app/(tabs)/profile.tsx`
- `app/shelves/[id].tsx`
- `src/features/dashboard/DashboardScreen.tsx`
- `src/features/shelves/ShelfOverviewScreen.tsx`
- `src/features/shelves/ShelfDetailScreen.tsx`
- `src/features/profile/PrivateProfileScreen.tsx`

Changes:

- Render static but navigable versions of the six unique Figma screens: Home, Shelf overview, Shelf detail grid, Shelf detail list, Shelf detail spine, and Profile.
- Keep data hardcoded through fixtures only; do not introduce DB state yet.
- Implement view switching for `grid/list/spine` using local component state or route params.

Verification:

- Manual simulator pass reaches Home, Shelf, Shelf detail, and Profile through bottom tabs/stack navigation.
- React Native Testing Library smoke tests find Figma labels: `Add Book`, `MY SHELVES — 4`, `grid`, `list`, `spine`, `reading wrapped`.

### PR 2: Local SQLite foundation

#### Step 7: Install and configure `expo-sqlite`

Estimate: 20 minutes  
Dependencies: PR 1

Files to touch:

- `package.json`
- `app/_layout.tsx`
- `src/lib/db/database-provider.tsx`

Changes:

- Wrap app with `SQLiteProvider`.
- Use `databaseName="inki.db"`.
- Add suspense/loading state for DB init.

Verification:

- App starts and logs SQLite version in dev-only diagnostics.

#### Step 8: Add schema v1 migration

Estimate: 30 minutes  
Dependencies: Step 7

Files to touch:

- `src/lib/db/migrations.ts`
- `src/lib/db/schema.sql.ts`
- `src/lib/db/types.ts`

Changes:

- Create all corrected spec tables.
- Enable WAL and foreign keys.
- Use `PRAGMA user_version = 1`.

Verification:

- Migration runs once on clean app install.
- Test asserts expected tables exist.

#### Step 9: Add indexes and constraints

Estimate: 25 minutes  
Dependencies: Step 8

Files to touch:

- `src/lib/db/migrations.ts`
- `src/lib/db/schema.sql.ts`

Changes:

- Add enum checks, foreign keys, unique constraints, query indexes.

Verification:

- Migration test validates indexes through `sqlite_master`.
- Attempt duplicate shelf/book relation fails safely.

#### Step 10: Add DB query helper and transaction wrapper

Estimate: 25 minutes  
Dependencies: Step 9

Files to touch:

- `src/lib/db/query.ts`
- `src/lib/db/transaction.ts`
- `src/lib/errors/db-error.ts`

Changes:

- Centralize `getAllAsync`, `getFirstAsync`, `runAsync` helpers.
- Normalize SQLite errors to local app errors.

Verification:

- Unit tests cover success and normalized failure path with mocks.

#### Step 11: Add typed repository pattern

Estimate: 25 minutes  
Dependencies: Step 10

Files to touch:

- `src/features/books/repositories/books-repository.ts`
- `src/features/sessions/repositories/sessions-repository.ts`
- `src/features/shelves/repositories/shelves-repository.ts`
- `src/features/settings/repositories/settings-repository.ts`

Changes:

- Add repository interfaces and minimal create/read functions.
- Keep SQL out of screens.

Verification:

- Unit tests mock DB adapter and assert SQL params.

#### Step 12: Add development seed command/screen

Estimate: 25 minutes  
Dependencies: Step 11

Files to touch:

- `src/lib/db/dev-seed.ts`
- `app/settings.tsx` or dev-only route

Changes:

- Add dev-only seed data for books/sessions/shelves.
- Protect with `__DEV__`.

Verification:

- Seed appears only in dev builds.
- Home can query seeded data once dashboard exists.

### PR 3: Books, sessions, and Home dashboard

#### Step 13: Add book domain types and validation

Estimate: 20 minutes  
Dependencies: PR 2

Files to touch:

- `src/features/books/types.ts`
- `src/features/books/validation.ts`
- `src/features/books/book-status.ts`

Changes:

- Define enums/status/mood/source types matching schema.
- Validate create/update inputs.

Verification:

- Unit tests cover invalid enum/date/page count cases.

#### Step 14: Build Log Book modal form

Estimate: 30 minutes  
Dependencies: Step 13

Files to touch:

- `app/(modals)/log-book.tsx`
- `src/features/books/components/BookForm.tsx`
- `src/features/books/hooks/use-save-book.ts`

Changes:

- Manual title/author/status/page count/genre/source form.
- Save to local SQLite only.

Verification:

- Component test submits valid form.
- Manual simulator: add book while airplane mode enabled.

#### Step 15: Add cover image local file adapter

Estimate: 25 minutes  
Dependencies: Step 14

Files to touch:

- `src/lib/files/app-files.ts`
- `src/features/books/services/cover-image-service.ts`
- `src/features/books/components/CoverPicker.tsx`

Changes:

- Copy selected images into app document directory.
- Store relative path in DB.
- Add placeholder cover color fallback.

Verification:

- Add/edit book with cover, restart app, cover still loads.

#### Step 16: Add Book Detail route

Estimate: 30 minutes  
Dependencies: Step 14

Files to touch:

- `app/book/[id].tsx`
- `src/features/books/screens/BookDetailScreen.tsx`
- `src/features/books/hooks/use-book-detail.ts`

Changes:

- Validate route param.
- Show book metadata, sessions, quotes placeholder, edit actions.

Verification:

- Invalid/missing id shows error state.
- Existing book route loads from SQLite.

#### Step 17: Add reading session check-in

Estimate: 30 minutes  
Dependencies: Step 16

Files to touch:

- `src/features/sessions/components/SessionForm.tsx`
- `src/features/sessions/hooks/use-save-session.ts`
- `src/features/sessions/repositories/sessions-repository.ts`

Changes:

- Add pages read, duration, optional note, local date.

Verification:

- Unit tests validate pages/duration bounds.
- Manual: add session and see it on book detail.

#### Step 18: Add finish book and post-read debrief

Estimate: 30 minutes  
Dependencies: Step 16

Files to touch:

- `src/features/books/components/FinishBookSheet.tsx`
- `src/features/books/hooks/use-finish-book.ts`

Changes:

- Mark finished, set finishDate, moodTag, isChangedYou, postReadNote.

Verification:

- Unit test finish mutation is transactional.
- Manual: finished book appears in finished status.

#### Step 19: Add local stats calculation service

Estimate: 25 minutes  
Dependencies: Step 17

Files to touch:

- `src/features/dashboard/services/stats-service.ts`
- `src/features/dashboard/types.ts`

Changes:

- Compute books read, pages, streaks, velocity, top genres, peak streak.

Verification:

- Unit tests with fixed clock and deterministic fixtures.

#### Step 20: Build The Stack component

Estimate: 25 minutes  
Dependencies: Step 19

Files to touch:

- `src/features/dashboard/components/TheStack.tsx`
- `src/features/dashboard/hooks/use-stack-books.ts`

Changes:

- Render local book grid with covers/placeholders.

Verification:

- Component test renders empty and populated states.

#### Step 21: Build The Pulse heatmap

Estimate: 30 minutes  
Dependencies: Step 19

Files to touch:

- `src/features/dashboard/components/ThePulse.tsx`
- `src/features/dashboard/services/pulse-service.ts`

Changes:

- Render session heatmap from local `reading_sessions`.

Verification:

- Unit tests map sessions to day intensities.

#### Step 22: Build Home dashboard screen

Estimate: 30 minutes  
Dependencies: Steps 20-21

Files to touch:

- `app/(tabs)/index.tsx`
- `src/features/dashboard/screens/HomeScreen.tsx`
- `src/features/dashboard/components/VelocityStats.tsx`

Changes:

- Compose The Stack, The Pulse, velocity stats, and add-book CTA.

Verification:

- Manual with empty and seeded data.
- Component smoke test renders dashboard.

### PR 4: Shelves, tags, and archive

#### Step 23: Add system shelf definitions

Estimate: 20 minutes  
Dependencies: PR 3

Files to touch:

- `src/features/shelves/system-shelves.ts`
- `src/features/shelves/services/system-shelf-service.ts`

Changes:

- Define Reading, Finished, Want To Read, Not Yet, Changed You as derived/system shelves.

Verification:

- Unit tests for each system shelf query/filter.

#### Step 24: Build shelf list screen

Estimate: 30 minutes  
Dependencies: Step 23

Files to touch:

- `app/(tabs)/shelves.tsx`
- `src/features/shelves/screens/ShelvesScreen.tsx`
- `src/features/shelves/components/ShelfListItem.tsx`

Changes:

- Render system + custom shelves with counts.

Verification:

- Empty custom shelves still show system shelves.

#### Step 25: Add create/edit custom shelf flow

Estimate: 30 minutes  
Dependencies: Step 24

Files to touch:

- `src/features/shelves/components/ShelfForm.tsx`
- `src/features/shelves/hooks/use-save-shelf.ts`

Changes:

- Create/edit shelf name/description/sortOrder.

Verification:

- Component test validates required name.

#### Step 26: Add inside shelf route and views

Estimate: 30 minutes  
Dependencies: Step 25

Files to touch:

- `app/shelves/[id].tsx`
- `src/features/shelves/screens/ShelfDetailScreen.tsx`
- `src/features/shelves/components/ShelfGridView.tsx`
- `src/features/shelves/components/ShelfListView.tsx`
- `src/features/shelves/components/ShelfSpineView.tsx`

Changes:

- Support grid/list/spine view modes with persisted preference.

Verification:

- Manual switch view mode and restart app.

#### Step 27: Add add/remove/pin book in shelf

Estimate: 30 minutes  
Dependencies: Step 26

Files to touch:

- `src/features/shelves/repositories/shelf-books-repository.ts`
- `src/features/shelves/components/AddBookToShelfSheet.tsx`

Changes:

- Manage `shelf_books`, pinnedAt, addedAt.

Verification:

- Duplicate book cannot be added twice.

#### Step 28: Add tags support

Estimate: 25 minutes  
Dependencies: Step 16

Files to touch:

- `src/features/tags/repositories/tags-repository.ts`
- `src/features/tags/components/TagPicker.tsx`
- `src/features/books/components/BookForm.tsx`

Changes:

- Add tags to book create/edit.

Verification:

- Unit tests for tag normalization and duplicate prevention.

#### Step 29: Add archive wall

Estimate: 30 minutes  
Dependencies: Step 24

Files to touch:

- `src/features/shelves/components/ArchiveWall.tsx`
- `src/features/shelves/screens/ShelvesScreen.tsx`

Changes:

- Visual spine/grid wall for finished/archive view.

Verification:

- Manual with 0, 5, 100+ books.

### PR 5: Camera, barcode, Open Library, OCR quote capture

#### Step 30: Add centralized permission adapter

Estimate: 25 minutes  
Dependencies: PR 1

Files to touch:

- `src/lib/permissions/permissions-service.ts`
- `src/lib/permissions/PermissionGate.tsx`

Changes:

- Model unknown/granted/denied/blocked states.
- Provide Settings deep link helper.

Verification:

- Unit tests cover permission state mapping.

#### Step 31: Add barcode scan route with `expo-camera`

Estimate: 30 minutes  
Dependencies: Step 30

Files to touch:

- `app/scan/index.tsx`
- `src/features/books/screens/BarcodeScanScreen.tsx`
- `src/features/books/services/isbn-service.ts`

Changes:

- Use `CameraView` with EAN-13/ISBN barcode settings.
- Debounce repeated scans.

Verification:

- Real-device test scans ISBN.
- Denied camera permission shows manual entry fallback.

#### Step 32: Add optional Open Library client

Estimate: 30 minutes  
Dependencies: Step 31

Files to touch:

- `src/features/open-library/open-library-client.ts`
- `src/features/open-library/open-library-mapper.ts`
- `src/features/open-library/open-library-cache.ts`

Changes:

- Add fetch with timeout, no user ID, graceful offline failure.
- Cache successful responses locally if desired.

Verification:

- Unit tests mock network success/timeout/offline.

#### Step 33: Connect ISBN scan to editable book draft

Estimate: 25 minutes  
Dependencies: Steps 31-32

Files to touch:

- `src/features/books/screens/BarcodeScanScreen.tsx`
- `src/features/books/components/BookForm.tsx`

Changes:

- Populate draft from Open Library when available.
- User confirms before save.

Verification:

- Airplane mode: scanned ISBN still opens manual draft.

#### Step 34: OCR feasibility spike behind adapter

Estimate: 30 minutes  
Dependencies: Step 30

Files to touch:

- `src/features/quotes/services/ocr-service.ts`
- `src/features/quotes/services/ocr-service.native.ts` if needed
- `docs/design/ocr-spike-notes.md`

Changes:

- Validate `tesseract.js` loading, local language data, and recognition on a real device.
- Measure bundle size, memory, recognition time.

Verification:

- Real-device proof: image -> text or documented fallback decision.

#### Step 35: Add quote capture UI with manual fallback

Estimate: 30 minutes  
Dependencies: Step 34

Files to touch:

- `src/features/quotes/screens/QuoteCaptureScreen.tsx`
- `src/features/quotes/components/ManualQuoteForm.tsx`
- `src/features/quotes/repositories/quotes-repository.ts`

Changes:

- Capture/import image, run OCR if available, or enter manually.

Verification:

- Manual quote can be saved without OCR.

#### Step 36: Add extracted lines picker

Estimate: 30 minutes  
Dependencies: Step 35

Files to touch:

- `src/features/quotes/components/ExtractedLinesPicker.tsx`
- `src/features/quotes/services/ocr-line-parser.ts`

Changes:

- Split OCR text into selectable lines and clean whitespace.

Verification:

- Unit tests parse common OCR noise cases.

### PR 6: Share card system

#### Step 37: Define share card registry and view models

Estimate: 25 minutes  
Dependencies: PR 3

Files to touch:

- `src/features/share-cards/share-card-types.ts`
- `src/features/share-cards/share-card-registry.ts`
- `src/features/share-cards/services/share-card-view-models.ts`

Changes:

- Register all 11 card types with required params/data loaders.

Verification:

- Unit tests assert every card type has a loader and title.

#### Step 38: Add share preview route

Estimate: 30 minutes  
Dependencies: Step 37

Files to touch:

- `app/share/[cardType].tsx`
- `src/features/share-cards/screens/SharePreviewScreen.tsx`

Changes:

- Validate `cardType` route param and load local data only.

Verification:

- Invalid card type shows safe error state.

#### Step 39: Build base card canvas component

Estimate: 30 minutes  
Dependencies: Step 38

Files to touch:

- `src/features/share-cards/components/ShareCardCanvas.tsx`
- `src/features/share-cards/card-tokens.ts`

Changes:

- Fixed export dimensions, safe padding, local font loading.

Verification:

- Manual preview matches expected aspect ratio.

#### Step 40: Implement first three card layouts

Estimate: 30 minutes  
Dependencies: Step 39

Files to touch:

- `src/features/share-cards/components/cards/SingleBookCard.tsx`
- `src/features/share-cards/components/cards/QuoteCard.tsx`

Changes:

- Single in-progress, single finished, quote/OCR line cards.

Verification:

- Component tests render with missing cover/long title/long quote.

#### Step 41: Implement remaining card layouts in batches

Estimate: 30 minutes per batch  
Dependencies: Step 40

Files to touch:

- `src/features/share-cards/components/cards/*.tsx`

Changes:

- Batch A: shelf, latest read, weekly activity.
- Batch B: monthly wrapped, yearly wrapped, Book DNA.
- Batch C: post-read debrief, archive wall.

Verification:

- Story fixtures render each card without overflow.

#### Step 42: Add PNG capture/export service

Estimate: 30 minutes  
Dependencies: Step 39

Files to touch:

- `src/features/share-cards/services/share-export-service.ts`
- `src/lib/files/export-files.ts`

Changes:

- Use `react-native-view-shot` `captureRef`.
- Save temp PNG under app exports directory.

Verification:

- Real-device export creates PNG file.

#### Step 43: Add native share/save actions

Estimate: 25 minutes  
Dependencies: Step 42

Files to touch:

- `src/features/share-cards/components/ShareActions.tsx`
- `src/lib/permissions/media-library-permission.ts`

Changes:

- Share via `expo-sharing`.
- Save to camera roll via `expo-media-library` with just-in-time permission.

Verification:

- iOS and Android share sheet opens.
- Denied photo permission does not block share sheet.

### PR 7: Profile, notifications, settings, import/export

#### Step 44: Build profile stats screen

Estimate: 30 minutes  
Dependencies: PR 3

Files to touch:

- `app/(tabs)/profile.tsx`
- `src/features/profile/screens/ProfileScreen.tsx`
- `src/features/profile/services/profile-stats-service.ts`

Changes:

- Show books, pages, share streak, changed-me count, factual stats only.

Verification:

- Unit tests for profile stats fixtures.

#### Step 45: Build settings storage hooks

Estimate: 25 minutes  
Dependencies: PR 2

Files to touch:

- `src/features/settings/hooks/use-setting.ts`
- `src/features/settings/settings-keys.ts`
- `src/features/settings/repositories/settings-repository.ts`

Changes:

- Read/write typed `app_settings` values.

Verification:

- Unit tests parse booleans/integers/time strings safely.

#### Step 46: Add local notification scheduler

Estimate: 30 minutes  
Dependencies: Step 45

Files to touch:

- `src/features/notifications/notification-scheduler.ts`
- `src/features/notifications/notification-types.ts`
- `app/_layout.tsx`

Changes:

- Configure notification handler.
- Create Android channel.
- Schedule local daily share/read reminders.
- Do not call push token APIs.

Verification:

- Real-device schedule fires local notification.

#### Step 47: Add notification settings UI

Estimate: 25 minutes  
Dependencies: Step 46

Files to touch:

- `app/settings.tsx`
- `src/features/settings/screens/SettingsScreen.tsx`
- `src/features/notifications/components/NotificationSettings.tsx`

Changes:

- Enable/disable share streak and read reminders.
- Pick local times.

Verification:

- Toggle updates settings and reschedules notifications.

#### Step 48: Add notification response handling and share prompt modal

Estimate: 30 minutes  
Dependencies: Step 46

Files to touch:

- `app/(modals)/share-prompt.tsx`
- `src/features/notifications/notification-response-handler.ts`
- `src/features/notifications/repositories/notifications-log-repository.ts`

Changes:

- On tap, route to full-screen prompt.
- Log tappedAt/isRead locally.

Verification:

- Tap local notification opens prompt.

#### Step 49: Add Reading Wrapped local generator

Estimate: 30 minutes  
Dependencies: Steps 19 and 37

Files to touch:

- `src/features/profile/services/wrapped-service.ts`
- `src/features/share-cards/components/cards/WrappedCard.tsx`

Changes:

- Generate factual monthly/yearly stats only, no prose/AI.

Verification:

- Unit tests for empty year, partial year, timezone boundaries.

#### Step 50: Add Annual Book Passport PDF export

Estimate: 30 minutes  
Dependencies: Step 44

Files to touch:

- `src/features/profile/services/passport-pdf-service.ts`
- `src/features/profile/components/PassportExportButton.tsx`

Changes:

- Generate local PDF using `expo-print`.

Verification:

- Real-device PDF generation and share works offline.

#### Step 51: Add JSON export manifest

Estimate: 30 minutes  
Dependencies: PR 2

Files to touch:

- `src/features/import-export/export-manifest.ts`
- `src/features/import-export/export-service.ts`
- `src/features/import-export/export-schema.ts`

Changes:

- Export DB rows and relative file references in versioned payload.

Verification:

- Unit test validates exported payload shape.

#### Step 52: Add import validation and dry-run summary

Estimate: 30 minutes  
Dependencies: Step 51

Files to touch:

- `src/features/import-export/import-service.ts`
- `src/features/import-export/import-conflicts.ts`

Changes:

- Validate schema, detect conflicts, produce summary before writing.

Verification:

- Tests cover invalid version, missing image, duplicate IDs.

#### Step 53: Add import/export settings UI

Estimate: 25 minutes  
Dependencies: Steps 51-52

Files to touch:

- `src/features/settings/components/DataManagementSection.tsx`
- `src/features/settings/screens/SettingsScreen.tsx`

Changes:

- Buttons for export, import, and export location share.

Verification:

- Manual export/import on simulator and real device.

### PR 8: iCloud adapter, polish, release readiness

#### Step 54: Add sync adapter interface

Estimate: 20 minutes  
Dependencies: Step 51

Files to touch:

- `src/features/sync/sync-adapter.ts`
- `src/features/sync/noop-sync-adapter.ts`
- `src/features/sync/icloud-drive-sync-adapter.ts`

Changes:

- Define capability-based interface: available, backup, restore, lastSyncedAt.

Verification:

- Unit tests for unavailable/noop states.

#### Step 55: Implement user-driven iCloud Drive backup path

Estimate: 30 minutes  
Dependencies: Step 54

Files to touch:

- `src/features/sync/icloud-drive-sync-adapter.ios.ts`
- `src/features/settings/components/ICloudSyncSection.tsx`

Changes:

- On iOS, export package through Files/share flow so user can choose iCloud Drive.
- Show Android unavailable explanation.

Verification:

- Real iOS device can save backup to iCloud Drive manually.

#### Step 56: Spike automatic iCloud feasibility

Estimate: 30 minutes initial research block  
Dependencies: Step 54

Files to touch:

- `docs/design/icloud-sync-spike.md`
- `app.config.ts` if entitlements are tested

Changes:

- Determine required entitlements/config plugin/native module.
- Decide whether automatic iCloud is v1 or post-v1.

Verification:

- Documented decision with proof or blocker.

#### Step 57: Add performance pass for lists and images

Estimate: 30 minutes  
Dependencies: Core UI complete

Files to touch:

- `src/features/dashboard/components/TheStack.tsx`
- `src/features/shelves/components/*.tsx`
- `src/features/share-cards/components/*.tsx`

Changes:

- Use virtualized lists where needed.
- Memoize heavy derived view models.
- Ensure cover images use efficient loading/caching.

Verification:

- Test seeded 1,000 and 5,000 book libraries on device.

#### Step 58: Add accessibility pass

Estimate: 30 minutes per screen group  
Dependencies: Core UI complete

Files to touch:

- `src/ui/*`
- `src/features/**/components/*.tsx`

Changes:

- Labels, roles, focus order, dynamic type checks, touch target sizes.

Verification:

- VoiceOver/TalkBack smoke for add book, dashboard, share export.

#### Step 59: Add E2E smoke suite

Estimate: 30 minutes per flow  
Dependencies: Core UI complete

Files to touch:

- `.maestro/*.yaml` or `e2e/*.yaml`
- `package.json`

Changes:

- Add critical flows: add book offline, add session, finish book, share card, export data.

Verification:

- E2E runs locally against simulator/emulator.

#### Step 60: Configure EAS build profiles

Estimate: 25 minutes  
Dependencies: PR 1 and native deps known

Files to touch:

- `eas.json`
- `app.config.ts`

Changes:

- Add development, preview/internal, production build profiles.
- Add permission usage strings.
- Ensure no push credentials needed for local notifications.

Verification:

- `eas build --profile preview --platform ios/android` config validates.

#### Step 61: Privacy labels and app store metadata

Estimate: 30 minutes  
Dependencies: Feature scope finalized

Files to touch:

- `docs/release/privacy.md`
- `app.config.ts`

Changes:

- Document no data collection.
- List only actual permissions: camera, photos/media, notifications.
- Document optional Open Library lookup.

Verification:

- App Store privacy answers match implementation.

#### Step 62: Release candidate QA checklist

Estimate: 30 minutes to create; repeated during QA

Dependencies: Feature complete

Files to touch:

- `docs/release/qa-checklist.md`

Changes:

- Device matrix, offline scenarios, import/export, migration, permissions, large library tests.

Verification:

- Checklist executed for RC builds.

## 8. Test plan

### Unit tests

Use Jest Expo for TypeScript/domain logic:

- Stats calculations:
  - streaks across timezone/daylight-saving boundaries.
  - top genres with ties.
  - fastest read with missing start/finish dates.
  - changed-me counts.
- Schema input validation:
  - invalid status/mood/source.
  - negative page count/duration.
  - invalid notification time.
- Import/export validation:
  - version mismatch.
  - missing required fields.
  - duplicate IDs.
  - missing referenced images.
- OCR line parser:
  - blank lines.
  - hyphenated line breaks.
  - confidence/noise filtering if confidence is available.
- Share card view models:
  - missing cover.
  - long title/author.
  - empty data.
  - factual wrapped stats only.

### Component tests

Use React Native Testing Library:

- Book form create/edit and validation.
- Empty Home dashboard.
- The Stack populated state.
- Permission denied states for scan/OCR/save-to-library.
- Settings toggles update visible state.
- Share preview error for invalid card type.

### Integration tests

- SQLite migration creates all tables/indexes.
- Repository transactions for finish-book and import.
- Export then import round trip into a clean DB.
- Notification scheduling adapter with Expo APIs mocked.
- Open Library client with MSW/fetch mock for success, timeout, offline.

### E2E tests

Use Maestro unless the team has a strong Detox preference:

- First run -> add manual book offline -> see it in The Stack.
- Add reading session -> The Pulse updates.
- Finish book -> debrief saved -> profile changed-me count updates.
- Create custom shelf -> add book -> switch grid/list/spine.
- Create quote manually -> generate quote card -> share sheet opens.
- Export data -> import into clean install test profile.

### Real-device manual tests

- Camera barcode scanning on at least one iPhone and one Android device.
- Local notification delivery and tap routing on real devices.
- Share card save/share on iOS and Android.
- OCR performance and failure handling on lower-end Android.
- iCloud Drive backup on iOS if included in v1.

### Regression tests

- Every future bug gets a failing regression test first.
- Every schema migration gets an upgrade test from previous `user_version`.
- Every export schema change gets backwards compatibility tests.

### Fixtures/mocks strategy

- Use fixed clock helpers for all date/streak tests.
- Use seeded SQLite fixtures for dashboard/profile/shelves.
- Mock network; no real Open Library calls in unit/component tests.
- Mock Expo permissions and notifications at adapter boundaries.
- Keep share card story fixtures for visual review.

## 9. Rollout & rollback plan

### Development rollout

1. Local simulator builds during PR work.
2. Expo development build/custom dev client once native module risks appear.
3. Internal EAS preview builds for iOS/Android QA.
4. TestFlight and Google Play internal testing.
5. Phased App Store/Play rollout.

### Feature rollout

- Phase features behind local-only capability flags in `app_settings` or compile-time dev flags where needed.
- Ship core logging/dashboard before OCR/iCloud if those risks threaten release quality.
- Keep Open Library optional from day one.
- Treat automatic iCloud as separately releasable unless feasibility is proven early.

### Data migration rollout

- v1 starts with schema version 1.
- Future migrations are additive first.
- Run migrations at DB provider initialization.
- If a migration fails, show a recovery screen with export diagnostics and support instructions. Do not wipe data.

### Rollback

- App binary rollback: submit previous stable build through App Store/Play if needed.
- Feature rollback: disable risky UI entry points locally when possible.
- Schema rollback: do not downgrade destructive schema. New versions must tolerate old optional columns/tables.
- OCR rollback: route users to manual quote entry.
- Open Library rollback: disable remote lookup; manual book entry remains functional.
- Notification rollback: cancel scheduled local notifications and keep settings data.
- iCloud rollback: leave local data untouched; disable sync adapter and keep manual export/import.

### Observability without tracking

- No remote analytics by default.
- Add a local diagnostics screen in Settings for:
  - app version/build.
  - DB schema version.
  - counts of books/sessions/quotes.
  - last export/import timestamp.
  - last notification schedule result.
- Allow user-initiated “Export diagnostics” that contains no book text by default unless user explicitly includes data.

### Performance budgets

- Dashboard query + view model: < 500 ms at 5,000 books / 50,000 sessions.
- Book detail query: < 150 ms at 1,000 quotes/sessions for that book.
- Share PNG generation: < 3 s normal, < 8 s archive/wrapped.
- OCR: show progress immediately; allow cancel; no UI thread freeze over 100 ms.
- App database migration v1: < 2 s on clean install.

## 10. Risks & mitigations

### Risk: `tesseract.js` may not be viable in Expo React Native

Why it matters:

- Tesseract.js relies on WASM/worker assets and can be heavy for mobile.
- It may require custom bundling or may be too slow on low-end devices.

Mitigation:

- Spike OCR before building full quote UI.
- Keep manual quote entry first-class.
- Isolate OCR behind `OcrService` so native OCR can replace it later.
- Bundle language data locally if using Tesseract to preserve offline behavior.

### Risk: Automatic iCloud sync is more complex than product wording suggests

Why it matters:

- Expo managed apps do not make CloudKit-style sync trivial.
- Conflict resolution for SQLite + images is non-trivial.

Mitigation:

- Ship robust export/import first.
- Provide iCloud Drive backup on iOS via user-driven Files/share flow if accepted.
- Treat automatic iCloud sync as a separate adapter and milestone.
- Define conflict rules before enabling automatic sync.

### Risk: Local SQLite queries become slow with large libraries

Mitigation:

- Add indexes based on dashboard/detail/shelf query patterns.
- Keep expensive stats in pure services and memoize/calculate incrementally if needed.
- Add seeded performance tests early.

### Risk: Share card rendering differs across devices

Mitigation:

- Use fixed export dimensions and bundled fonts.
- Keep card components separate from responsive screen UI.
- Test on iOS and Android real devices.
- Add card fixtures for long/missing data.

### Risk: Permissions cause bad first-run UX

Mitigation:

- Request just-in-time only.
- Always offer manual fallback for camera/OCR/photos.
- Centralize permission state and Settings deep links.

### Risk: Privacy drift through convenience SDKs

Mitigation:

- Dependency review gate: reject SDKs that send analytics/user data by default.
- No push token registration.
- No account identifiers.
- App Store privacy labels generated from actual code dependencies.

### Risk: Import/export can corrupt local data

Mitigation:

- Validate import package before writes.
- Use transactions.
- Copy files before DB commit or use a rollback cleanup plan.
- Default to merge/skip, not destructive replace.

### Risk: Figma metadata is available but full design context is incomplete

Mitigation:

- Treat the Figma MCP metadata as authoritative for screen inventory, route/component mapping, labels, and layout hierarchy.
- Do a second visual-polish pass after enabling an allowed asset-write directory in Figma Dev Mode MCP so `get_design_context` can return reference code, screenshot context, and assets.
- Keep all inferred colors/spacing/type values centralized in tokens so visual corrections are localized.
- Use the 9 top-level frame IDs as regression references and do not add routes for duplicate/variant frames unless product confirms they are distinct states.

## 11. Open questions

1. Is manual iCloud Drive backup/import acceptable for v1, or is automatic cross-device iCloud sync required at launch?
2. Should Android receive a parallel cloud backup option, or is JSON export/import sufficient?
3. Should the Figma file `2js5xldlkB09Q3oQXtfN2n` be treated as the final v1 visual source of truth, or are additional frames/states still expected?
4. What are the exact app identifiers, display name, icon, splash screen, and font choices?
5. What minimum OS versions should be supported for iOS and Android?
6. Is OCR required in v1 if `tesseract.js` proves too slow/unreliable, or can manual quote capture ship first?
7. Should Open Library cover images be cached permanently, and should the export include those cached covers?
8. What conflict behavior should import use when an incoming book ID already exists with local edits?
9. Should local diagnostics include book titles/counts by default, or require explicit user consent for any content export?
10. Are Expo Application Services acceptable for build/submission if the production app itself has no backend dependency?
11. Can the repo path `/Users/danilo/repos/inki` be added to Figma Dev Mode MCP allowed directories so `get_design_context` can return complete reference-code/style context without errors?
