import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { CaptureHubScreen } from "../../src/features/capture/CaptureHubScreen";

export default function CaptureRoute(): ReactElement {
  const router = useRouter();

  return (
    <CaptureHubScreen
      onCaptureQuote={() => router.push("/capture/page")}
      onScanIsbn={() => router.push("/capture/barcode")}
    />
  );
}
