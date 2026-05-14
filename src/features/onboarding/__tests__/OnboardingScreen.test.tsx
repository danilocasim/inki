import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAvoidingView, Platform } from "react-native";

import { OnboardingScreen } from "../OnboardingScreen";
import type { CreateBookInput } from "../../books/types";
import { renderWithProviders } from "../../../test/render";

const mockReplace = jest.fn();
const mockCreateBook = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock("expo-image-picker", () => ({
  MediaTypeOptions: { Images: "Images" },
  PermissionStatus: { DENIED: "denied", GRANTED: "granted", UNDETERMINED: "undetermined" },
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

jest.mock("../onboarding-storage", () => ({
  markOnboardingComplete: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../books/repositories/books-repository", () => ({
  createBooksRepository: () => ({ create: mockCreateBook }),
}));

describe("OnboardingScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateBook.mockImplementation(async (input: CreateBookInput) => ({
      author: input.author,
      coverPath: input.coverPath,
      currentPage: 0,
      id: "book-onboarding",
      isChangedYou: false,
      isPinned: false,
      palette: { cover: "#D6C6A3", spine: "#8A5C36", text: "#FFF9F0" },
      status: input.status,
      title: input.title,
      totalPages: input.totalPages,
      year: "2026",
    }));
  });

  it("previews and saves a manually picked onboarding book cover", async () => {
    const pickedCover = {
      assets: [{ height: 450, uri: "file:///onboarding-cover.jpg", width: 300 }],
      canceled: false,
    } satisfies ImagePicker.ImagePickerSuccessResult;

    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({
      accessPrivileges: "all",
      canAskAgain: true,
      expires: "never",
      granted: true,
      status: ImagePicker.PermissionStatus.GRANTED,
    });
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue(pickedCover);

    renderWithProviders(<OnboardingScreen onComplete={jest.fn()} />);

    fireEvent.press(screen.getByText("begin"));
    fireEvent.press(screen.getByText("i'm in"));
    fireEvent.press(screen.getByText("enter manually"));

    fireEvent.press(screen.getByLabelText("Pick a cover image"));

    await waitFor(() => {
      expect(screen.getByLabelText("Selected book cover image")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText("Title"), "Piranesi");
    fireEvent.changeText(screen.getByPlaceholderText("Author"), "Susanna Clarke");
    fireEvent.press(screen.getByText("add this book"));

    await waitFor(() => {
      expect(mockCreateBook).toHaveBeenCalledWith(
        expect.objectContaining({ coverPath: "file:///onboarding-cover.jpg" }),
      );
    });
  });

  it("keeps onboarding inputs above the keyboard on every platform", () => {
    const renderResult = renderWithProviders(<OnboardingScreen onComplete={jest.fn()} />);

    const keyboard = renderResult.UNSAFE_getByType(KeyboardAvoidingView);

    expect(keyboard.props.behavior).toBe(Platform.OS === "ios" ? "padding" : "height");
  });
});
