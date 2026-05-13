import type { ReactElement, ReactNode } from "react";
import { Suspense } from "react";
import { SQLiteProvider } from "expo-sqlite";

import { DATABASE_NAME, initializeDatabaseAsync } from "./migrations";
import { ErrorState } from "../../ui/ErrorState";
import { Screen } from "../../ui/Screen";
import { Text } from "../../ui/Text";

export interface DatabaseProviderProps {
  children: ReactNode;
}

/** Wires the local-only SQLite database into the app shell. */
export function DatabaseProvider({ children }: DatabaseProviderProps): ReactElement {
  return (
    <Suspense fallback={<DatabaseLoadingScreen />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={initializeDatabaseAsync}
        useSuspense
      >
        {children}
      </SQLiteProvider>
    </Suspense>
  );
}

function DatabaseLoadingScreen(): ReactElement {
  return (
    <Screen title="inki">
      <Text tone="muted">Opening your local library...</Text>
    </Screen>
  );
}

export function DatabaseErrorScreen({ retry }: { retry: () => void }): ReactElement {
  return (
    <ErrorState
      actionLabel="Try again"
      message="Inki could not open the local library. Your data has not been reset."
      onAction={retry}
      title="Local library unavailable"
    />
  );
}
