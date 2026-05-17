# Requirements Document

## Introduction

This feature integrates the Inki mobile app with a user-owned Jelu instance — a self-hosted book tracking server. The integration is entirely opt-in: users who have not configured a Jelu server see no change in the UI. For users who do configure one, the integration provides eight capabilities: connection setup and credential management, pushing local books to Jelu, importing books from Jelu into Inki, enriching book metadata via Jelu's search API, silently syncing reading progress in the background, syncing quotes, mapping shelves to Jelu tags, and a placeholder for future review sync.

All Jelu operations are fire-and-forget from the perspective of local data: the local SQLite database is always the source of truth, and any Jelu call failure must never block or corrupt a local operation.

## Glossary

- **Inki**: The mobile reading-tracker app this spec describes.
- **Jelu**: A self-hosted book tracking server exposing a REST API at `/api/v1`. The preferred authentication method is API token (Bearer). Basic Auth is supported as a fallback for older instances.
- **JeluApiClient**: The service class in `src/features/sync/` that encapsulates all HTTP calls to the Jelu REST API.
- **JeluCredentials**: The set of values required to reach a Jelu instance — `baseUrl` and `apiToken`. Basic Auth credentials (`username` and `password`) are stored as an optional fallback for older Jelu instances that do not support API tokens.
- **ApiToken**: A secret string created in Jelu Settings → API Tokens, used in the `Authorization: Bearer <token>` header. The full token value is shown only once at creation time.
- **TokenScope**: A fine-grained permission granted to an ApiToken. The scopes relevant to this integration are: `books:read`, `books:write`, `reading:read`, `reading:write`, `metadata:read`, `lists:read`, `lists:write`, `reviews:read`, `reviews:write`.
- **SecureStore**: The `expo-secure-store` device keychain used to persist JeluCredentials. Never plain SQLite.
- **UserBook**: A Jelu record that links a `BookDto` to the current user, carrying reading events and personal metadata (`UserBookDto`).
- **ReadingEvent**: A Jelu record representing a single reading lifecycle entry (`ReadingEventDto`), with an `eventType` of `CURRENTLY_READING`, `FINISHED`, `DROPPED`, or `NONE`.
- **BookStatus**: The Inki reading status enum — `"reading"`, `"recent"`, `"want-to-read"`, `"finished"`, or `"not-yet"`.
- **JeluEventType**: The Jelu reading event type enum — `CURRENTLY_READING`, `FINISHED`, `DROPPED`, or `NONE`.
- **StatusMapping**: The bidirectional translation between BookStatus and JeluEventType defined in this document.
- **Push Sync**: The operation of sending local Inki books to Jelu.
- **Pull Import**: The operation of fetching Jelu UserBooks and creating missing books locally.
- **Metadata Enrichment**: Using Jelu's `/api/v1/search` endpoint to supplement Open Library data during ISBN lookup. Requires the `metadata:read` scope.
- **Progress Sync**: Silently updating a Jelu ReadingEvent's `currentPage` when the user saves reading progress locally.
- **ISBN Match**: Identifying the same book across systems by comparing ISBN-10 or ISBN-13 values. ISBN is the preferred identifier in Jelu — for one ISBN there should be only one entry in the Jelu database.
- **Title+Author Match**: A case-insensitive fallback match on both `title` and `author` when no ISBN is available.
- **jelu_userbook_id**: A `TEXT` column added to the local `books` SQLite table to cache the Jelu UserBook UUID for a book.
- **jelu_event_id**: A `TEXT` column added to the local `books` SQLite table to cache the Jelu ReadingEvent UUID for a book.
- **ConnectionStatus**: One of three states — `connected`, `not_configured`, or `error` — reflecting whether Jelu credentials are stored and reachable.
- **Settings Screen**: The existing `app/settings.tsx` screen where the Jelu Sync section is added.
- **BookDetailScreen**: The existing `src/features/books/screens/BookDetailScreen.tsx` where reading progress is saved.
- **AddBookSheet**: The existing `src/features/books/screens/AddBookSheet.tsx` where ISBN lookup is triggered.
- **JeluQuote**: A Jelu quote record attached to a book, containing `text`, `position` (page number or percentage), and `visibility` (`PRIVATE` or `PUBLIC`).
- **JeluTag**: A free-form string label attached to a Jelu book. Tags are used to build custom lists in Jelu.

