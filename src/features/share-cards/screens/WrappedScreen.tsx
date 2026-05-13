import type { ReactElement, RefObject } from "react";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import type { DashboardData } from "../../dashboard/types";
import type { ShareCardType } from "../share-card-types";
import { Button } from "../../../ui/Button";
import { Screen } from "../../../ui/Screen";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface WrappedScreenProps {
  cardType?: ShareCardType;
  data?: DashboardData | undefined;
  onClose?: () => void;
  onShareCard?: (cardRef: RefObject<View | null>) => Promise<void> | void;
  shareLoading?: boolean;
  shareMessage?: string | undefined;
}

export function WrappedScreen({
  cardType = "wrapped",
  data,
  onClose = noop,
  onShareCard = noopShare,
  shareLoading = false,
  shareMessage
}: WrappedScreenProps): ReactElement {
  const [index, setIndex] = useState(0);
  const cardRef = useRef<View | null>(null);
  const cards = buildCards(data, cardType);
  const card = cards[index] ?? fallbackWrappedCard;
  const shareLabel = shareLabelForType(cardType);

  return (
    <Screen contentStyle={[styles.screen, { backgroundColor: card.background }]}>
      <View style={styles.progressRow}>
        {cards.map((item, itemIndex) => (
          <Pressable
            accessibilityLabel={`Show wrapped card ${itemIndex + 1}`}
            key={item.title}
            onPress={() => setIndex(itemIndex)}
            style={[styles.progressSegment, itemIndex <= index ? styles.progressSegmentActive : undefined]}
          />
        ))}
      </View>
      <Pressable accessibilityLabel="Close share card" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
        <Feather color={tokens.color.ink} name="x" size={22} />
      </Pressable>
      <View collapsable={false} ref={cardRef} style={styles.cardBody}>
        <Text tone="accent" variant="eyebrow">{card.kicker}</Text>
        {card.kind === "genres" ? <GenresCard /> : <HeroCard card={card} />}
      </View>
      {shareMessage ? <Text tone="accent" style={styles.shareMessage}>{shareMessage}</Text> : null}
      <Button label={shareLabel} loading={shareLoading} onPress={() => void onShareCard(cardRef)} />
    </Screen>
  );
}

interface WrappedCardModel {
  background: string;
  detail: string;
  kicker: string;
  kind: "genres" | "hero";
  title: string;
  value: string;
}

function HeroCard({ card }: { card: WrappedCardModel }): ReactElement {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.value} variant="hero">{card.value}</Text>
      <Text variant="hero">{card.title}</Text>
      <Text tone="accent">{card.detail}</Text>
    </View>
  );
}

function GenresCard(): ReactElement {
  return (
    <View style={styles.genresCard}>
      <Text variant="eyebrow">TOP GENRES</Text>
      {topGenres.map((genre) => (
        <View key={genre.name} style={styles.genreRow}>
          <Text variant="sectionTitle">{genre.name}</Text>
          <Text tone="accent" variant="sectionTitle">{genre.count}</Text>
        </View>
      ))}
      <Text style={styles.genreFooter}>this was your year{"\n"}in books.</Text>
    </View>
  );
}

const buildCards = (data: DashboardData | undefined, cardType: ShareCardType): readonly WrappedCardModel[] => {
  const booksRead = data?.yearlyStats.find((stat) => stat.detail === "books this year")?.value ?? "17";
  const pages = data?.yearlyStats.find((stat) => stat.detail === "ink density")?.value ?? "4,891";
  const changed = data?.yearlyStats.find((stat) => stat.detail === "changed me")?.value ?? "5";

  if (cardType === "passport") {
    return [
      { background: "#2E5E62", detail: `${pages} pages logged locally`, kicker: "2026", kind: "hero", title: "book passport", value: booksRead },
      { background: "#385C72", detail: `${changed} changed you`, kicker: "LOCAL ARCHIVE", kind: "hero", title: "kept", value: changed },
      { background: "#4E5D77", detail: "ready to share as an image", kicker: "INKI", kind: "genres", title: "top genres", value: "" }
    ];
  }

  if (cardType === "shelf-wall") {
    return [
      { background: "#355F4F", detail: `${pages} pages across your local shelves`, kicker: "SHELF WALL", kind: "hero", title: "books stacked", value: booksRead },
      { background: "#5C4F78", detail: "private shelf image", kicker: "ARCHIVE", kind: "hero", title: "wall", value: "share" },
      { background: "#73546E", detail: "this wall stays local until you share it", kicker: "INKI", kind: "genres", title: "top genres", value: "" }
    ];
  }

  return [
    { background: "#344B78", detail: `${pages} pages`, kicker: "2026", kind: "hero", title: "books read", value: booksRead },
    { background: "#45457D", detail: "~32 hours total", kicker: "YOU READ MOSTLY", kind: "hero", title: "midnight", value: "moon" },
    { background: "#4A4A82", detail: "Piranesi · Susanna Clarke", kicker: "FASTEST READ", kind: "hero", title: "Piranesi", value: "2d" },
    { background: "#514985", detail: "the others move on", kicker: "BOOKS THAT CHANGED YOU", kind: "hero", title: "kept", value: changed },
    { background: "#594B87", detail: "this was your year in books.", kicker: "TOP GENRES", kind: "genres", title: "top genres", value: "" }
  ];
};

const fallbackWrappedCard: WrappedCardModel = {
  background: "#344B78",
  detail: "0 pages",
  kicker: "2026",
  kind: "hero",
  title: "books read",
  value: "0"
};

const topGenres = [
  { count: "6", name: "literary fiction" },
  { count: "5", name: "contemporary" },
  { count: "4", name: "romance" }
] as const;

const noop = (): void => undefined;
const noopShare = async (_cardRef: RefObject<View | null>): Promise<void> => undefined;

const shareLabelForType = (cardType: ShareCardType): string => {
  if (cardType === "passport") {
    return "share passport";
  }

  if (cardType === "shelf-wall") {
    return "share shelf wall";
  }

  return "share wrapped";
};

const styles = StyleSheet.create({
  cardBody: {
    flex: 1,
    justifyContent: "center"
  },
  closeButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: tokens.radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  genreFooter: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: tokens.space[8],
    textAlign: "center"
  },
  genreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "88%"
  },
  genresCard: {
    alignItems: "center",
    gap: tokens.space[4]
  },
  heroCard: {
    alignItems: "center",
    gap: tokens.space[4]
  },
  progressRow: {
    flexDirection: "row",
    gap: tokens.space[1]
  },
  progressSegment: {
    backgroundColor: "rgba(158,199,250,0.28)",
    flex: 1,
    height: 3
  },
  progressSegmentActive: {
    backgroundColor: tokens.color.accent
  },
  screen: {
    flexGrow: 1,
    minHeight: 780,
    paddingBottom: tokens.space[8]
  },
  shareMessage: {
    textAlign: "center"
  },
  value: {
    fontSize: 118,
    lineHeight: 126,
    textAlign: "center"
  }
});
