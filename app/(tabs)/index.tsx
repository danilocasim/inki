import type { ReactElement } from "react";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

import { DashboardScreen } from "../../src/features/dashboard/DashboardScreen";
import { useDashboardData } from "../../src/features/dashboard/hooks/use-dashboard-data";

export default function HomeRoute(): ReactElement {
  const router = useRouter();
  const { data, loading, reload } = useDashboardData();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return (
    <DashboardScreen
      data={data}
      loading={loading}
      onAddBook={() => router.push("/(modals)/log-book")}
      onOpenBook={(bookId) => router.push({ pathname: "/book/[id]", params: { id: bookId } })}
    />
  );
}
