import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { QuoteCaptureScreen } from "../../src/features/quotes/screens/QuoteCaptureScreen";

export default function PageCaptureRoute(): ReactElement {
  const router = useRouter();

  return <QuoteCaptureScreen onDone={() => router.back()} />;
}