---

## Requirements

### Requirement 1: Jelu Credentials Storage

**User Story:** As a user, I want to store my Jelu server URL and API token securely on my device, so that Inki can authenticate with my self-hosted Jelu instance without exposing sensitive credentials in plain storage.

#### Acceptance Criteria

1. THE JeluApiClient SHALL read JeluCredentials exclusively from SecureStore, never from the SQLite `app_settings` table.
2. WHEN the user saves JeluCredentials using an API token, THE SecureStore SHALL persist `baseUrl` and `apiToken` as a single JSON value under a fixed key.
3. WHEN the user saves JeluCredentials using Basic Auth fallback, THE SecureStore SHALL persist `baseUrl`, `username`, and `password` as a single JSON value under the same fixed key.
4. WHEN the user disconnects from Jelu, THE SecureStore SHALL delete the stored JeluCredentials entry.
5. WHEN JeluCredentials are absent from SecureStore, THE JeluApiClient SHALL treat the Jelu integration as not configured and skip all outbound calls.
6. IF SecureStore read or write fails, THEN THE Settings Screen SHALL display a user-friendly error message and leave any previously stored credentials unchanged.
7. THE JeluApiClient SHALL validate that `baseUrl` is a non-empty string before constructing any request URL.
8. WHEN `apiToken` is present in JeluCredentials, THE JeluApiClient SHALL use `Authorization: Bearer <apiToken>` for all requests and SHALL NOT use Basic Auth.
9. WHEN `apiToken` is absent and Basic Auth credentials are present in JeluCredentials, THE JeluApiClient SHALL use `Authorization: Basic base64(username:password)` as a fallback.

---

### Requirement 2: Jelu Connection Setup UI

**User Story:** As a user, I want a dedicated "Jelu Sync" section in the Settings screen, so that I can configure, test, and remove my Jelu connection without leaving the app.

#### Acceptance Criteria

1. THE Settings Screen SHALL render a "Jelu Sync" section containing a field for server URL and a field for API token.
2. THE Settings Screen SHALL display instructional text explaining that the user must create an API token in Jelu Settings → API Tokens and select the following scopes: `books:read`, `books:write`, `reading:read`, `reading:write`, `metadata:read`, `lists:read`, `lists:write`, `reviews:read`, `reviews:write`.
3. THE Settings Screen SHALL display a note that the full token value is shown only once in Jelu at creation time and must be copied before closing the Jelu token dialog.
4. WHEN JeluCredentials are absent from SecureStore, THE Settings Screen SHALL display a ConnectionStatus of `not_configured`.
5. WHEN JeluCredentials are present in SecureStore, THE Settings Screen SHALL display a ConnectionStatus of `connected` or `error` based on the most recent test result.
6. WHEN the user taps "Test Connection", THE JeluApiClient SHALL issue a `GET /api/v1/books?size=1` request using the entered credentials.
7. WHEN the test request returns HTTP 200, THE Settings Screen SHALL display a ConnectionStatus of `connected`.
8. IF the test request returns a non-200 status or a network error, THEN THE Settings Screen SHALL display a ConnectionStatus of `error` with a human-readable description of the failure.
9. WHEN the user taps "Save", THE Settings Screen SHALL persist the entered JeluCredentials to SecureStore.
10. WHEN the user taps "Disconnect", THE Settings Screen SHALL delete JeluCredentials from SecureStore and reset the ConnectionStatus to `not_configured`.
11. WHILE a test request is in flight, THE Settings Screen SHALL disable the "Test Connection" button and show a loading indicator.
12. WHERE the Jelu integration is not configured, THE Settings Screen SHALL hide the "Sync to Jelu", "Import from Jelu", and "Disconnect" controls.
13. WHERE the user prefers Basic Auth over API token (for older Jelu instances), THE Settings Screen SHALL provide an optional "Advanced" section with username and password fields as a fallback authentication method.

