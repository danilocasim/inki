import type { DatabaseWriter } from "../../../lib/db";
import { createLocalId, nowIso } from "../../../lib/time";
import type { ShareCardType } from "../share-card-types";

export interface ShareEventInput {
  cardType: ShareCardType;
  outputPath: string;
  sourceId?: string | undefined;
  usedForStreak?: boolean | undefined;
}

export async function recordShareEvent(db: DatabaseWriter, input: ShareEventInput): Promise<void> {
  await db.runAsync(
    `INSERT INTO share_events (id, card_type, source_id, output_path, used_for_streak, shared_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      createLocalId("share"),
      input.cardType,
      input.sourceId ?? null,
      input.outputPath,
      input.usedForStreak ? 1 : 0,
      nowIso()
    ]
  );
}
