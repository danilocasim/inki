import type { Book } from "../../books/types";
import { buildDashboardData } from "../services/stats-service";

describe("dashboard stats service", () => {
  it("builds local dashboard values from books", () => {
    const data = buildDashboardData([
      makeBook("piranesi", "Piranesi", "reading", 42, false),
      makeBook("demon", "Demon Copperhead", "finished", 100, true)
    ]);

    expect(data.activeBooks).toHaveLength(1);
    expect(data.yearlyStats.find((stat) => stat.detail === "books this year")?.value).toBe("1");
    expect(data.yearlyStats.find((stat) => stat.detail === "changed me")?.value).toBe("1");
  });
});

function makeBook(
  id: string,
  title: string,
  status: Book["status"],
  progress: number,
  isChangedYou: boolean
): Book {
  return {
    author: "Author",
    currentPage: progress,
    id,
    isChangedYou,
    palette: { cover: "#111111", spine: "#000000", text: "#FFFFFF" },
    progress,
    status,
    title,
    year: "2026"
  };
}
