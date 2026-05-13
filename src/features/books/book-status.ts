import type { BookStatus } from "./types";
import type { SegmentOption } from "../../ui/SegmentedControl";

export const bookStatusOptions: readonly SegmentOption<BookStatus>[] = [
  { label: "reading", value: "reading" },
  { label: "recent", value: "recent" },
  { label: "want to read", value: "want-to-read" }
];

export const allBookStatusOptions: readonly SegmentOption<BookStatus>[] = [
  { label: "reading", value: "reading" },
  { label: "recent", value: "recent" },
  { label: "want to read", value: "want-to-read" },
  { label: "finished", value: "finished" },
  { label: "not yet", value: "not-yet" }
];
