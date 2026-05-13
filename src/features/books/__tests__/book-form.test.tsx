import { fireEvent, screen } from "@testing-library/react-native";

import { BookForm } from "../components/BookForm";
import { renderWithProviders } from "../../../test/render";

describe("BookForm", () => {
  it("submits scanned ISBN drafts without requiring network metadata", () => {
    const onSubmit = jest.fn();

    renderWithProviders(
      <BookForm
        initialValue={{ isbn: "9780571365432", source: "isbn-scan" }}
        onSubmit={onSubmit}
      />
    );

    fireEvent.changeText(screen.getByLabelText("TITLE"), "Piranesi");
    fireEvent.changeText(screen.getByLabelText("AUTHOR"), "Susanna Clarke");
    fireEvent.press(screen.getByText("continue →"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        author: "Susanna Clarke",
        isbn: "9780571365432",
        source: "isbn-scan",
        title: "Piranesi"
      })
    );
  });
});
