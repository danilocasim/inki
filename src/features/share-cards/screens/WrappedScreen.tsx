import type { ReactElement } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { DashboardData } from "../../dashboard/types";
import { Button } from "../../../ui/Button";
import { Card } from "../../../ui/Card";
import { Screen } from "../../../ui/Screen";
import { Text } from "../../../ui/Text";
import { tokens } from "../../../ui/tokens";

export interface WrappedScreenProps {
  data?: DashboardData | undefined;
}

export function WrappedScreen({ data }: WrappedScreenProps): ReactElement {
  const [index, setIndex] = useState(0);
  const cards = buildCards(data);
  const card = cards[index] ?? fallbackWrappedCard;

  return (
    <Screen contentStyle={styles.screen}>
      <Card style={[styles.card, { backgroundColor: card.background }]}>
        <Text tone="inverse" variant="eyebrow">2026</Text>
        <View style={styles.cardBody}>
          <Text tone="inverse" style={styles.value} variant="hero">{card.value}</Text>
          <Text tone="inverse" variant="sectionTitle">{card.title}</Text>
          <Text tone="inverse">{card.detail}</Text>
        </View>
        <Button label="share wrapped" onPress={noop} variant="secondary" />
      </Card>
      <View style={styles.dots}>
        {cards.map((item, itemIndex) => (
          <Pressable
            accessibilityLabel={`Show wrapped card ${itemIndex + 1}`}
            key={item.title}
            onPress={() => setIndex(itemIndex)}
            style={[styles.dot, itemIndex === index ? styles.dotActive : undefined]}
          />
        ))}
      </View>
    </Screen>
  );
}

interface WrappedCardModel {
  background: string;
  detail: string;
  title: string;
  value: string;
}

const buildCards = (data: DashboardData | undefined): readonly WrappedCardModel[] => {
  const booksRead = data?.yearlyStats.find((stat) => stat.detail === "books this year")?.value ?? "17";
  const pages = data?.yearlyStats.find((stat) => stat.detail === "ink density")?.value ?? "4,891";
  const changed = data?.yearlyStats.find((stat) => stat.detail === "changed me")?.value ?? "5";

  return [
    { background: tokens.color.ink, detail: `${pages} pages`, title: "books read", value: booksRead },
    { background: tokens.color.accentDark, detail: "~32 hours total", title: "YOU READ MOSTLY", value: "midnight" },
    { background: tokens.color.moss, detail: "Piranesi · Susanna Clarke", title: "FASTEST READ", value: "2d" },
    { background: tokens.color.leaf, detail: "the others move on", title: "BOOKS THAT CHANGED YOU", value: changed },
    { background: tokens.color.gold, detail: "this was your year in books.", title: "TOP GENRES", value: "literary fiction" }
  ];
};

const fallbackWrappedCard: WrappedCardModel = {
  background: tokens.color.ink,
  detail: "0 pages",
  title: "books read",
  value: "0"
};

const noop = (): void => undefined;

const styles = StyleSheet.create({
  card: {
    gap: tokens.space[6],
    minHeight: 620,
    justifyContent: "space-between"
  },
  cardBody: {
    gap: tokens.space[3]
  },
  dot: {
    backgroundColor: tokens.color.border,
    borderRadius: tokens.radius.pill,
    height: 10,
    width: 10
  },
  dotActive: {
    backgroundColor: tokens.color.ink,
    width: 28
  },
  dots: {
    alignSelf: "center",
    flexDirection: "row",
    gap: tokens.space[2]
  },
  screen: {
    paddingBottom: tokens.space[6]
  },
  value: {
    fontSize: 46,
    lineHeight: 54
  }
});
