import type { SegmentOption } from "../../ui/SegmentedControl";

export type FigmaFrameId =
  | "1:2"
  | "2:2"
  | "2:384"
  | "4:2"
  | "4:129"
  | "4:256"
  | "4:355"
  | "4:466"
  | "4:691";
export type BookStatus = "reading" | "recent" | "want-to-read" | "finished" | "not-yet";
export type ShelfView = "grid" | "list" | "spine";

export interface FigmaBook {
  author: string;
  frameIds: readonly FigmaFrameId[];
  genre: string;
  id: string;
  palette: {
    cover: string;
    spine: string;
    text: string;
  };
  progress?: number;
  status: BookStatus;
  title: string;
  year: string;
}

export interface FigmaShelf {
  accent: string;
  bookIds: readonly string[];
  countLabel: string;
  frameIds: readonly FigmaFrameId[];
  id: string;
  subtitle: string;
  title: string;
}

export interface ProfileAction {
  detail: string;
  label: string;
}

/** Book labels and palettes extracted from the initial Figma mobile frames. */
export const figmaBooks: readonly FigmaBook[] = [
  makeBook(
    "piranesi",
    "Piranesi",
    "Susanna Clarke",
    "reading",
    42,
    "fantasy",
    "2020",
    "#D6C6A3",
    "#8A5C36",
  ),
  makeBook(
    "klara",
    "Klara and the Sun",
    "Kazuo Ishiguro",
    "recent",
    100,
    "sci-fi",
    "2021",
    "#C98A6A",
    "#7D3F26",
  ),
  makeBook(
    "overstory",
    "The Overstory",
    "Richard Powers",
    "reading",
    31,
    "literary fiction",
    "2018",
    "#81906E",
    "#3E513A",
  ),
  makeBook(
    "tomb",
    "Tomb of Sand",
    "Geetanjali Shree",
    "want-to-read",
    undefined,
    "translated",
    "2018",
    "#D8A24A",
    "#8C6222",
  ),
  makeBook(
    "bewilderment",
    "Bewilderment",
    "Richard Powers",
    "recent",
    100,
    "sci-fi",
    "2021",
    "#9C6F88",
    "#5A344B",
  ),
  makeBook(
    "crossroads",
    "Crossroads",
    "Jonathan Franzen",
    "reading",
    18,
    "family saga",
    "2021",
    "#A55D44",
    "#713529",
  ),
  makeBook(
    "normal-people",
    "Normal People",
    "S. Rooney",
    "reading",
    72,
    "contemporary",
    "2018",
    "#B9C5D8",
    "#5C6B82",
  ),
  makeBook(
    "demon",
    "Demon Copperhead",
    "B. Kingsolver",
    "finished",
    100,
    "literary fiction",
    "2022",
    "#BD704E",
    "#793C25",
  ),
  makeBook(
    "remains",
    "Remains of the Day",
    "Kazuo Ishiguro",
    "finished",
    100,
    "classic",
    "1989",
    "#8A9A8E",
    "#425248",
  ),
  makeBook(
    "babel",
    "Babel",
    "R.F. Kuang",
    "want-to-read",
    undefined,
    "fantasy",
    "2022",
    "#4F5B74",
    "#283246",
  ),
  makeBook(
    "pachinko",
    "Pachinko",
    "M. Lee",
    "not-yet",
    undefined,
    "historical",
    "2017",
    "#CDAA68",
    "#7F6130",
  ),
];

export const homeTabs: readonly SegmentOption<BookStatus>[] = [
  { label: "reading", value: "reading" },
  { label: "recent", value: "recent" },
  { label: "want to read", value: "want-to-read" },
];

export const shelfFilters: readonly SegmentOption<BookStatus | "all">[] = [
  { label: "all", value: "all" },
  { label: "reading", value: "reading" },
  { label: "finished", value: "finished" },
  { label: "want to read", value: "want-to-read" },
  { label: "not yet", value: "not-yet" },
];

