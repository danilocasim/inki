import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { BarcodeScanScreen } from "../../src/features/books/screens/BarcodeScanScreen";

export default function BarcodeCaptureRoute(): ReactElement {
  const router = useRouter();

  return (
    <BarcodeScanScreen
      onIsbnScanned={(isbn) =>
        router.replace({ pathname: "/(modals)/log-book", params: { isbn, source: "isbn-scan" } })
      }
      onManualFallback={() => router.push("/(modals)/log-book")}
    />
  );
}