---

### Requirement 3: Status Mapping Between Inki and Jelu

**User Story:** As a user, I want my reading status to be translated correctly between Inki and Jelu, so that my library reflects the same state on both systems.

#### Acceptance Criteria

1. THE StatusMapping SHALL translate Inki BookStatus to JeluEventType as follows:
   - `"reading"` → `CURRENTLY_READING`
   - `"finished"` → `FINISHED`
   - `"recent"` → `FINISHED`
   - `"want-to-read"` → `NONE` with `toRead = true`
   - `"not-yet"` → `NONE` with `toRead = false`
2. THE StatusMapping SHALL translate JeluEventType to Inki BookStatus as follows:
   - `CURRENTLY_READING` → `"reading"`
   - `FINISHED` → `"finished"`
   - `DROPPED` → `"recent"`
   - `NONE` with `toRead = true` → `"want-to-read"`
   - `NONE` with `toRead = false` → `"not-yet"`
3. THE StatusMapping SHALL be a pure, side-effect-free function with no dependency on network or storage.
4. FOR ALL valid BookStatus values, applying the Inki-to-Jelu mapping followed by the Jelu-to-Inki mapping SHALL return a BookStatus that is semantically equivalent to the original (round-trip property — note: `"recent"` and `"finished"` both map to `FINISHED`, so both round-trip to `"finished"`).
5. FOR ALL valid JeluEventType values, applying the Jelu-to-Inki mapping followed by the Inki-to-Jelu mapping SHALL return a JeluEventType that is semantically equivalent to the original (round-trip property — note: `NONE` with `toRead = false` round-trips cleanly; `DROPPED` maps to `"recent"` which maps back to `FINISHED`, which is the documented lossy case).
6. IF an unrecognised JeluEventType is received, THEN THE StatusMapping SHALL return `"not-yet"` as the default BookStatus.

---

### Requirement 4: Push Local Books to Jelu

**User Story:** As a user, I want to push my Inki library to my Jelu server, so that my reading history is backed up and visible in Jelu.

#### Acceptance Criteria

1. WHEN the user taps "Sync to Jelu", THE Settings Screen SHALL display a progress indicator for the duration of the sync operation.
2. THE JeluApiClient SHALL attempt to match each local book against Jelu by ISBN Match first, then Title+Author Match as a fallback.
3. WHEN a local book has no matching UserBook in Jelu, THE JeluApiClient SHALL create a new UserBook via `POST /api/v1/userbooks` using the StatusMapping to set the ReadingEvent type.
4. WHEN a local book has a matching UserBook in Jelu, THE JeluApiClient SHALL update the Jelu ReadingEvent type via `PUT /api/v1/readingevents/{id}` to reflect the current Inki BookStatus.
5. WHEN a local book's `currentPage` is greater than zero and the Jelu ReadingEvent type is `CURRENTLY_READING`, THE JeluApiClient SHALL include `currentPage` in the update payload.
6. IF a single book's push operation fails due to a network error or non-2xx response, THEN THE JeluApiClient SHALL record the failure for that book and continue processing the remaining books.
7. WHEN the sync operation completes, THE Settings Screen SHALL display a summary message stating the number of books synced and the number skipped due to errors.
8. WHEN a UserBook is successfully created or matched in Jelu, THE JeluApiClient SHALL cache the Jelu `userbook_id` and `event_id` in the local `books` table columns `jelu_userbook_id` and `jelu_event_id`.
9. IF JeluCredentials are not configured, THEN THE JeluApiClient SHALL not initiate a push sync and SHALL return an error to the caller.
10. THE Push Sync operation SHALL NOT modify, delete, or overwrite any local SQLite book record.

