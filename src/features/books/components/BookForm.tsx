import type { ReactElement } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetModal as BottomSheetModalType,
} from "@gorhom/bottom-sheet";

import { allBookStatusOptions } from "../book-status";
import type { BookStatus, CreateBookInput } from "../types";
import { Button } from "../../../ui/Button";
import { SegmentedControl } from "../../../ui/SegmentedControl";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface BookFormValues {
  author: string;
  coverPath: string;
  genre: string;
  isbn: string;
  pageCount: string;
  status: BookStatus;
  title: string;
}

export interface BookFormProps {
  defaultValues?: BookFormValues | undefined;
  error?: string | undefined;
  loading?: boolean;
  onBack?: () => void;
  onChange?: (values: BookFormValues) => void;
  onSubmit: (input: CreateBookInput) => void;
  source?: string | undefined;
  submitLabel?: string | undefined;
  values?: BookFormValues | undefined;
}

export const emptyBookFormValues: BookFormValues = {
  author: "",
  coverPath: "",
  genre: "",
  isbn: "",
  pageCount: "",
  status: "reading",
  title: "",
};

export function bookFormValuesFromDraft(input: Partial<CreateBookInput>): BookFormValues {
  return {
    author: input.author ?? "",
    coverPath: input.coverPath ?? "",
    genre: input.genre ?? "",
    isbn: input.isbn ?? "",
    pageCount: input.totalPages !== undefined ? String(input.totalPages) : "",
    status: input.status ?? "reading",
    title: input.title ?? "",
  };
}

interface FieldErrors {
  author?: string;
  pageCount?: string;
  title?: string;
}

export const GENRE_OPTIONS = [
  "literary fiction",
  "contemporary",
  "sci-fi",
  "fantasy",
  "historical fiction",
  "thriller",
  "mystery",
  "romance",
  "non-fiction",
  "biography",
  "self-help",
  "poetry",
  "graphic novel",
  "translated",
  "classic",
  "family saga",
  "horror",
  "essay",
  "other",
] as const;

