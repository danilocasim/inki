import type { ReactElement } from "react";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";

import { Text } from "../../ui/Text";
import { fontFamily, tokens } from "../../ui/tokens";
import { createBooksRepository } from "../books/repositories/books-repository";
import type { Book } from "../books/types";
import { markOnboardingComplete } from "./onboarding-storage";

const TOTAL = 10;

const DEMO_LINES = [
  "The house wants to be filled with people who know its beauty.",
  "A hall is not just a space. It is a thought made of stone.",
  "There is no house without mystery.",
];

const HIGHLIGHT_COLORS = [
  tokens.color.gold,
  tokens.color.leaf,
  tokens.color.blush,
  tokens.color.accent,
];

const DEMO_TAGS = ["#architecture", "#memory", "#loneliness", "#wonder", "#place", "#self"];

type AddMode = "scan" | "manual";

interface NavConfig {
  label: string;
  onPress: () => void;
  showBack?: boolean;
}

interface Props {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: Props): ReactElement {
  const db = useSQLiteContext();

  // ── bookmark flow state ─────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [pageNumber, setPageNumber] = useState("72");
  const [selectedLine, setSelectedLine] = useState(1);
  const [pickTab, setPickTab] = useState<"ocr" | "type">("ocr");
  const [typedLine, setTypedLine] = useState("");
  const [hlColor, setHlColor] = useState<string>(tokens.color.gold);
  const [noteText, setNoteText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["#architecture"]);
  const [reminders, setReminders] = useState({ daily: true, streak: true, read: false });

  // ── share card state ────────────────────────────────────────────
  const [cardBgImage, setCardBgImage] = useState<string | null>(null);