---

### Requirement 5: Pull Books from Jelu into Inki

**User Story:** As a user, I want to import books from my Jelu library into Inki, so that books I've tracked in Jelu appear in my local reading list.

#### Acceptance Criteria

1. WHEN the user taps "Import from Jelu", THE Settings Screen SHALL display a progress indicator for the duration of the import operation.
2. THE JeluApiClient SHALL fetch all UserBooks from Jelu using paginated `GET /api/v1/userbooks` requests until all pages are retrieved.
3. FOR EACH Jelu UserBook, THE JeluApiClient SHALL check whether a local book already exists using ISBN Match first, then Title+Author Match as a fallback.
4. WHEN a Jelu UserBook has no matching local book, THE JeluApiClient SHALL create a new local book record using the StatusMapping to set the Inki BookStatus.
5. WHEN a Jelu UserBook has a matching local book, THE JeluApiClient SHALL skip creation and count the book as "already existed".
6. WHEN a new local book is created from a Jelu UserBook, THE JeluApiClient SHALL populate `title`, `author`, `isbn` (preferring ISBN-13 over ISBN-10), `totalPages`, and `coverPath` from the Jelu `BookDto`.
7. WHEN a new local book is created from a Jelu UserBook, THE JeluApiClient SHALL cache the Jelu `userbook_id` and `event_id` in `jelu_userbook_id` and `jelu_event_id`.
8. IF a single book's import operation fails, THEN THE JeluApiClient SHALL record the failure and continue processing remaining UserBooks.
9. WHEN the import operation completes, THE Settings Screen SHALL display a summary message stating the number of new books imported and the number that already existed.
10. IF JeluCredentials are not configured, THEN THE JeluApiClient SHALL not initiate a pull import and SHALL return an error to the caller.

---

### Requirement 6: Book Matching Logic

**User Story:** As a user, I want Inki to correctly identify when a book already exists in either system, so that sync and import operations do not create duplicates.

#### Acceptance Criteria

1. THE JeluApiClient SHALL perform ISBN Match by comparing the local book's `isbn` field against both `isbn10` and `isbn13` fields of the Jelu `BookDto`, treating the comparison as case-insensitive and trimmed. ISBN is the preferred identifier in Jelu — for one ISBN there should be only one entry in the Jelu database.
2. WHEN an ISBN Match is found, THE JeluApiClient SHALL use that match and skip the Title+Author Match.
3. WHEN no ISBN Match is found, THE JeluApiClient SHALL perform Title+Author Match by comparing both `title` and `author` fields case-insensitively and with leading/trailing whitespace trimmed.
4. WHEN neither ISBN Match nor Title+Author Match finds a result, THE JeluApiClient SHALL treat the book as not present in the target system.
5. THE Book Matching Logic SHALL be a pure function that accepts a local book and a list of candidate Jelu UserBooks and returns the first match or `undefined`.
6. FOR ALL inputs where a book is present in the candidate list, the matching function SHALL return a defined result (no false negatives for exact matches).
7. FOR ALL inputs where no book matches, the matching function SHALL return `undefined` (no false positives).

---

### Requirement 7: Metadata Enrichment via Jelu Search

**User Story:** As a user, I want the Add Book flow to use my Jelu server as an additional metadata source, so that I get richer book details (page count, publisher, series) when adding books by ISBN.

#### Acceptance Criteria

