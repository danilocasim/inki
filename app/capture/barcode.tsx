import type { ReactElement } from "react";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { BarcodeScanScreen } from "../../src/features/books/screens/BarcodeScanScreen";
import { lookupOpenLibraryBookByIsbn } from "../../src/features/open-library";

export default function BarcodeCaptureRoute(): ReactElement {
  const db = useSQLiteContext();
  const router = useRouter();

  return (
    <BarcodeScanScreen
      onIsbnScanned={(isbn) => {
        void openDraftFromIsbn(db, router.replace, isbn);
      }}
      onManualFallback={() => router.push("/(modals)/log-book")}
    />
  );
}

async function openDraftFromIsbn(
  db: ReturnType<typeof useSQLiteContext>,
  replace: ReturnType<typeof useRouter>["replace"],
  isbn: string
): Promise<void> {
  const draft = await lookupOpenLibraryBookByIsbn(db, isbn).catch(() => undefined);
  const params: Record<string, string> = {
    isbn,
    source: "isbn-scan",
    status: "want-to-read"
  };

  if (draft?.title) {
    params.title = draft.title;
  }

  if (draft?.author) {
    params.author = draft.author;
  }

  if (draft?.genre) {
    params.genre = draft.genre;
  }

  replace({ pathname: "/(modals)/log-book", params });
}
