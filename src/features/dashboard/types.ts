import type { Book, BookStatus } from "../books/types";

export interface StatValue {
  detail: string;
  label: string;
  value: string;
}

export interface DashboardData {
  activeBooks: Book[];
  books: Book[];
  pulseItems: string[];
  stats: StatValue[];
  yearlyStats: StatValue[];
}

export interface DashboardScreenData extends DashboardData {
  selectedStatus: BookStatus;
}
