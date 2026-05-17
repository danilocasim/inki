import type { Book, BookStatus } from "../books/types";

export interface StatValue {
  detail: string;
  label: string;
  value: string;
}

export interface DashboardData {
  activeBooks: Book[];
  books: Book[];
  /** Saved-bookmark count for each day of the current month (index 0 = day 1). */
  pulseDays: number[];
  pulseItems: string[];
  stats: StatValue[];
  yearlyStats: StatValue[];
}

export interface DashboardScreenData extends DashboardData {
  selectedStatus: BookStatus;
}