/** Manual-first local book form. Network metadata is always optional. */
export function BookForm({
  defaultValues,
  error,
  loading = false,
  onBack,
  onChange,
  onSubmit,
  source,
  submitLabel = "Save book",
  values,
}: BookFormProps): ReactElement {
  const [internalValues, setInternalValues] = useState<BookFormValues>(
    defaultValues ?? values ?? emptyBookFormValues,
  );
  const current = values ?? internalValues;
  const isScanned = source === "isbn-scan";
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const update = (next: BookFormValues): void => {
    if (values === undefined) {
      setInternalValues(next);
    }
    onChange?.(next);
  };

  const setField = <K extends keyof BookFormValues>(key: K, value: BookFormValues[K]): void => {
    update({ ...current, [key]: value });
  };

  const [coverPickerError, setCoverPickerError] = useState<string | undefined>();

  const handlePickCover = async (): Promise<void> => {
    setCoverPickerError(undefined);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setCoverPickerError("Photo library access is needed to select a cover image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [2, 3],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setField("coverPath", result.assets[0].uri);
    }
  };

  const handleSave = (): void => {
    const nextErrors: FieldErrors = {};
    const trimmedTitle = current.title.trim();
    const trimmedAuthor = current.author.trim();
    const trimmedPageCount = current.pageCount.trim();

    if (trimmedTitle === "") {
      nextErrors.title = "Title is required";
    }
    if (trimmedAuthor === "") {
      nextErrors.author = "Author is required";
    }
    if (trimmedPageCount !== "" && !/^\d+$/.test(trimmedPageCount)) {
      nextErrors.pageCount = "Page count must be a number";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    onSubmit({
      author: trimmedAuthor,
      coverPath: current.coverPath.trim() === "" ? undefined : current.coverPath.trim(),
      genre: current.genre.trim() === "" ? undefined : current.genre.trim(),
      isbn: current.isbn.trim() === "" ? undefined : current.isbn.trim(),
      source: source ?? "manual",
      status: current.status,
      title: trimmedTitle,
      totalPages: trimmedPageCount === "" ? undefined : Number(trimmedPageCount),
    });
  };

  return (
    <View style={styles.form}>
      {onBack ? (
        <Pressable accessibilityRole="link" hitSlop={8} onPress={onBack} style={styles.backLink}>
          <Text tone="muted" variant="caption">
            ← back
          </Text>
        </Pressable>
      ) : null}

      {error ? (
        <View style={styles.formError}>
          <Text tone="danger">{error}</Text>
        </View>
      ) : null}

      <View style={styles.coverBlock}>
        <Text tone="muted" variant="eyebrow">
          COVER (OPTIONAL)
        </Text>
        <Pressable
          accessibilityLabel="Pick a cover image"
          accessibilityRole="button"
          onPress={() => void handlePickCover()}
          style={styles.coverTile}
        >
          {current.coverPath !== "" ? (
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="cover"
              source={{ uri: current.coverPath }}
              style={styles.coverImage}
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Feather color={tokens.color.muted} name="image" size={22} />
              <Text tone="muted" variant="caption">
                tap to pick a photo
              </Text>
            </View>
          )}
        </Pressable>
        {coverPickerError ? (
          <Text tone="danger" variant="caption">
            {coverPickerError}
          </Text>
        ) : null}
      </View>

      <Field
        autoFocus
        error={fieldErrors.title}
        label="TITLE"
        onChangeText={(value) => setField("title", value)}
        value={current.title}
      />
      <Field
        error={fieldErrors.author}
        label="AUTHOR"
        onChangeText={(value) => setField("author", value)}
        value={current.author}
      />
      <GenrePicker onChange={(value) => setField("genre", value)} value={current.genre} />
      {isScanned || current.isbn !== "" ? (
        <Field
          editable={!isScanned}
          label="ISBN"
          onChangeText={(value) => setField("isbn", value)}
          trailingBadge={isScanned ? "scanned" : undefined}
          value={current.isbn}
        />
      ) : null}
      <Field
        error={fieldErrors.pageCount}
        keyboardType="number-pad"
        label="PAGE COUNT (OPTIONAL)"
        onChangeText={(value) => setField("pageCount", value)}
        value={current.pageCount}
      />

      <View style={styles.statusBlock}>
        <Text tone="muted" variant="eyebrow">
          READING STATUS
        </Text>
        <SegmentedControl
          onValueChange={(next) => setField("status", next)}
          options={allBookStatusOptions}
          value={current.status}
        />
      </View>

      <Button label={submitLabel} loading={loading} onPress={handleSave} />
    </View>
  );
}

interface FieldProps {
  autoFocus?: boolean;
  editable?: boolean;
  error?: string | undefined;
  keyboardType?: "default" | "number-pad";
  label: string;
  onChangeText: (value: string) => void;
  trailingBadge?: string | undefined;
  value: string;
}

function Field({
  autoFocus = false,
  editable = true,
  error,
  keyboardType = "default",
  label,
  onChangeText,
  trailingBadge,
  value,
}: FieldProps): ReactElement {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text tone="muted" variant="eyebrow">
          {label}
        </Text>
        {trailingBadge ? (
          <View style={styles.badge}>
            <Text tone="accent" variant="eyebrow">
              {trailingBadge}
            </Text>
          </View>
        ) : null}
      </View>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="words"
        autoFocus={autoFocus}
        editable={editable}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholderTextColor={tokens.color.muted}
        style={[styles.input, editable ? undefined : styles.inputDisabled]}
        value={value}
      />
      {error ? (
        <Text tone="danger" variant="caption">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

interface GenrePickerProps {
  onChange: (value: string) => void;
  value: string;
}

function GenrePicker({ onChange, value }: GenrePickerProps): ReactElement {
  const sheetRef = useRef<BottomSheetModalType>(null);
  const snapPoints = useMemo(() => ["55%", "85%"], []);

  const open = (): void => {
    sheetRef.current?.present();
  };

  const handleSelect = (genre: string): void => {
    onChange(genre);
    sheetRef.current?.dismiss();
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
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text tone="muted" variant="eyebrow">
          GENRE
        </Text>
      </View>
      <Pressable
        accessibilityLabel="GENRE"
        accessibilityRole="button"
        onPress={open}
        style={styles.inputPicker}
      >
        <Text style={value === "" ? styles.genrePlaceholder : styles.genreValue}>
          {value === "" ? "select a genre" : value}
        </Text>
        <Feather color={tokens.color.muted} name="chevron-down" size={18} />
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.genreSheetBackground}
        enableDynamicSizing={false}
        enablePanDownToClose
        handleIndicatorStyle={styles.genreSheetHandle}
        index={0}
        snapPoints={snapPoints}
      >
        <Text style={styles.genreSheetTitle} variant="sectionTitle">
          Select a genre
        </Text>
        <BottomSheetScrollView contentContainerStyle={styles.genreList}>
          {GENRE_OPTIONS.map((genre) => {
            const selected = value === genre;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={genre}
                onPress={() => handleSelect(genre)}
                style={({ pressed }) => [
                  styles.genreRow,
                  selected ? styles.genreRowSelected : undefined,
                  pressed ? styles.genreRowPressed : undefined,
                ]}
              >
                <Text style={selected ? styles.genreRowTextSelected : styles.genreRowText}>
                  {genre}
                </Text>
                {selected ? (
                  <Feather color={tokens.color.accent} name="check" size={18} />
                ) : null}
              </Pressable>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  backLink: {
    alignSelf: "flex-start",
    paddingVertical: tokens.space[1],
  },
  badge: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.accent,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: tokens.space[2],
    paddingVertical: 2,
  },
  coverBlock: {
    gap: tokens.space[2],
  },
  coverImage: {
    height: "100%",
    width: "100%",
  },
  coverPlaceholder: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: tokens.space[2],
    justifyContent: "center",
  },
  coverTile: {
    alignSelf: "stretch",
    backgroundColor: tokens.color.black,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    height: 110,
    overflow: "hidden",
  },
  field: {
    gap: tokens.space[2],
  },
  fieldHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[2],
    justifyContent: "space-between",
  },
  form: {
    gap: tokens.space[4],
  },
  formError: {
    backgroundColor: "#2A1717",
    borderRadius: tokens.radius.md,
    padding: tokens.space[3],
  },
  input: {
    backgroundColor: tokens.color.black,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    color: tokens.color.ink,
    fontSize: 18,
    fontWeight: "700",
    minHeight: 52,
    paddingHorizontal: tokens.space[4],
  },
  inputPicker: {
    alignItems: "center",
    backgroundColor: tokens.color.black,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: tokens.space[4],
  },
  inputDisabled: {
    color: tokens.color.inkSoft,
    opacity: 0.85,
  },
  genreList: {
    gap: tokens.space[1],
    paddingBottom: tokens.space[10],
    paddingHorizontal: tokens.space[5],
    paddingTop: tokens.space[3],
  },
  genrePlaceholder: {
    color: tokens.color.muted,
    flex: 1,
    fontSize: 16,
  },
  genreRow: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: tokens.space[4],
  },
  genreRowPressed: {
    opacity: 0.85,
  },
  genreRowSelected: {
    borderColor: tokens.color.accent,
  },
  genreRowText: {
    color: tokens.color.ink,
    fontSize: 16,
  },
  genreRowTextSelected: {
    color: tokens.color.accent,
    fontSize: 16,
    fontWeight: "700",
  },
  genreSheetBackground: {
    backgroundColor: tokens.color.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  genreSheetHandle: {
    backgroundColor: tokens.color.border,
    height: 4,
    width: 44,
  },
  genreSheetTitle: {
    paddingBottom: tokens.space[2],
    paddingHorizontal: tokens.space[5],
    paddingTop: tokens.space[2],
  },
  genreValue: {
    color: tokens.color.ink,
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  statusBlock: {
    gap: tokens.space[2],
  },
});
