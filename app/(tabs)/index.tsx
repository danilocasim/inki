import type { ReactElement } from "react";
import { useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { DashboardScreen } from "../../src/features/dashboard/DashboardScreen";
import { useDashboardData } from "../../src/features/dashboard/hooks/use-dashboard-data";
import { togglePin } from "../../src/features/books/repositories/books-repository";
import { ShelfPicker, type ShelfPickerHandle } from "../../src/features/shelves/ShelfPicker";

export default function HomeRoute(): ReactElement {
  const router = useRouter();
  const db = useSQLiteContext();
  const { data, loading, reload } = useDashboardData();
  const shelfPickerRef = useRef<ShelfPickerHandle>(null);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const handlePin = async (bookId: string): Promise<void> => {
    try {
      await togglePin(db, bookId);
      await reload();
    } catch {
      Alert.alert("Unable to update pin.");
    }
  };

  return (
    <>
      <DashboardScreen
        data={data}
        loading={loading}
        onAddBook={() => router.push("/(modals)/log-book")}
        onOpenBook={(bookId) => router.push({ pathname: "/book/[id]", params: { id: bookId } })}
        onOpenNotifications={() => router.push("/notifications")}
        onPinBook={(book) => void handlePin(book.id)}
        onShareBook={(book) =>
          router.push({
            pathname: "/share/book/[id]",
            params: { id: book.id },
          })
        }
        onShelveBook={(book) => shelfPickerRef.current?.present(book.id)}
      />
      <ShelfPicker onChange={() => void reload()} ref={shelfPickerRef} />
    </>
  );
}
