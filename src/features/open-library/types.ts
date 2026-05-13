export interface OpenLibraryBookDraft {
  author?: string | undefined;
  genre?: string | undefined;
  isbn: string;
  title?: string | undefined;
}

export interface OpenLibraryCacheRow {
  response_json: string;
}
