import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { CameraFrameScreen } from "../../src/features/capture/CameraFrameScreen";

export default function PageCaptureRoute(): ReactElement {
  const router = useRouter();

  return (
    <CameraFrameScreen
      caption="Manual quote capture is available first; OCR stays behind an offline adapter until real-device performance is proven."
      label="TEXT"
      onManualFallback={() => router.back()}
      title="scan page"
    />
  );
}
