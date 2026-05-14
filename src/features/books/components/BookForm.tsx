import type { ReactElement } from "react";
import { useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";

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

/** Manual-first local book form. Network metadata is always optional. */
export function BookForm({
  defaultValues,
  error,
  loading = false,
  onBack,
  onChange,
  onSubmit,
  source,
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
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={onBack}
          style={styles.backLink}
        >
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
      <Field
        label="GENRE"
        onChangeText={(value) => setField("genre", value)}
        value={current.genre}
      />
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

      <Button label="Save book" loading={loading} onPress={handleSave} />
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
  inputDisabled: {
    color: tokens.color.inkSoft,
    opacity: 0.85,
  },
  statusBlock: {
    gap: tokens.space[2],
  },
});