export const shelfViews: readonly SegmentOption<ShelfView>[] = [
  { label: "grid", value: "grid" },
  { label: "list", value: "list" },
  { label: "spine", value: "spine" },
];

export const spineSorts = ["year", "color", "genre", "author"] as const;

/** Static dashboard view model for Figma frames 1:2, 2:2, and 2:384. */
export const figmaDashboard = {
  frameIds: ["1:2", "2:2", "2:384"] as const,
  pulseItems: [
    "3 days since the last finished book",
    "11 pages logged this morning",
    "1 quote saved from Piranesi",
  ],
  stackBookIds: ["piranesi", "klara", "overstory", "tomb", "bewilderment", "crossroads"],
  stats: [
    { detail: "this month", label: "bookmark", value: "14" },
    { detail: "days alive", label: "continuity", value: "8" },
  ],
  tabs: homeTabs,
} as const;

/** Shelf overview and detail fixtures for Figma frames 4:2 through 4:466. */
export const figmaShelves: readonly FigmaShelf[] = [
  {
    accent: "#7D3F26",
    bookIds: ["normal-people", "demon", "remains", "piranesi", "babel", "pachinko"],
    countLabel: "6 books",
    frameIds: ["4:256", "4:355", "4:466"],
    id: "midnight-reads",
    subtitle: "intimate, strange, and impossible to put down",
    title: "midnight reads",
  },
  {
    accent: "#65785C",
    bookIds: ["overstory", "bewilderment", "piranesi"],
    countLabel: "3 books",
    frameIds: ["4:2", "4:129"],
    id: "forest-books",
    subtitle: "green books about memory and roots",
    title: "forest books",
  },
  {
    accent: "#C69A45",
    bookIds: ["klara", "babel", "tomb"],
    countLabel: "3 books",
    frameIds: ["4:2", "4:129"],
    id: "bright-strange",
    subtitle: "language, machines, and luminous futures",
    title: "bright strange",
  },
  {
    accent: "#4F5B74",
    bookIds: ["crossroads", "normal-people", "pachinko"],
    countLabel: "3 books",
    frameIds: ["4:2", "4:129"],
    id: "family-systems",
    subtitle: "people making a mess of love",
    title: "family systems",
  },
];

/** Private local-only profile fixture for Figma frame 4:691. */
export const figmaProfile = {
  actions: [
    { detail: "11 card formats, rendered on device", label: "reading wrapped" },
    { detail: "PDF and image archive for your shelves", label: "annual passport" },
    { detail: "JSON plus covers, saved from this phone", label: "export library" },
  ] satisfies readonly ProfileAction[],
  frameIds: ["4:691"] as const,
  genres: ["literary fiction", "contemporary", "romance", "sci-fi"],
  handle: "@anya",
  privacyBadge: "local-only",
  stats: [
    { detail: "finished", label: "books", value: "38" },
    { detail: "saved", label: "quotes", value: "126" },
    { detail: "active", label: "streak", value: "8" },
  ],
} as const;

export const isShelfView = (value: string | undefined): value is ShelfView =>
  value === "grid" || value === "list" || value === "spine";

export const getBookById = (id: string): FigmaBook => {
  const book = figmaBooks.find((item) => item.id === id);

  if (!book) {
    throw new Error(`Unknown Figma book fixture: ${id}`);
  }

  return book;
};

export const getShelfById = (id: string): FigmaShelf | undefined =>
  figmaShelves.find((shelf) => shelf.id === id);

function makeBook(
  id: string,
  title: string,
  author: string,
  status: BookStatus,
  progress: number | undefined,
  genre: string,
  year: string,
  cover: string,
  spine: string,
): FigmaBook {
  const book: Omit<FigmaBook, "progress"> = {
    author,
    frameIds: ["1:2", "4:256", "4:355", "4:466"],
    genre,
    id,
    palette: { cover, spine, text: "#FFF9F0" },
    status,
    title,
    year,
  };

  return progress === undefined ? book : { ...book, progress };
}
