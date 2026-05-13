import type { ReactElement } from "react";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { allBookStatusOptions } from "../book-status";
import type { BookStatus, CreateBookInput } from "../types";
import { Button } from "../../../ui/Button";
import { Card } from "../../../ui/Card";
import { SegmentedControl } from "../../../ui/SegmentedControl";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface BookFormProps {
  error?: string | undefined;
  initialValue?: Partial<CreateBookInput> | undefined;
  loading?: boolean;
  onSubmit: (input: CreateBookInput) => void;
}

/** Manual-first local book form. Network metadata is always optional. */
export function BookForm({
  error,
  initialValue,
  loading = false,
  onSubmit
}: BookFormProps): ReactElement {
  const usesScannedDraft = initialValue?.isbn !== undefined || initialValue?.source === "isbn-scan";
  const [title, setTitle] = useState(initialValue?.title ?? (usesScannedDraft ? "" : "Normal People"));
  const [author, setAuthor] = useState(initialValue?.author ?? (usesScannedDraft ? "" : "Sally Rooney"));
  const [status, setStatus] = useState<BookStatus>(initialValue?.status ?? "reading");
  const [genre, setGenre] = useState(initialValue?.genre ?? (usesScannedDraft ? "" : "contemporary"));
  const [isbn, setIsbn] = useState(initialValue?.isbn ?? "");
  const [pageCount, setPageCount] = useState(
    initialValue?.totalPages?.toString() ?? (usesScannedDraft ? "" : "273")
  );
  const source = initialValue?.source ?? "manual";

  return (
    <Card style={styles.card} variant="elevated">
      <Text tone="muted" variant="eyebrow">
        step 1
      </Text>
      <Field label="TITLE" onChangeText={setTitle} value={title} />
      <Field label="AUTHOR" onChangeText={setAuthor} value={author} />
      <Field label="GENRE" onChangeText={setGenre} value={genre} />
      {usesScannedDraft ? <Field label="ISBN" onChangeText={setIsbn} value={isbn} /> : null}
      <Field
        keyboardType="number-pad"
        label="page count optional"
        onChangeText={setPageCount}
        value={pageCount}
      />
      <SegmentedControl onValueChange={setStatus} options={allBookStatusOptions} value={status} />
      {error ? <Text tone="danger">{error}</Text> : null}
      <Button
        label="continue →"
        loading={loading}
        onPress={() =>
          onSubmit({
            author,
            genre,
            isbn: isbn.trim() === "" ? undefined : isbn.trim(),
            source,
            status,
            title,
            totalPages: pageCount.trim() === "" ? undefined : Number(pageCount)
          })
        }
      />
    </Card>
  );
}

interface FieldProps {
  keyboardType?: "default" | "number-pad";
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}

function Field({ keyboardType = "default", label, onChangeText, value }: FieldProps): ReactElement {
  return (
    <View style={styles.field}>
      <Text tone="muted" variant="eyebrow">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="words"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholderTextColor={tokens.color.muted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.space[4]
  },
  field: {
    gap: tokens.space[2]
  },
  input: {
    backgroundColor: tokens.color.surfaceMuted,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    color: tokens.color.ink,
    fontSize: 18,
    fontWeight: "700",
    minHeight: 52,
    paddingHorizontal: tokens.space[4]
  }
});
