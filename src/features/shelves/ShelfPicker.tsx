import type { ReactElement } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetModal as BottomSheetModalType,
} from "@gorhom/bottom-sheet";
import { useSQLiteContext } from "expo-sqlite";

import { Button } from "../../ui/Button";
import { Text } from "../../ui/Text";
import { tokens } from "../../ui/tokens";
import {
  addBookToShelf,
  createShelf,
  listShelves,
  listShelvesForBook,
  removeBookFromShelf,
} from "./repositories/shelves-repository";
import type { Shelf } from "./types";

export interface ShelfPickerHandle {
  present: (bookId: string) => void;
  dismiss: () => void;
}

export interface ShelfPickerProps {
  onChange?: () => void;
}

export const ShelfPicker = forwardRef<ShelfPickerHandle, ShelfPickerProps>(function ShelfPicker(
  { onChange },
  ref,
): ReactElement {
  const db = useSQLiteContext();
  const sheetRef = useRef<BottomSheetModalType>(null);
  const [bookId, setBookId] = useState<string | undefined>();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [memberShelfIds, setMemberShelfIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const snapPoints = useMemo(() => ["55%", "85%"], []);

  const reload = useCallback(
    async (id: string): Promise<void> => {
      try {
        const [all, mine] = await Promise.all([listShelves(db), listShelvesForBook(db, id)]);
        setShelves(all);
        setMemberShelfIds(new Set(mine.map((shelf) => shelf.id)));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to load shelves.");
      }
    },
    [db],
  );

  useImperativeHandle(
    ref,
    () => ({
      present: (id: string) => {
        setBookId(id);
        setError(undefined);
        setMessage(undefined);
        setCreating(false);
        setNewName("");
        void reload(id);
        sheetRef.current?.snapToIndex(0);
      },
      dismiss: () => {
        sheetRef.current?.close();
      },
    }),
    [reload],
  );

  useEffect(() => {
    if (!bookId) return;
    void reload(bookId);
  }, [bookId, reload]);

  const handleToggle = async (shelf: Shelf): Promise<void> => {
    if (!bookId) return;
    setError(undefined);
    const isMember = memberShelfIds.has(shelf.id);
    try {
      if (isMember) {
        await removeBookFromShelf(db, shelf.id, bookId);
        setMessage(`Removed from ${shelf.title}`);
      } else {
        await addBookToShelf(db, shelf.id, bookId);
        setMessage(`Added to ${shelf.title}`);
      }
      onChange?.();
      sheetRef.current?.close();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update shelf.");
    }
  };

  const handleCreateAndAdd = async (): Promise<void> => {
    if (!bookId) return;
    const name = newName.trim();
    if (name.length === 0) return;

    try {
      const shelf = await createShelf(db, { name });
      await addBookToShelf(db, shelf.id, bookId);
      setMessage(`Added to ${shelf.title}`);
      setCreating(false);
      setNewName("");
      onChange?.();
      sheetRef.current?.close();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create shelf.");
    }
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.55}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      enableDynamicSizing={false}
      enablePanDownToClose
      handleIndicatorStyle={styles.dragHandle}
      index={-1}
      snapPoints={snapPoints}
    >
      <BottomSheetView style={styles.body}>
        <View style={styles.header}>
          <Text variant="hero">Add to shelf</Text>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text tone="danger">{error}</Text>
          </View>
        ) : null}
        {message ? (
          <Text style={styles.message} tone="accent">
            {message}
          </Text>
        ) : null}

        {shelves.length === 0 ? (
          <View style={styles.empty}>
            <Text tone="muted">No shelves yet</Text>
            <Button label="Create shelf" onPress={() => setCreating(true)} variant="secondary" />
          </View>
        ) : (
          <View style={styles.list}>
            {shelves.map((shelf) => {
              const isMember = memberShelfIds.has(shelf.id);
              return (
                <Pressable
                  accessibilityLabel={
                    isMember
                      ? `Remove from ${shelf.title}`
                      : `Add to ${shelf.title}`
                  }
                  accessibilityRole="button"
                  key={shelf.id}
                  onPress={() => void handleToggle(shelf)}
                  style={({ pressed }) => [
                    styles.row,
                    isMember ? styles.rowActive : undefined,
                    pressed ? styles.rowPressed : undefined,
                  ]}
                >
                  <View style={[styles.accentBar, { backgroundColor: shelf.accent }]} />
                  <View style={styles.rowCopy}>
                    <Text variant="bodyStrong">{shelf.title}</Text>
                    <Text tone="muted" variant="caption">
                      {shelf.count} {shelf.count === 1 ? "book" : "books"}
                    </Text>
                  </View>
                  {isMember ? (
                    <Feather color={tokens.color.accent} name="check" size={20} />
                  ) : (
                    <Feather color={tokens.color.muted} name="plus" size={20} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {creating ? (
          <View style={styles.createRow}>
            <TextInput
              autoFocus
              onChangeText={setNewName}
              onSubmitEditing={() => void handleCreateAndAdd()}
              placeholder="Shelf name"
              placeholderTextColor={tokens.color.muted}
              style={styles.createInput}
              value={newName}
            />
            <Button
              disabled={newName.trim().length === 0}
              label="Create"
              onPress={() => void handleCreateAndAdd()}
            />
          </View>
        ) : (
          <Pressable
            accessibilityLabel="New shelf"
            accessibilityRole="button"
            onPress={() => setCreating(true)}
            style={styles.newShelfRow}
          >
            <Feather color={tokens.color.accent} name="plus" size={18} />
            <Text tone="accent" variant="bodyStrong">
              New shelf
            </Text>
          </Pressable>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  accentBar: {
    alignSelf: "stretch",
    borderRadius: tokens.radius.pill,
    width: 4,
  },
  body: {
    flex: 1,
    gap: tokens.space[3],
    padding: tokens.space[5],
    paddingBottom: tokens.space[10],
  },
  createInput: {
    backgroundColor: tokens.color.black,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    color: tokens.color.ink,
    flex: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: tokens.space[4],
  },
  createRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[2],
  },
  dragHandle: {
    backgroundColor: tokens.color.border,
    height: 4,
    width: 44,
  },
  empty: {
    alignItems: "center",
    gap: tokens.space[3],
    paddingVertical: tokens.space[8],
  },
  errorBanner: {
    backgroundColor: "#2A1717",
    borderRadius: tokens.radius.md,
    padding: tokens.space[3],
  },
  header: {
    paddingBottom: tokens.space[2],
  },
  list: {
    gap: tokens.space[2],
  },
  message: {
    textAlign: "center",
  },
  newShelfRow: {
    alignItems: "center",
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: tokens.space[2],
    justifyContent: "center",
    paddingVertical: tokens.space[3],
  },
  row: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: tokens.space[3],
    minHeight: 64,
    padding: tokens.space[3],
  },
  rowActive: {
    borderColor: tokens.color.accent,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowPressed: {
    opacity: 0.85,
  },
  sheetBackground: {
    backgroundColor: tokens.color.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});
