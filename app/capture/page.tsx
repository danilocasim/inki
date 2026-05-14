import type { ReactElement } from "react";
import { useState } from "react";
import { useRouter } from "expo-router";

import { PageCaptureScreen } from "../../src/features/quotes/screens/PageCaptureScreen";
import { QuoteCaptureScreen } from "../../src/features/quotes/screens/QuoteCaptureScreen";

type Mode = "camera" | "manual";

export default function PageCaptureRoute(): ReactElement {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("camera");
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  if (mode === "manual") {
    return <QuoteCaptureScreen capturedPhotoUri={photoUri} onDone={() => router.back()} />;
  }

  return (
    <PageCaptureScreen
      onBack={() => router.back()}
      onCaptured={(uri) => {
        setPhotoUri(uri);
        setMode("manual");
      }}
      onManualFallback={() => {
        setPhotoUri(undefined);
        setMode("manual");
      }}
    />
  );
}
