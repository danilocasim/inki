import { mapOpenLibrarySearchResult } from "../services/open-library-service";

describe("Open Library service", () => {
  it("maps search responses into editable book drafts", () => {
    const draft = mapOpenLibrarySearchResult("9780571365432", {
      docs: [
        {
          author_name: ["Susanna Clarke"],
          subject: ["Fantasy", "Labyrinths and mazes"],
          title: "Piranesi"
        }
      ]
    });

    expect(draft).toEqual({
      author: "Susanna Clarke",
      genre: "Fantasy",
      isbn: "9780571365432",
      title: "Piranesi"
    });
  });

  it("ignores malformed responses", () => {
    expect(mapOpenLibrarySearchResult("isbn", { docs: [{}] })).toBeUndefined();
    expect(mapOpenLibrarySearchResult("isbn", null)).toBeUndefined();
  });
});
