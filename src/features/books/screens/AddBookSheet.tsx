import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import { BookForm, emptyBookFormValues, type BookFormValues } from "../components/BookForm";
import { useSaveBook } from "../hooks/use-save-book";
import type { CreateBookInput } from "../types";
import { lookupOpenLibraryBookByIsbn } from "../../open-library";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

type SheetView = "chooser" | "looking-up" | "form";

export interface AddBookSheetProps {
  initialIsbn?: string | undefined;
  initialSource?: string | undefined;
  onClose: () => void;
  onScanBarcode: () => void;
  onScanQuote: () => void;
  onSaved: (bookId: string) => void;
}

export function AddBookSheet({
  initialIsbn,
  initialSource,
  onClose,
  onScanBarcode,
  onScanQuote,
  onSaved,
}: AddBookSheetProps): ReactElement {
  const db = useSQLiteContext();
  const { error, loading, saveBook } = useSaveBook();
  const sheetRef = useRef<BottomSheet>(null);
  const [view, setView] = useState<SheetView>(() =>
    initialIsbn && initialSource === "isbn-scan" ? "looking-up" : "chooser",
  );
  const [formValues, setFormValues] = useState<BookFormValues>(emptyBookFormValues);
  const [scannedSource, setScannedSource] = useState<string | undefined>();

  const snapPoints = useMemo(() => ["60%", "95%"], []);

  // Snap taller when on the form, shorter on the chooser/lookup.
  useEffect(() => {
    if (view === "form") {
      sheetRef.current?.snapToIndex(1);
    } else {
      sheetRef.current?.snapToIndex(0);
    }
  }, [view]);

  // Run ISBN lookup when arriving with a scanned ISBN.
  useEffect(() => {
    let cancelled = false;
    if (!initialIsbn || initialSource !== "isbn-scan") return;

    setScannedSource("isbn-scan");

    const run = async (): Promise<void> => {
      const draft = await lookupOpenLibraryBookByIsbn(db, initialIsbn).catch(() => undefined);
      if (cancelled) return;

      setFormValues({
        author: draft?.author ?? "",
        coverPath: "",
        genre: draft?.genre ?? "",
        isbn: initialIsbn,
        pageCount: "",
        status: "want-to-read",
        title: draft?.title ?? "",
      });
      setView("form");
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIsbn, initialSource]);

  const handleManualEntry = (): void => {
    setScannedSource(undefined);
    setView("form");
  };

  const handleBackToChooser = (): void => {
    setView("chooser");
  };

  const handleSubmit = async (input: CreateBookInput): Promise<void> => {
    const book = await saveBook(input, { shelfIds: [] });
    if (book) {
      onSaved(book.id);
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

  const Header = (
    <View style={styles.header}>
      <Text variant="hero">add a book</Text>
      <Pressable
        accessibilityLabel="Close add book sheet"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onClose}
        style={styles.closeBtn}
      >
        <Feather color={tokens.color.inkSoft} name="x" size={20} />
      </Pressable>
    </View>
  );

  return (
    <BottomSheet
      ref={sheetRef}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      enableDynamicSizing={false}
      enablePanDownToClose
      handleIndicatorStyle={styles.dragHandle}
      index={0}
      onClose={onClose}
      snapPoints={snapPoints}
    >
      {view === "form" ? (
        <BottomSheetScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
        >
          {Header}
          <BookForm
            error={error}
            loading={loading}
            onBack={handleBackToChooser}
            onChange={setFormValues}
            onSubmit={(input) => void handleSubmit(input)}
            source={scannedSource}
            values={formValues}
          />
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={styles.flex}>
          {Header}
          {view === "looking-up" ? (
            <LookingUpState />
          ) : (
            <EntryChooser
              onPickManual={handleManualEntry}
              onPickScan={onScanBarcode}
              onPickScanQuote={onScanQuote}
            />
          )}
        </BottomSheetView>
      )}
    </BottomSheet>
  );
}

interface EntryChooserProps {
  onPickManual: () => void;
  onPickScan: () => void;
  onPickScanQuote: () => void;
}

function EntryChooser({
  onPickManual,
  onPickScan,
  onPickScanQuote,
}: EntryChooserProps): ReactElement {
  return (
    <View style={styles.chooser}>
      <Pressable
        accessibilityRole="button"
        onPress={onPickManual}
        style={({ pressed }) => [styles.optionPrimary, pressed ? styles.optionPressed : undefined]}
      >
        <View style={styles.optionIconAccent}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={require("../../../assets/logo.png")}
            style={styles.optionLogo}
          />
        </View>
        <View style={styles.optionCopy}>
          <Text tone="button" variant="bodyStrong">
            Enter manually
          </Text>
          <Text tone="button" variant="caption">
            type title, author &amp; more
          </Text>
        </View>
        <Feather color={tokens.color.black} name="arrow-right" size={18} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onPickScan}
        style={({ pressed }) => [
          styles.optionSecondary,
          pressed ? styles.optionPressed : undefined,
        ]}
      >
        <View style={styles.optionIcon}>
          <Feather color={tokens.color.accent} name="camera" size={20} />
        </View>
        <View style={styles.optionCopy}>
          <Text variant="bodyStrong">Scan barcode</Text>
          <Text tone="muted" variant="caption">
            auto-fill from ISBN
          </Text>
        </View>
        <Feather color={tokens.color.accent} name="arrow-right" size={18} />
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text tone="muted" variant="caption">
          — or —
        </Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onPickScanQuote}
        style={({ pressed }) => [styles.optionTertiary, pressed ? styles.optionPressed : undefined]}
      >
        <View style={styles.optionIcon}>
          <Feather color={tokens.color.accent} name="file-text" size={20} />
        </View>
        <View style={styles.optionCopy}>
          <Text variant="bodyStrong">Scan a line / quote</Text>
          <Text tone="muted" variant="caption">
            OCR a passage from a page
          </Text>
        </View>
        <Feather color={tokens.color.muted} name="arrow-right" size={18} />
      </Pressable>
    </View>
  );
}

