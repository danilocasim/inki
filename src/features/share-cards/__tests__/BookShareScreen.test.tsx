import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAvoidingView, Platform } from "react-native";

import type { Book } from "../../books/types";
import { BookShareScreen } from "../screens/BookShareScreen";
import { renderWithProviders } from "../../../test/render";

jest.mock("expo-image-picker", () => ({
  MediaTypeOptions: { Images: "Images" },
  PermissionStatus: { GRANTED: "granted" },
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("react-native-view-shot", () => ({
  captureRef: jest.fn(() => Promise.resolve("file:///share-card.png")),
}));

const book = {
  author: "Susanna Clarke",
  coverPath: "file:///piranesi-cover.jpg",
  currentPage: 104,
  id: "piranesi",
  isChangedYou: false,
  isPinned: false,
  palette: { cover: "#D6C6A3", spine: "#8A5C36", text: "#FFF9F0" },
  progress: 42,
  status: "reading",
  title: "Piranesi",
  totalPages: 248,
  year: "2026",
} satisfies Book;

describe("BookShareScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({
      accessPrivileges: "all",
      canAskAgain: true,
      expires: "never",
      granted: true,
      status: ImagePicker.PermissionStatus.GRANTED,
    });
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      assets: [{ height: 1600, uri: "file:///story-photo.jpg", width: 900 }],
      canceled: false,
    });
  });

  it("keeps the quote editor visible above the keyboard in preview", async () => {
    const renderResult = renderWithProviders(
      <BookShareScreen book={book} initialQuote="A sentence that stayed." onClose={jest.fn()} />,
    );

    const keyboard = renderResult.UNSAFE_getByType(KeyboardAvoidingView);
    expect(keyboard.props.behavior).toBe(Platform.OS === "ios" ? "padding" : "height");

    fireEvent.press(screen.getByText("Pick from library"));

    await waitFor(() => {
      expect(screen.getByText("Pick a template.")).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText("Template Cover left"));
    fireEvent.press(screen.getByText("quote"));

    const previewScroll = await screen.findByTestId("share-preview-scroll");
    const quoteInput = screen.getByLabelText("Quote text");

    expect(previewScroll.props.keyboardShouldPersistTaps).toBe("handled");
    expect(previewScroll.props.keyboardDismissMode).toBe(
      Platform.OS === "ios" ? "interactive" : "on-drag",
    );
    expect(previewScroll.props.automaticallyAdjustKeyboardInsets).toBe(Platform.OS === "ios");
    expect(quoteInput.props.textAlignVertical).toBe("top");
    expect(quoteInput.props.scrollEnabled).toBe(false);
  });

  it("adds an editorial story template with highlighted quote lines", async () => {
    renderWithProviders(
      <BookShareScreen
        book={book}
        initialQuote="The happiness of your life depends upon the quality of your thoughts."
        onClose={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText("Pick from library"));

    await waitFor(() => {
      expect(screen.getByText("Editorial story")).toBeTruthy();
    });

    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ aspect: [9, 16] }),
    );

    fireEvent.press(screen.getByLabelText("Template Editorial story"));

    expect(screen.getByLabelText("Book image for Piranesi")).toBeTruthy();
    expect(screen.getByLabelText("inki watermark")).toBeTruthy();
    expect(screen.getByText('"The happiness of your')).toBeTruthy();
    expect(screen.getByText("life depends upon the")).toBeTruthy();
    expect(screen.getByText("quality of your")).toBeTruthy();
    expect(screen.getByText('thoughts."')).toBeTruthy();
  });

  it("uses the default cover artwork in the story quote template when no image exists", async () => {
    const bookWithoutCover = {
      ...book,
      coverPath: undefined,
      title: "Meditations",
    } satisfies Book;

    renderWithProviders(
      <BookShareScreen
        book={bookWithoutCover}
        initialQuote="You have power."
        onClose={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText("Pick from library"));

    await waitFor(() => {
      expect(screen.getByText("Editorial story")).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText("Template Editorial story"));

    expect(screen.getByLabelText("Default book cover for Meditations")).toBeTruthy();
    expect(screen.getByLabelText("inki watermark")).toBeTruthy();
  });
});