1. WHEN the user triggers an ISBN lookup in AddBookSheet and JeluCredentials are configured, THE JeluApiClient SHALL issue a `GET /api/v1/search?isbn={isbn}` request in parallel with the Open Library lookup. This endpoint requires the `metadata:read` TokenScope.
2. WHEN Jelu returns metadata and Open Library does not return a result, THE AddBookSheet SHALL pre-fill the book form with Jelu's data.
3. WHEN both Jelu and Open Library return metadata, THE AddBookSheet SHALL merge the results by preferring Jelu's value for any field that Open Library leaves empty, and preferring Open Library's value otherwise.
4. WHEN Jelu returns metadata with a non-empty `pageCount`, THE AddBookSheet SHALL populate the `totalPages` field with that value even if Open Library returned a result without page count.
5. IF the Jelu search request fails due to a network error or non-2xx response, THEN THE AddBookSheet SHALL silently fall back to Open Library data only, without displaying an error to the user.
6. IF JeluCredentials are not configured, THEN THE JeluApiClient SHALL skip the Jelu search call entirely and the AddBookSheet SHALL proceed with Open Library only.
7. THE Jelu search call SHALL NOT block the display of the book form — the form SHALL appear with whatever data is available at the time the first source responds.
8. THE metadata merge function SHALL be a pure function accepting an optional Open Library draft and an optional Jelu search result and returning a merged book draft.
9. FOR ALL input combinations of Open Library draft and Jelu result, the merge function SHALL never return `undefined` for `title` or `author` when at least one source provides a non-empty value for that field.

---

### Requirement 8: Reading Progress Sync

**User Story:** As a user, I want my reading progress to be silently synced to Jelu when I save it locally, so that my Jelu library stays up to date without any extra steps.

#### Acceptance Criteria

1. WHEN the user saves reading progress in BookDetailScreen and JeluCredentials are configured, THE JeluApiClient SHALL attempt to update the corresponding Jelu ReadingEvent's `currentPage` via `PUT /api/v1/readingevents/{id}`.
2. THE local progress save SHALL complete and return to the user before the Jelu update is awaited — the Jelu call is fire-and-forget.
3. IF the Jelu progress update fails for any reason, THEN THE JeluApiClient SHALL log the error internally and SHALL NOT surface an error to the user or affect the local save result.
4. WHEN `jelu_event_id` is cached in the local `books` table for the book being updated, THE JeluApiClient SHALL use that cached ID directly in the `PUT` request URL.
5. WHEN `jelu_event_id` is absent for the book being updated, THE JeluApiClient SHALL first attempt to find the book in Jelu by ISBN Match then Title+Author Match, cache the resolved IDs, and then issue the `PUT` request.
6. IF JeluCredentials are not configured, THEN THE JeluApiClient SHALL skip the progress sync call entirely.
7. THE Progress Sync SHALL NOT modify the local `current_page` value — it reads the value already saved by the local operation.

---

### Requirement 9: Local Database Schema Migration

**User Story:** As a developer, I want the local SQLite schema to store Jelu identifiers alongside each book, so that the app can efficiently update Jelu records without repeated search calls.

#### Acceptance Criteria

1. THE Database Migration SHALL add a `jelu_userbook_id TEXT` column to the `books` table with a default value of `NULL`.
2. THE Database Migration SHALL add a `jelu_event_id TEXT` column to the `books` table with a default value of `NULL`.
3. THE Database Migration SHALL be applied as a new versioned migration that does not alter or drop any existing column.
4. WHEN the migration runs on a device with existing book records, THE existing rows SHALL retain all their original column values with `jelu_userbook_id` and `jelu_event_id` set to `NULL`.
5. THE `BooksRepository` `update` method SHALL accept optional `jeluUserbookId` and `jeluEventId` fields and persist them when provided.
6. THE `BooksRepository` `getById` and `list` methods SHALL include `jelu_userbook_id` and `jelu_event_id` in their SELECT output and map them onto the `Book` TypeScript interface.

---

### Requirement 10: JeluApiClient HTTP Layer

**User Story:** As a developer, I want a single `JeluApiClient` service class that encapsulates all Jelu HTTP calls, so that network logic is not scattered across the codebase and is easy to test.

#### Acceptance Criteria

