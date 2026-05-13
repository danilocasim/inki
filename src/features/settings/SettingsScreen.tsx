import type { ReactElement } from "react";

import { Card } from "../../ui/Card";
import { Screen } from "../../ui/Screen";
import { Text } from "../../ui/Text";

/** Static settings placeholder for the PR 1 local-only route shell. */
export function SettingsScreen(): ReactElement {
  return (
    <Screen subtitle="no account, no tracking, no cloud requirement" title="settings">
      <Card>
        <Text variant="sectionTitle">local data policy</Text>
        <Text tone="muted">
          Books, shelves, quotes, notifications, and exports stay on this device until you
          explicitly share or export them.
        </Text>
      </Card>
    </Screen>
  );
}
