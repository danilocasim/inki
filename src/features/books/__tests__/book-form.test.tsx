import { fireEvent, screen } from "@testing-library/react-native";

import { BookForm, bookFormValuesFromDraft } from "../components/BookForm";
import type { Shelf } from "../../shelves/types";
import { renderWithProviders } from "../../../test/render";

const shelf = {
  accent: "#264A78",
  count: 2,
  id: "shelf-a",
  kind: "custom",
  subtitle: "private shelf",
  title: "Late Night Reads",
} satisfies Shelf;

describe("BookForm", () => {
  it("submits scanned ISBN drafts without requiring network metadata", () => {
    const onSubmit = jest.fn();

    renderWithProviders(
      <BookForm
        defaultValues={bookFormValuesFromDraft({ isbn: "9780571365432" })}
        onSubmit={onSubmit}
        source="isbn-scan"
      />,
    );

    fireEvent.changeText(screen.getByLabelText("TITLE"), "Piranesi");
    fireEvent.changeText(screen.getByLabelText("AUTHOR"), "Susanna Clarke");
    fireEvent.press(screen.getByText("Save book"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        author: "Susanna Clarke",
        isbn: "9780571365432",
        source: "isbn-scan",
        title: "Piranesi",
      }),
    );
  });

  it("blocks submit and shows inline errors when required fields are empty", () => {
    const onSubmit = jest.fn();

    renderWithProviders(<BookForm onSubmit={onSubmit} />);

    fireEvent.press(screen.getByText("Save book"));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Title is required")).toBeTruthy();
    expect(screen.getByText("Author is required")).toBeTruthy();
  });

  it("rejects non-numeric page count with an inline error", () => {
    const onSubmit = jest.fn();

    renderWithProviders(<BookForm onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText("TITLE"), "Piranesi");
    fireEvent.changeText(screen.getByLabelText("AUTHOR"), "Susanna Clarke");
    fireEvent.changeText(screen.getByLabelText("PAGE COUNT (OPTIONAL)"), "abc");
    fireEvent.press(screen.getByText("Save book"));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Page count must be a number")).toBeTruthy();
  });

  it("shows shelf choices and toggles the selected shelf", () => {
    const onSubmit = jest.fn();
    const onToggleShelf = jest.fn();

    renderWithProviders(
      <BookForm
        onSubmit={onSubmit}
        onToggleShelf={onToggleShelf}
        selectedShelfIds={new Set()}
        shelfOptions={[shelf]}
      />,
    );

    expect(screen.getByText("SHELVES")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Add to Late Night Reads"));

    expect(onToggleShelf).toHaveBeenCalledWith("shelf-a");
  });
});