1. THE JeluApiClient SHALL be the sole location in `src/features/sync/` where HTTP requests to the Jelu API are constructed and dispatched.
2. WHEN `apiToken` is present in JeluCredentials, THE JeluApiClient SHALL construct the `Authorization` header as `Bearer <apiToken>` for every request.
3. WHEN `apiToken` is absent and Basic Auth credentials are present, THE JeluApiClient SHALL construct the `Authorization` header using HTTP Basic Auth encoding (`base64(username:password)`) as a fallback.
4. THE JeluApiClient SHALL prepend `baseUrl` to every API path, normalising any trailing slash on `baseUrl` before concatenation.
5. WHEN a Jelu API response has a non-2xx HTTP status code, THE JeluApiClient SHALL throw a typed `JeluApiError` containing the HTTP status code and response body.
6. IF a network request throws a connectivity error (e.g. no internet, DNS failure, timeout), THEN THE JeluApiClient SHALL wrap the error in a `JeluNetworkError` and re-throw it.
7. THE JeluApiClient SHALL expose typed methods for each API operation used by this feature: `testConnection`, `searchBooks`, `createUserBook`, `updateReadingEvent`, `getUserBooks`, `searchMetadata`, `getQuotesForBook`, `createQuote`, `getTagsForBook`, `updateBookTags`.
8. THE JeluApiClient SHALL be constructable from a `JeluCredentials` object with no side effects at construction time.
9. THE URL construction logic (baseUrl normalisation + path concatenation) SHALL be a pure function testable independently of HTTP calls.
10. FOR ALL valid `baseUrl` values with or without a trailing slash, the URL construction function applied to the same path SHALL produce identical output URLs (idempotence of trailing-slash normalisation).

---

### Requirement 11: Offline-First and Error Resilience

**User Story:** As a user, I want Inki to remain fully functional when my Jelu server is unreachable, so that a network outage or misconfiguration never prevents me from using the app.

#### Acceptance Criteria

1. THE JeluApiClient SHALL wrap every outbound call in a try/catch so that no unhandled promise rejection can propagate to the React Native error boundary.
2. WHEN a Jelu call fails during Push Sync or Pull Import, THE Settings Screen SHALL display the partial result summary rather than an unrecoverable error screen.
3. WHILE JeluCredentials are not configured, THE app SHALL render all screens — including BookDetailScreen and AddBookSheet — identically to the state before this feature was introduced.
4. THE local SQLite write for any book or progress update SHALL be committed before any Jelu call is initiated for that same operation.
5. IF all Jelu calls in a Push Sync fail, THEN THE local `books` table SHALL remain unmodified.
6. THE JeluApiClient SHALL apply a request timeout of 15 seconds to each individual HTTP call, after which the call SHALL be treated as a network error.

---

### Requirement 12: Sync Feature Visibility

**User Story:** As a user who does not use Jelu, I want the Jelu Sync feature to be completely invisible to me, so that the app does not feel cluttered with features I don't need.

#### Acceptance Criteria

1. WHILE JeluCredentials are absent from SecureStore, THE Settings Screen SHALL NOT render the "Sync to Jelu", "Import from Jelu", or "Disconnect" buttons.
2. WHILE JeluCredentials are absent from SecureStore, THE BookDetailScreen SHALL NOT display any Jelu-related UI element or status indicator.
3. WHILE JeluCredentials are absent from SecureStore, THE AddBookSheet SHALL NOT display any Jelu-related UI element.
4. THE Jelu Sync section in Settings SHALL be rendered as a collapsed or visually distinct section so that users who have not configured Jelu can easily identify and ignore it.
5. WHERE JeluCredentials are configured, THE Settings Screen SHALL display the ConnectionStatus indicator alongside the server URL (masked) so the user can confirm which server is connected.

---

### Requirement 13: Quotes Sync

**User Story:** As a user, I want my locally captured quotes to be synced to Jelu when I push a book, and Jelu quotes to be pulled into Inki when I import, so that my reading highlights are preserved across both systems.

#### Acceptance Criteria

