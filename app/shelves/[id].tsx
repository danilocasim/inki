import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { isShelfView, type ShelfView } from "../../src/features/dashboard/fixtures";
import { createSettingsRepository } from "../../src/features/settings/repositories/settings-repository";
import type { Book } from "../../src/features/books/types";
import { useShelfDetail } from "../../src/features/shelves/hooks/use-shelf-detail";
import {
  addBookToShelf,
  deleteShelf,
  listBooksNotInShelf,
  removeBookFromShelf,
  updateShelf,
} from "../../src/features/shelves/repositories/shelves-repository";
import { ShelfDetailScreen } from "../../src/features/shelves/ShelfDetailScreen";
import type { UpdateShelfInput } from "../../src/features/shelves/types";
import { EmptyState } from "../../src/ui/EmptyState";
import { Screen } from "../../src/ui/Screen";

export default function ShelfDetailRoute(): ReactElement {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[]; view?: string | string[] }>();
  const shelfId = firstParam(params.id);
  const routeView = resolveShelfView(firstParam(params.view));
  const [view, setView] = useState<ShelfView>(routeView);

  useEffect(() => {
    setView(routeView);
  }, [routeView]);

  if (!shelfId) {
    return (
      <Screen title="shelf">
        <EmptyState message="Choose a local shelf from the Shelf tab." title="No shelf selected" />
      </Screen>
    );
  }

  return (
    <ShelfDetailContainer
      onAddBook={() => router.push({ pathname: "/(modals)/log-book", params: { shelfId } })}
      onOpenBook={(bookId) => router.push({ pathname: "/book/[id]", params: { id: bookId } })}
      onShareShelf={() =>
        router.push({
          pathname: "/share/[cardType]",
          params: { cardType: "shelf-wall", sourceId: shelfId },
        })
      }
      onViewChange={(nextView) => {
        setView(nextView);
        router.setParams({ view: nextView });
        void createSettingsRepository(db).set(`shelfView.${shelfId}`, nextView);
      }}
      shelfId={shelfId}
      view={view}
    />
  );
}

function ShelfDetailContainer({
  onAddBook,
  onOpenBook,
  onShareShelf,
  onViewChange,
  shelfId,
  view,
}: {
  onAddBook: () => void;
  onOpenBook: (bookId: string) => void;
  onShareShelf: () => void;
  onViewChange: (view: ShelfView) => void;
  shelfId: string;
  view: ShelfView;
}): ReactElement {
  const db = useSQLiteContext();
  const router = useRouter();
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const { reload, shelf } = useShelfDetail(shelfId);

  const reloadAvailableBooks = useCallback(async (): Promise<void> => {
    setAvailableBooks(await listBooksNotInShelf(db, shelfId));
  }, [db, shelfId]);

  const reloadAll = useCallback(async (): Promise<void> => {
    await Promise.all([reload(), reloadAvailableBooks()]);
  }, [reload, reloadAvailableBooks]);

  useFocusEffect(
    useCallback(() => {
      void reloadAll();
    }, [reloadAll]),
  );

  const handleUpdateShelf = async (input: UpdateShelfInput): Promise<void> => {
    await updateShelf(db, shelfId, input);
    await reloadAll();
  };

  const handleAddExistingBook = async (bookId: string): Promise<void> => {
    await addBookToShelf(db, shelfId, bookId);
    await reloadAll();
  };

  const handleRemoveBook = async (bookId: string): Promise<void> => {
    await removeBookFromShelf(db, shelfId, bookId);
    await reloadAll();
  };

  const handleDeleteShelf = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      Alert.alert("Delete shelf?", "Books stay in your library, but this shelf is removed.", [
        { style: "cancel", text: "Cancel", onPress: () => resolve() },
        {
          style: "destructive",
          text: "Delete",
          onPress: () => {
            deleteShelf(db, shelfId)
              .then(() => {
                router.replace("/(tabs)/shelves");
                resolve();
              })
              .catch(reject);
          },
        },
      ]);
    });
  };

  return (
    <ShelfDetailScreen
      availableBooks={availableBooks}
      onAddExistingBook={handleAddExistingBook}
      onAddBook={onAddBook}
      onDeleteShelf={handleDeleteShelf}
      onOpenBook={onOpenBook}
      onRemoveBook={handleRemoveBook}
      onShareShelf={onShareShelf}
      onUpdateShelf={handleUpdateShelf}
      onViewChange={onViewChange}
      shelf={shelf}
      shelfId={shelfId}
      view={view}
    />
  );
}

const firstParam = (value: string | readonly string[] | undefined): string | undefined =>
  typeof value === "string" ? value : value?.[0];

const resolveShelfView = (value: string | undefined): ShelfView =>
  isShelfView(value) ? value : "grid";
