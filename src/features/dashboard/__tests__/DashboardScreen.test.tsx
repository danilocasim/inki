import { screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { Book } from "../../books/types";
import { DashboardScreen } from "../DashboardScreen";
import { buildDashboardData } from "../services/stats-service";
import { renderWithProviders } from "../../../test/render";

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  author: "Author",
  currentPage: 12,
  id: overrides.title ?? "book",
  isChangedYou: false,
  isPinned: false,
  palette: { cover: "#5D4037", spine: "#3E2723", text: "#FFF9F0" },
  status: "reading",
  title: "Untitled",
  totalPages: 240,
  year: "2026",
  ...overrides,
});

describe("DashboardScreen", () => {
  it("keeps the filter summary below tabs so long counts do not overflow", () => {
    renderWithProviders(
      <DashboardScreen
        data={buildDashboardData(
          Array.from({ length: 15 }, (_, index) =>
            makeBook({ id: `book-${index}`, title: `Book ${index}` }),
          ),
        )}
      />,
    );

    const filterRow = screen.getByTestId("dashboard-filter-row");
    const filterSummary = screen.getByTestId("dashboard-filter-summary");

    expect(StyleSheet.flatten(filterRow.props.style)).toEqual(
      expect.objectContaining({ flexDirection: "column" }),
    );
    expect(filterSummary.props.children).toBe("6 shown · 15 total");
    expect(StyleSheet.flatten(filterSummary.props.style)).toEqual(
      expect.objectContaining({ alignSelf: "flex-start" }),
    );
  });

  it("keeps a two-book stack grouped instead of stretching books to opposite edges", () => {
    renderWithProviders(
      <DashboardScreen
        data={buildDashboardData([
          makeBook({ id: "left-hand", title: "The Left Hand of Darkness" }),
          makeBook({ id: "piranesi", title: "Piranesi" }),
        ])}
      />,
    );

    const grid = screen.getByTestId("dashboard-book-grid");

    expect(StyleSheet.flatten(grid.props.style)).toEqual(
      expect.objectContaining({ justifyContent: "flex-start" }),
    );
  });

  it("keeps the stack title on one line with the count below it", () => {
    renderWithProviders(<DashboardScreen />);

    const header = screen.getByTestId("dashboard-stack-header");
    const title = screen.getByText("The Stack");

    expect(title.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(header.props.style)).toEqual(
      expect.objectContaining({ flexDirection: "column" }),
    );
  });
});