1. WHEN pushing a book to Jelu and the `lists:write` TokenScope is available, THE JeluApiClient SHALL fetch all local quotes for that book from the `quotes` table and create any missing quotes on Jelu via the quotes API.
2. WHEN pulling a book from Jelu and the `lists:read` TokenScope is available, THE JeluApiClient SHALL fetch all JeluQuotes for that book and create any missing quotes locally in the `quotes` table.
3. THE JeluApiClient SHALL map the local `Quote.text` field to the JeluQuote `text` field and the local `Quote.page` field to the JeluQuote `position` field when pushing.
4. WHEN creating a JeluQuote during push, THE JeluApiClient SHALL set the JeluQuote `visibility` to `PRIVATE`.
5. WHEN creating a local quote from a JeluQuote during pull, THE JeluApiClient SHALL set the local `captureMethod` to `"manual"` and map `position` to `page`.
6. THE JeluApiClient SHALL deduplicate quotes by comparing `text` values case-insensitively and trimmed — a quote with matching text SHALL NOT be created again in the target system.
7. IF the quotes sync step fails for a book, THEN THE JeluApiClient SHALL log the error and continue processing the remaining books without failing the overall sync.
8. WHILE the `lists:read` or `lists:write` TokenScope is not available (e.g. Basic Auth fallback or token without those scopes), THE JeluApiClient SHALL skip quote sync entirely and SHALL NOT surface an error to the user.
9. THE quotes sync operation SHALL NOT delete or modify any existing local quote records.

---

### Requirement 14: Tags and Shelf Mapping

**User Story:** As a user, I want my Inki shelves to be reflected as Jelu tags when I push books, and Jelu tags to be reflected as Inki shelves when I import books, so that my organisational structure is consistent across both systems.

#### Acceptance Criteria

1. WHEN pushing a book to Jelu and the `books:write` TokenScope is available, THE JeluApiClient SHALL fetch all custom shelves the book belongs to via `listShelvesForBook` and include their names as JeluTags in the book's tag list on Jelu.
2. WHEN pulling a book from Jelu and the `books:read` TokenScope is available, THE JeluApiClient SHALL read the JeluTags on the imported book and create any missing Inki shelves by name, then add the book to those shelves.
3. WHEN creating a missing Inki shelf from a JeluTag during pull, THE JeluApiClient SHALL use the JeluTag string as the shelf name and set the shelf kind to `"custom"`.
4. THE JeluApiClient SHALL match shelves to tags by comparing names case-insensitively and trimmed — a shelf or tag with a matching name SHALL NOT be created again.
5. THE tag mapping SHALL only apply to custom shelves — system shelves (kind ≠ `"custom"`) SHALL NOT be pushed as Jelu tags.
6. IF the tag sync step fails for a book, THEN THE JeluApiClient SHALL log the error and continue processing the remaining books without failing the overall sync.
7. THE tags sync operation SHALL NOT delete any existing Jelu tags or Inki shelves — it only adds missing associations.
8. FOR ALL books that belong to at least one custom shelf, pushing then pulling SHALL result in the book belonging to shelves with the same names as before the push (round-trip property — subject to case normalisation).

---

### Requirement 15: Future Review Sync Placeholder

**User Story:** As a user, I want my Jelu API token to already include review scopes so that when Inki adds review sync in a future release, I do not need to create a new token.

#### Acceptance Criteria

1. THE Settings Screen SHALL instruct the user to include `reviews:read` and `reviews:write` scopes when creating their Jelu API token, alongside the other required scopes, so that future review sync can be enabled without requiring a new token.
2. THE JeluApiClient SHALL NOT implement any review read or write operations in this release — review sync is reserved for a future feature.
3. THE JeluApiClient SHALL NOT call any Jelu review endpoints (`/api/v1/reviews`) in this release.
4. WHERE the `reviews:read` or `reviews:write` scopes are present on the token, THE JeluApiClient SHALL silently ignore them — their presence SHALL have no effect on current behaviour.