function LookingUpState(): ReactElement {
  return (
    <View style={styles.lookingUp}>
      <ActivityIndicator color={tokens.color.accent} size="large" />
      <Text tone="muted">looking up ISBN…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chooser: {
    gap: tokens.space[3],
    padding: tokens.space[5],
  },
  closeBtn: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  dividerLine: {
    backgroundColor: tokens.color.border,
    flex: 1,
    height: 1,
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  dragHandle: {
    backgroundColor: tokens.color.border,
    height: 4,
    width: 44,
  },
  flex: {
    flex: 1,
  },
  formScroll: {
    gap: tokens.space[4],
    padding: tokens.space[5],
    paddingBottom: tokens.space[12],
    paddingTop: 0,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: tokens.space[5],
    paddingVertical: tokens.space[3],
  },
  lookingUp: {
    alignItems: "center",
    flex: 1,
    gap: tokens.space[3],
    justifyContent: "center",
    padding: tokens.space[6],
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionIcon: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  optionIconAccent: {
    alignItems: "center",
    backgroundColor: tokens.color.black,
    borderRadius: tokens.radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  optionLogo: {
    height: 28,
    width: 28,
  },
  optionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  optionPrimary: {
    alignItems: "center",
    backgroundColor: tokens.color.accent,
    borderRadius: tokens.radius.lg,
    flexDirection: "row",
    gap: tokens.space[3],
    padding: tokens.space[4],
  },
  optionSecondary: {
    alignItems: "center",
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.accent,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: tokens.space[3],
    padding: tokens.space[4],
  },
  optionTertiary: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: tokens.space[3],
    padding: tokens.space[4],
  },
  sheetBackground: {
    backgroundColor: tokens.color.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});
