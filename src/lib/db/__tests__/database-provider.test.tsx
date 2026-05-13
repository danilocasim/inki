import type { SQLiteProviderProps } from "expo-sqlite";
import { SQLiteProvider } from "expo-sqlite";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { DatabaseProvider } from "../database-provider";
import { DATABASE_NAME, initializeDatabaseAsync } from "../migrations";

jest.mock("expo-sqlite", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    SQLiteProvider: jest.fn((props: SQLiteProviderProps) => {
      if (props.onError != null && props.useSuspense) {
        throw new Error("Cannot use `onError` with `useSuspense`, use error boundaries instead.");
      }

      return React.createElement(React.Fragment, null, props.children);
    })
  };
});

describe("DatabaseProvider", () => {
  it("delegates Suspense-mode SQLite errors to the route error boundary", () => {
    render(
      <DatabaseProvider>
        <Text>Library shell</Text>
      </DatabaseProvider>
    );

    const sqliteProviderProps = jest.mocked(SQLiteProvider).mock.calls[0]?.[0];

    expect(screen.getByText("Library shell")).toBeTruthy();
    expect(sqliteProviderProps).toEqual(
      expect.objectContaining({
        databaseName: DATABASE_NAME,
        onInit: initializeDatabaseAsync,
        useSuspense: true
      })
    );
    expect(sqliteProviderProps?.onError).toBeUndefined();
  });
});