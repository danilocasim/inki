import type { ReactElement } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { BookForm } from "../components/BookForm";
import { useSaveBook } from "../hooks/use-save-book";
import type { BookStatus, CreateBookInput } from "../types";
import { Button } from "../../../ui/Button";
import { Card } from "../../../ui/Card";
import { Screen } from "../../../ui/Screen";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export function AddBookScreen(): ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { error, loading, saveBook } = useSaveBook();
  const initialValue = createInitialBookValue(params);

  const handleSubmit = async (input: CreateBookInput): Promise<void> => {
    const book = await saveBook(input);

    if (book) {
      router.replace({ pathname: "/book/[id]", params: { id: book.id } });
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <BookForm
        error={error}
        initialValue={initialValue}
        loading={loading}
        onSubmit={(input) => void handleSubmit(input)}
      />
      <Card style={styles.scanCard} variant="ink">
        <Text tone="muted" variant="caption">or scan a barcode</Text>
        <Text tone="muted">point camera at back cover</Text>
        <Text tone="muted">auto-fill from Open Library</Text>
        <Button label="scan barcode" onPress={() => router.push("/capture/barcode")} variant="secondary" />
      </Card>
    </Screen>
  );
}

interface AddBookParams extends Record<string, string | string[] | undefined> {
  author?: string | string[] | undefined;
  genre?: string | string[] | undefined;
  isbn?: string | string[] | undefined;
  source?: string | string[] | undefined;
  status?: string | string[] | undefined;
  title?: string | string[] | undefined;
}

const createInitialBookValue = (params: AddBookParams): Partial<CreateBookInput> | undefined => {
  const initialValue: Partial<CreateBookInput> = {};
  const isbn = readParam(params.isbn);
  const source = readParam(params.source);
  const title = readParam(params.title);
  const author = readParam(params.author);
  const genre = readParam(params.genre);
  const status = readStatusParam(params.status);

  if (isbn) {
    initialValue.isbn = isbn;
  }

  if (source) {
    initialValue.source = source;
  }

  if (title) {
    initialValue.title = title;
  }

  if (author) {
    initialValue.author = author;
  }

  if (genre) {
    initialValue.genre = genre;
  }

  if (status) {
    initialValue.status = status;
  }

  return Object.keys(initialValue).length > 0 ? initialValue : undefined;
};

const readParam = (value: string | string[] | undefined): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
};

const readStatusParam = (value: string | string[] | undefined): BookStatus | undefined => {
  const status = readParam(value);

  if (
    status === "reading" ||
    status === "recent" ||
    status === "want-to-read" ||
    status === "finished" ||
    status === "not-yet"
  ) {
    return status;
  }

  return undefined;
};

const styles = StyleSheet.create({
  content: {
    gap: tokens.space[3],
    paddingTop: tokens.space[8]
  },
  scanCard: {
    gap: tokens.space[3]
  }
});