  const pickCardImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setCardBgImage(result.assets[0].uri);
    }
  };

  // ── add book state ──────────────────────────────────────────────
  const [addMode, setAddMode] = useState<AddMode>("scan");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualPages, setManualPages] = useState("");

  // ── navigation ──────────────────────────────────────────────────
  const next = () => setStep((s) => Math.min(s + 1, TOTAL - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    try {
      await markOnboardingComplete();
    } catch {
      // proceed even if the prefs write fails — onComplete must always fire
    }
    onComplete();
  };

  const handleAddBook = async () => {
    if (addMode === "manual" && manualTitle.trim()) {
      try {
        const repo = createBooksRepository(db);
        const book = await repo.create({
          title: manualTitle.trim(),
          author: manualAuthor.trim() || "Unknown",
          status: "reading",
          totalPages: manualPages ? parseInt(manualPages, 10) : undefined,
          source: "onboarding",
        });
        setSelectedBook(book);
      } catch {
        // advance even if save fails
      }
    }
    next();
  };

  // The line carried forward to all subsequent steps
  const activeLine =
    pickTab === "type" ? typedLine || "Type a line above…" : (DEMO_LINES[selectedLine] ?? "");

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  // ── shared chrome ───────────────────────────────────────────────

  const Progress = () => (
    <View style={s.progressRow}>
      {Array.from({ length: TOTAL - 1 }).map((_, i) => (
        <View key={i} style={[s.seg, i < step ? s.segActive : s.segOff]} />
      ))}
    </View>
  );

  const SkipAll = () => (
    <Pressable hitSlop={12} onPress={finish} style={s.skipAll}>
      <Text style={s.skipAllText}>skip</Text>
    </Pressable>
  );

  // ── step 0: welcome ─────────────────────────────────────────────

  const Welcome = () => (
    <View style={s.welcomeWrap}>
      <View style={s.welcomeCenter}>
        <Image resizeMode="contain" source={require("../../assets/logo.png")} style={s.logoMark} />
        <Image
          resizeMode="contain"
          source={require("../../assets/transparent-white-logo.png")}
          style={s.logoWordmark}
        />
        <Text style={s.tagline}>{"Find one line\nthat matters."}</Text>
        <Text style={s.taglineSub}>{"A quiet place for what stays with you\nwhen you read."}</Text>
      </View>
      <Pressable onPress={next} style={[s.primaryBtn, { alignSelf: "stretch", flex: 0 }]}>
        <Text style={s.primaryBtnText}>begin</Text>
        <Feather color={tokens.color.black} name="arrow-right" size={16} />
      </Pressable>
    </View>
  );

  // ── step 1: ritual ──────────────────────────────────────────────

  const RITUAL = [
    {
      num: "01",
      icon: "book" as const,
      title: "pick a page",
      desc: "Mid-read, end of a chapter, anywhere a line catches you.",
    },
    {
      num: "02",
      icon: "edit-2" as const,
      title: "highlight it",
      desc: "Mark the words. Pick a color. Add a quick note about why.",
    },
    {
      num: "03",
      icon: "share-2" as const,
      title: "share it",
      desc: "One bookmark, one card, one streak. No feed, no replies.",
    },
  ];

  const Ritual = () => (
    <>
      <Progress />
      <SkipAll />
      <Text style={s.stepTitle}>{"The ritual,\nin three steps."}</Text>
      <View style={s.ritualList}>
        {RITUAL.map((item) => (
          <View key={item.num} style={s.ritualRow}>
            <View style={s.ritualIcon}>
              <Feather color={tokens.color.inkSoft} name={item.icon} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.ritualNum}>{item.num}</Text>
              <Text style={s.ritualTitle}>{item.title}</Text>
              <Text style={s.ritualDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );

  // ── step 2: add first book ──────────────────────────────────────

  const AddBook = () => (
    <>
      <Progress />
      <SkipAll />
      <Text style={s.stepTitle}>Add your first book.</Text>
      <Text style={s.stepSub}>Pick the way that feels easiest. You can change anything later.</Text>

      {/* option selector */}
      <View style={s.optionList}>
        {(["scan", "manual"] as AddMode[]).map((mode) => {
          const icons = { scan: "camera", manual: "edit-2" } as const;
          const labels = { scan: "scan barcode", manual: "enter manually" };
          const descs = {
            scan: "Point at the back cover. Open Library does the rest.",
            manual: "Title, author, page count. Done.",
          };
          const active = addMode === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => {
                setAddMode(mode);
                setSelectedBook(null);
              }}
              style={[s.optionRow, active && s.optionSelected]}
            >
              <Feather
                color={active ? tokens.color.inkSoft : tokens.color.muted}
                name={icons[mode]}
                size={18}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.optionTitle}>{labels[mode]}</Text>
                <Text style={s.optionDesc}>{descs[mode]}</Text>
              </View>
              {active ? <View style={s.radioOn} /> : <View style={s.radioOff} />}
            </Pressable>
          );
        })}
      </View>

      {/* manual entry mode */}
      {addMode === "manual" && (
        <View style={s.manualBlock}>
          <TextInput
            onChangeText={setManualTitle}
            placeholder="Title"
            placeholderTextColor={tokens.color.muted}
            style={s.manualInput}
            value={manualTitle}
          />
          <TextInput
            onChangeText={setManualAuthor}
            placeholder="Author"
            placeholderTextColor={tokens.color.muted}
            style={s.manualInput}
            value={manualAuthor}
          />
          <TextInput
            keyboardType="number-pad"
            onChangeText={setManualPages}
            placeholder="Page count (optional)"
            placeholderTextColor={tokens.color.muted}
            style={s.manualInput}
            value={manualPages}
          />
        </View>
      )}
    </>
  );

  // ── step 3: what page ───────────────────────────────────────────

  const WhatPage = () => (
    <>
      <Progress />
      <SkipAll />
      <Text style={s.eyebrow}>YOUR FIRST BOOKMARK · 1 OF 3</Text>
      <Text style={s.stepTitle}>What page?</Text>
      <View style={s.inputCard}>
        <Text style={s.inputCardLabel}>PAGE NUMBER</Text>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setPageNumber}
          placeholderTextColor={tokens.color.muted}
          style={s.pageInput}
          value={pageNumber}
        />
      </View>
      <View style={s.cameraOption}>
        <Feather color={tokens.color.accent} name="camera" size={16} />
        <View>
          <Text style={s.cameraTitle}>or scan with camera</Text>
          <Text style={s.cameraDesc}>OCR reads the page on-device</Text>
        </View>
      </View>
    </>
  );

  // ── step 4: pick a line ─────────────────────────────────────────

  const PickLine = () => (
    <>
      <Progress />
      <SkipAll />
      <Text style={s.eyebrow}>YOUR FIRST BOOKMARK · 2 OF 3</Text>
      <Text style={s.stepTitle}>Pick a line.</Text>

      {/* tabs */}
      <View style={s.tabRow}>
        <Pressable
          onPress={() => setPickTab("ocr")}
          style={pickTab === "ocr" ? s.tabActive : s.tabInactive}
        >
          <Text style={pickTab === "ocr" ? s.tabActiveText : s.tabInactiveText}>
            ocr candidates
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPickTab("type")}
          style={pickTab === "type" ? s.tabActive : s.tabInactive}
        >
          <Text style={pickTab === "type" ? s.tabActiveText : s.tabInactiveText}>type it</Text>
        </Pressable>
      </View>

      {/* ocr candidates */}
      {pickTab === "ocr" &&
        DEMO_LINES.map((line, i) => (
          <Pressable
            key={i}
            onPress={() => setSelectedLine(i)}
            style={[s.lineOption, i === selectedLine && { borderColor: hlColor, borderWidth: 1.5 }]}
          >
            <Text style={[s.lineText, i === selectedLine && { backgroundColor: hlColor + "44" }]}>
              {line}
            </Text>
          </Pressable>
        ))}

      {/* type it */}
      {pickTab === "type" && (
        <View style={[s.lineOption, { borderColor: hlColor, borderWidth: 1.5 }]}>
          <TextInput
            autoFocus
            multiline
            onChangeText={setTypedLine}
            placeholder="Type the line from your book…"
            placeholderTextColor={tokens.color.muted}
            style={[
              s.lineText,
              typedLine ? { backgroundColor: hlColor + "44" } : undefined,
              { minHeight: 72 },
            ]}
            value={typedLine}
          />
        </View>
      )}

      <Text style={s.colorLabel}>HIGHLIGHT COLOR</Text>
      <View style={s.colorRow}>
        {HIGHLIGHT_COLORS.map((col) => (
          <Pressable
            key={col}
            onPress={() => setHlColor(col)}
            style={[s.colorDot, { backgroundColor: col }, hlColor === col && s.colorDotSelected]}
          />
        ))}
      </View>
    </>
  );

  // ── step 5: why this line ───────────────────────────────────────

  const WhyThisLine = () => (
    <>
      <Progress />
      <SkipAll />
      <Text style={s.eyebrow}>YOUR FIRST BOOKMARK · 3 OF 3</Text>
      <Text style={s.stepTitle}>Why this line?</Text>
      <View style={s.quoteCard}>
        <Text style={[s.quoteText, { backgroundColor: hlColor + "44" }]}>{activeLine}</Text>
        <Text style={s.quoteMeta}>
          pg. {pageNumber} · {selectedBook?.title ?? "Piranesi"}
        </Text>
      </View>
      <TextInput
        multiline
        onChangeText={setNoteText}
        placeholder="What stayed with you about this line?"
        placeholderTextColor={tokens.color.muted}
        style={s.noteInput}
        value={noteText}
      />
      <Text style={[s.colorLabel, { marginTop: tokens.space[4] }]}>TAGS · OPTIONAL</Text>
      <View style={s.tagWrap}>
        {DEMO_TAGS.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => toggleTag(tag)}
            style={[s.tagChip, selectedTags.includes(tag) && s.tagChipOn]}
          >
            <Text style={[s.tagText, selectedTags.includes(tag) && s.tagTextOn]}>{tag}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );

  // ── step 6: bookmark saved ──────────────────────────────────────

  const BookmarkSaved = () => (
    <>
      <Progress />
      <SkipAll />
      <View style={s.centeredGroup}>
        <View style={s.checkCircle}>
          <Feather color={tokens.color.ink} name="check" size={30} />
        </View>
        <Text style={s.savedTitle}>Bookmark saved.</Text>
        <Text style={s.savedMeta}>
          Page {pageNumber} · {selectedBook?.title ?? "Piranesi"}
        </Text>
        <View style={[s.quoteCard, { alignSelf: "stretch" }]}>
          <Text style={[s.quoteText, { backgroundColor: hlColor + "44" }]}>{activeLine}</Text>
        </View>
        <View style={s.streakCard}>
          <View>
            <Text style={s.streakDay}>day 1</Text>
            <Text style={s.streakSub}>your streak begins tonight</Text>
          </View>
        </View>
      </View>
    </>
  );

  // ── step 7: share card ──────────────────────────────────────────

  const SHARE_ICONS: { icon: React.ComponentProps<typeof Feather>["name"]; label: string }[] = [
    { icon: "camera", label: "story" },
    { icon: "download", label: "save" },
    { icon: "share-2", label: "share" },
  ];

  const cardDateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const cardContent = (
    <>
      {/* top row: date + image controls */}
      <View style={s.cardHeaderRow}>
        <Text style={s.cardDate}>{cardDateLabel}</Text>
        {cardBgImage ? (
          <View style={s.cardImgActions}>
            <Pressable hitSlop={8} onPress={pickCardImage} style={s.cardImgBtn}>
              <Feather color="rgba(255,255,255,0.75)" name="edit-2" size={13} />
            </Pressable>
            <Pressable hitSlop={8} onPress={() => setCardBgImage(null)} style={s.cardImgBtn}>
              <Feather color="rgba(255,255,255,0.75)" name="x" size={13} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* center: import placeholder or spacer */}
      {!cardBgImage ? (
        <Pressable onPress={pickCardImage} style={s.cardImportBtn}>
          <Feather color={tokens.color.muted} name="image" size={26} />
          <Text style={s.cardImportText}>import image</Text>
        </Pressable>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      {/* quote */}
      <Text style={[s.cardQuoteLarge, { backgroundColor: hlColor + "55" }]}>
        {`"${activeLine}"`}
      </Text>
      <View style={s.cardDivider} />

      {/* attribution */}
      <Text style={s.cardAttrib}>
        pg. {pageNumber}
        {"  ·  "}
        {selectedBook?.author ?? "Susanna Clarke"}
      </Text>
      <View style={s.cardDivider} />
      <Text style={s.cardBookTitle}>{selectedBook?.title ?? "Piranesi"}</Text>

      {/* footer */}
      <View style={s.cardFooterRow}>
        <View style={{ flex: 1 }} />
        <Image
          resizeMode="contain"
          source={require("../../assets/transparent-white-logo.png")}
          style={s.cardBrandLogo}
        />
      </View>
    </>
  );

  const ShareCard = () => (
    <>
      <Progress />
      <SkipAll />
      <Text style={s.stepTitle}>Your share card.</Text>

      {cardBgImage ? (
        <ImageBackground
          imageStyle={{ borderRadius: tokens.radius.md }}
          source={{ uri: cardBgImage }}
          style={s.cardPreview}
        >
          <View style={s.cardOverlay}>{cardContent}</View>
        </ImageBackground>
      ) : (
        <View style={[s.cardPreview, { padding: sp[5] }]}>{cardContent}</View>
      )}

      <View style={s.shareIconRow}>
        {SHARE_ICONS.map(({ icon, label }) => (
          <View key={label} style={s.shareIconItem}>
            <View style={s.shareIconBox}>
              <Feather color={tokens.color.inkSoft} name={icon} size={20} />
            </View>
            <Text style={s.shareIconLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </>
  );

  // ── step 8: set the rhythm ──────────────────────────────────────

  const REMINDER_ITEMS = [
    {
      key: "daily" as const,
      icon: "bell" as const,
      title: "daily bookmark reminder",
      desc: "9:00 PM · A nudge to capture today's line.",
    },
    {
      key: "streak" as const,
      icon: "share-2" as const,
      title: "share streak reminder",
      desc: "9:30 PM · Keep your streak warm. Skip days are okay.",
    },
    {
      key: "read" as const,
      icon: "book" as const,
      title: "read reminder",
      desc: reminders.read ? "8:00 PM" : "off",
    },
  ];

  const SetRhythm = () => (
    <>
      <Progress />
      <SkipAll />
      <Text style={s.stepTitle}>Set the rhythm.</Text>
      <Text style={s.stepSub}>
        All reminders are scheduled locally. No push servers, no tracking.
      </Text>
      <View style={s.reminderList}>
        {REMINDER_ITEMS.map((item) => (
          <View key={item.key} style={s.reminderRow}>
            <View style={s.reminderIcon}>
              <Feather color={tokens.color.muted} name={item.icon} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.optionTitle}>{item.title}</Text>
              <Text style={s.optionDesc}>{item.desc}</Text>
            </View>
            <Switch
              onValueChange={(val) => setReminders((r) => ({ ...r, [item.key]: val }))}
              thumbColor={tokens.color.white}
              trackColor={{ false: tokens.color.border, true: tokens.color.accent }}
              value={reminders[item.key]}
            />
          </View>
        ))}
      </View>
    </>
  );

  // ── step 9: you're ready ────────────────────────────────────────

  const YoureReady = () => (
    <>
      <Progress />
      <View style={s.centeredGroup}>
        <View style={s.flameCircle}>
          <Image
            resizeMode="contain"
            source={require("../../assets/logo.png")}
            style={s.readyLogoMark}
          />
        </View>
        <Text style={s.readyTitle}>{"You're ready."}</Text>
        <Text style={s.readySub}>{"Your reading ritual starts tonight."}</Text>

        <View style={[s.quoteCard, { alignSelf: "stretch" }]}>
          <Text style={[s.quoteText, { backgroundColor: hlColor + "44" }]}>{activeLine}</Text>
          <Text style={s.quoteMeta}>
            pg. {pageNumber} · {selectedBook?.title ?? "Piranesi"}
          </Text>
        </View>

        <View style={s.statsRow}>
          <View style={s.statTile}>
            <Text style={s.statNum}>1</Text>
            <Text style={s.statLabel}>book</Text>
          </View>
          <View style={s.statTile}>
            <Text style={s.statNum}>1</Text>
            <Text style={s.statLabel}>bookmark</Text>
          </View>
          <View style={s.statTile}>
            <Text style={s.statNum}>1d</Text>
            <Text style={s.statLabel}>streak</Text>
          </View>
        </View>
      </View>
    </>
  );

  // ── step config ─────────────────────────────────────────────────

  const STEPS: { render: () => ReactElement; nav: NavConfig }[] = [
    { render: Welcome, nav: { label: "begin", onPress: next, showBack: false } },
    { render: Ritual, nav: { label: "i'm in", onPress: next, showBack: true } },
    { render: AddBook, nav: { label: "add this book", onPress: handleAddBook, showBack: true } },
    { render: WhatPage, nav: { label: "next", onPress: next, showBack: true } },
    { render: PickLine, nav: { label: "next", onPress: next, showBack: true } },
    { render: WhyThisLine, nav: { label: "save bookmark", onPress: next, showBack: true } },
    { render: BookmarkSaved, nav: { label: "see your share card", onPress: next, showBack: true } },
    { render: ShareCard, nav: { label: "continue", onPress: next, showBack: true } },
    { render: SetRhythm, nav: { label: "looks good", onPress: next, showBack: true } },
    { render: YoureReady, nav: { label: "enter inki", onPress: finish, showBack: true } },
  ];

  const current = STEPS[step] ?? STEPS[0]!;
  const isWelcome = step === 0;
  const isShareCard = step === 7;

  const BottomNav = () => (
    <View style={s.bottomBar}>
      <View style={s.bottomSeparator} />
      <View style={s.navRow}>
        {current.nav.showBack ? (
          <Pressable onPress={back} style={s.backBtn}>
            <Feather color={tokens.color.inkSoft} name="arrow-left" size={18} />
          </Pressable>
        ) : (
          <View style={s.backPlaceholder} />
        )}
        <Pressable onPress={current.nav.onPress} style={s.primaryBtn}>
          <Text style={s.primaryBtnText}>{current.nav.label}</Text>
          <Feather color={tokens.color.black} name="arrow-right" size={16} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.root}>
        {isWelcome ? (
          current.render()
        ) : isShareCard ? (
          <>
            <View style={s.shareCardWrap}>{current.render()}</View>
            <BottomNav />
          </>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={s.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {current.render()}
            </ScrollView>
            <BottomNav />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── styles ────────────────────────────────────────────────────────

const c = tokens.color;
const sp = tokens.space;
const r = tokens.radius;

const s = StyleSheet.create({
  root: { backgroundColor: c.canvas, flex: 1 },
  scrollContent: {
    flexGrow: 1,
    gap: sp[3],
    paddingBottom: sp[4],
    paddingHorizontal: sp[5],
    paddingTop: sp[4],
  },

  // fixed bottom bar
  bottomBar: { backgroundColor: c.canvas, paddingBottom: sp[4], paddingHorizontal: sp[5] },
  bottomSeparator: { backgroundColor: c.border, height: 1, marginBottom: sp[4] },
  navRow: { alignItems: "center", flexDirection: "row", gap: sp[2] },
  backBtn: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: r.pill,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  backPlaceholder: { width: 48 },
  primaryBtn: {
    alignItems: "center",
    backgroundColor: c.accent,
    borderRadius: r.pill,
    flex: 1,
    flexDirection: "row",
    gap: sp[2],
    justifyContent: "center",
    paddingHorizontal: sp[6],
    paddingVertical: 14,
  },
  primaryBtnText: { color: c.black, fontSize: 16, fontWeight: "800" },

  // progress
  progressRow: { flexDirection: "row", gap: 4, marginBottom: sp[5] },
  seg: { borderRadius: 1, flex: 1, height: 2 },
  segActive: { backgroundColor: c.accent },
  segOff: { backgroundColor: c.border },

  // skip all
  skipAll: { alignSelf: "flex-end", marginBottom: sp[2], marginTop: -sp[3] },
  skipAllText: { color: c.muted, fontSize: 14, fontWeight: "600" },

  // typography
  stepTitle: {
    color: c.ink,
    fontFamily: fontFamily.bold,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
  },
  stepSub: { color: c.inkSoft, fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 22 },
  eyebrow: {
    color: c.accent,
    fontFamily: fontFamily.bold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  colorLabel: {
    color: c.muted,
    fontFamily: fontFamily.bold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // ── welcome ──
  welcomeWrap: { flex: 1, paddingBottom: sp[8], paddingHorizontal: sp[5], paddingTop: sp[4] },
  welcomeCenter: { alignItems: "center", flex: 1, justifyContent: "center" },
  logoMark: { height: 140, marginBottom: -sp[10], width: 140 },
  logoWordmark: { height: 120, marginBottom: -sp[8], width: 300 },
  tagline: {
    alignSelf: "stretch",
    color: "rgba(200, 200, 200, 0.5)",
    fontFamily: fontFamily.boldItalic,
    fontSize: 24,
    lineHeight: 34,
    marginTop: sp[4],
    textAlign: "center",
  },
  taglineSub: {
    alignSelf: "stretch",
    color: c.muted,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: sp[3],
    textAlign: "center",
  },

  // ── ritual ──
  ritualList: { gap: sp[4] },
  ritualRow: { alignItems: "flex-start", flexDirection: "row", gap: sp[4] },
  ritualIcon: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: r.md,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  ritualNum: { color: c.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  ritualTitle: { color: c.ink, fontFamily: fontFamily.bold, fontSize: 16, fontWeight: "700" },
  ritualDesc: { color: c.inkSoft, fontSize: 13, lineHeight: 18, marginTop: 2 },

  // ── add book options ──
  optionList: { gap: sp[2] },
  optionRow: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderColor: c.border,
    borderRadius: r.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: sp[3],
    padding: sp[4],
  },
  optionSelected: { borderColor: c.accent },
  optionTitle: { color: c.ink, fontFamily: fontFamily.bold, fontSize: 15, fontWeight: "700" },
  optionDesc: { color: c.inkSoft, fontSize: 13, lineHeight: 18, marginTop: 2 },
  radioOff: { borderColor: c.border, borderRadius: 9, borderWidth: 1.5, height: 18, width: 18 },
  radioOn: { backgroundColor: c.accent, borderRadius: 9, height: 18, width: 18 },

  // ── manual block ──
  manualBlock: { gap: sp[2] },
  manualInput: {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderRadius: r.md,
    borderWidth: 1,
    color: c.ink,
    fontSize: 15,
    padding: sp[4],
  },

  // ── what page ──
  inputCard: {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderRadius: r.md,
    borderWidth: 1,
    padding: sp[4],
  },
  inputCardLabel: {
    color: c.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: sp[2],
    textTransform: "uppercase",
  },
  pageInput: { color: c.ink, fontSize: 42, fontWeight: "900" },
  cameraOption: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderColor: c.border,
    borderRadius: r.md,
    borderStyle: "dashed",
    borderWidth: 1.5,
    flexDirection: "row",
    gap: sp[3],
    padding: sp[4],
  },
  cameraTitle: { color: c.accent, fontSize: 14, fontWeight: "800" },
  cameraDesc: { color: c.muted, fontSize: 12, marginTop: 2 },

  // ── pick a line ──
  tabRow: { backgroundColor: c.surface, borderRadius: r.sm, flexDirection: "row", padding: 3 },
  tabActive: {
    alignItems: "center",
    backgroundColor: c.surfaceRaised,
    borderRadius: 6,
    flex: 1,
    paddingVertical: sp[2],
  },
  tabActiveText: { color: c.ink, fontSize: 13, fontWeight: "800" },
  tabInactive: { alignItems: "center", flex: 1, paddingVertical: sp[2] },
  tabInactiveText: { color: c.muted, fontSize: 13, fontWeight: "600" },
  lineOption: {
    backgroundColor: c.surface,
    borderColor: c.surface,
    borderRadius: r.md,
    borderWidth: 1,
    padding: sp[4],
  },
  lineText: { borderRadius: 4, color: c.ink, fontSize: 15, lineHeight: 22 },
  colorRow: { flexDirection: "row", gap: sp[3] },
  colorDot: { borderRadius: 20, height: 36, width: 36 },
  colorDotSelected: { borderColor: c.ink, borderWidth: 2.5 },

  // ── why this line ──
  quoteCard: { backgroundColor: c.surface, borderRadius: r.md, padding: sp[4] },
  quoteText: {
    borderRadius: 4,
    color: c.ink,
    fontSize: 15,
    lineHeight: 22,
    padding: 2,
    textDecorationLine: "underline",
  },
  quoteMeta: { color: c.muted, fontSize: 12, marginTop: sp[2] },
  noteInput: {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderRadius: r.md,
    borderWidth: 1,
    color: c.ink,
    fontSize: 15,
    minHeight: 80,
    padding: sp[4],
  },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: sp[2] },
  tagChip: {
    borderColor: c.border,
    borderRadius: r.pill,
    borderWidth: 1,
    paddingHorizontal: sp[3],
    paddingVertical: 7,
  },
  tagChipOn: { borderColor: c.accent },
  tagText: { color: c.muted, fontSize: 13, fontWeight: "600" },
  tagTextOn: { color: c.accent },

  // ── bookmark saved ──
  centeredGroup: {
    alignItems: "center",
    flex: 1,
    gap: sp[3],
    justifyContent: "center",
    paddingHorizontal: sp[2],
    paddingVertical: sp[6],
  },
  checkCircle: {
    alignItems: "center",
    borderColor: c.ink,
    borderRadius: 40,
    borderWidth: 1.5,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  savedTitle: {
    color: c.ink,
    fontFamily: fontFamily.bold,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  savedMeta: { color: c.muted, fontSize: 14, textAlign: "center" },
  streakCard: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: r.md,
    flexDirection: "row",
    gap: sp[4],
    padding: sp[4],
    width: "100%",
  },
  flame: { fontSize: 24 },
  streakDay: { color: c.ink, fontSize: 18, fontWeight: "900" },
  streakSub: { color: c.accentDark, fontSize: 13, marginTop: 2 },

  // ── share card ──
  cardPreview: { backgroundColor: c.surfaceMuted, borderRadius: r.md, flex: 1 },
  cardOverlay: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: r.md,
    flex: 1,
    padding: sp[5],
  },
  shareCardWrap: {
    flex: 1,
    gap: sp[3],
    paddingHorizontal: sp[5],
    paddingTop: sp[4],
  },
  cardImgActions: { flexDirection: "row", gap: sp[1] },
  cardImgBtn: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: r.xs,
    justifyContent: "center",
    padding: sp[1],
  },
  cardHeaderRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardDate: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "500" },
  cardImportBtn: {
    alignItems: "center",
    borderColor: c.border,
    borderRadius: r.md,
    borderStyle: "dashed",
    borderWidth: 1.5,
    flex: 1,
    gap: sp[2],
    justifyContent: "center",
    marginVertical: sp[3],
  },
  cardImportText: { color: c.muted, fontSize: 13, fontWeight: "700" },
  cardQuoteLarge: {
    borderRadius: 3,
    color: c.white,
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 30,
    marginBottom: sp[3],
    textDecorationLine: "none",
  },
  cardDivider: { backgroundColor: "rgba(255,255,255,0.25)", height: 1, marginVertical: sp[2] },
  cardAttrib: { color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "500" },
  cardBookTitle: { color: c.white, fontSize: 16, fontWeight: "800", marginBottom: sp[3] },
  cardFooterRow: { alignItems: "center", flexDirection: "row" },
  cardBrandLogo: { height: 30, width: 72, marginRight: -sp[4] },
  cardQuote: {
    borderRadius: 4,
    color: c.ink,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 26,
    padding: 4,
  },
  cardMeta: { color: c.muted, fontSize: 12, marginTop: sp[2] },
  cardBrand: { color: c.accent, fontSize: 12 },
  shareIconRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: sp[2] },
  shareIconItem: { alignItems: "center", gap: sp[1] },
  shareIconBox: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: r.md,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  shareIconLabel: { color: c.muted, fontSize: 11 },

  // ── set rhythm ──
  reminderList: { gap: sp[2] },
  reminderRow: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: r.md,
    flexDirection: "row",
    gap: sp[3],
    padding: sp[4],
  },
  reminderIcon: { alignItems: "center", justifyContent: "center", width: 32 },

  // ── you're ready ──
  flameCircle: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderRadius: 56,
    height: 115,
    justifyContent: "center",
    width: 112,
  },
  readyLogoMark: { height: 100, width: 100 },
  readyTitle: {
    color: c.ink,
    fontFamily: fontFamily.bold,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 44,
    paddingBottom: 4,
    textAlign: "center",
  },
  readySub: {
    color: c.inkSoft,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  statsRow: { flexDirection: "row", gap: sp[3], marginTop: sp[2], alignSelf: "stretch" },
  statTile: {
    alignItems: "center",
    backgroundColor: c.surface,
    borderColor: c.border,
    borderRadius: r.md,
    borderWidth: 1,
    flex: 1,
    gap: sp[1],
    paddingVertical: sp[4],
  },
  statNum: { color: c.ink, fontFamily: fontFamily.bold, fontSize: 26, fontWeight: "700" },
  statLabel: {
    color: c.muted,
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
