import type { ReactElement } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AddBookSheet } from "../../src/features/books/screens/AddBookSheet";

export default function LogBookRoute(): ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ isbn?: string; shelfId?: string; source?: string }>();
  const shelfId = readParam(params.shelfId);

  return (
    <AddBookSheet
      initialIsbn={readParam(params.isbn)}
      initialSource={readParam(params.source)}
      onClose={() => router.back()}
      onScanBarcode={() => router.push("/capture/barcode")}
      onScanQuote={() => router.replace("/capture/page")}
      onSaved={(bookId) => {
        if (shelfId) {
          router.replace({ pathname: "/shelves/[id]", params: { id: shelfId, view: "grid" } });
          return;
        }

        router.replace({ pathname: "/book/[id]", params: { id: bookId } });
      }}
    />
  );
}

const readParam = (value: string | string[] | undefined): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};
