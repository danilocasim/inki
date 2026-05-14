import type { ReactElement, RefObject } from "react";
import { useMemo, useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

import type { Book } from "../../books/types";
import { Text } from "../../../ui/Text";
import { fontFamily, tokens } from "../../../ui/tokens";

const HIGHLIGHT = tokens.color.gold;

type TemplateId = "quote" | "cover-left" | "cover-center";

interface TemplateOption {
  id: TemplateId;
  label: string;
  description: string;
}

const TEMPLATES: readonly TemplateOption[] = [
  { id: "quote", label: "Quote", description: "no cover · attribution shown" },
  { id: "cover-left", label: "Cover left", description: "large cover, quote below" },
  { id: "cover-center", label: "Cover center", description: "centered cover, quote below" },
];

export interface BookShareScreenProps {
  book: Book;
  initialQuote?: string | undefined;
  onClose: () => void;
}

type Step = "photo" | "template" | "preview";

export function BookShareScreen({
  book,
  initialQuote,
  onClose,
}: BookShareScreenProps): ReactElement {
  const [step, setStep] = useState<Step>("photo");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<TemplateId>("cover-left");
  const [quote, setQuote] = useState(
    initialQuote && initialQuote.trim().length > 0
      ? initialQuote
      : "Tap to write the line that stayed with you.",
  );
  const [editingQuote, setEditingQuote] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | undefined>();
  const cardRef = useRef<View | null>(null);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const pickFromLibrary = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [3, 4],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStep("template");
    }
  };

  const takePhoto = async (): Promise<void> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setStep("template");
    }
  };

  const goBack = (): void => {
    if (step === "preview") setStep("template");
    else if (step === "template") setStep("photo");
    else onClose();
  };

  const captureAndShare = async (
    targetRef: RefObject<View | null>,
    label: string,
  ): Promise<void> => {
    if (!targetRef.current) {
      setShareMessage("share card not ready yet");
      return;
    }
    setShareLoading(true);
    setShareMessage(undefined);
    try {
      const outputPath = await captureRef(targetRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(outputPath, {
          dialogTitle: label,
          mimeType: "image/png",
          UTI: "public.png",
        });
      }
      setShareMessage("card ready to share");
    } catch (caught) {
      setShareMessage(caught instanceof Error ? caught.message : "Unable to share this card.");
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.root}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          hitSlop={12}
          onPress={goBack}
          style={styles.iconBtn}
        >
          <Feather color={tokens.color.ink} name="arrow-left" size={20} />
        </Pressable>
        <View style={styles.stepRow}>
          {(["photo", "template", "preview"] as Step[]).map((s, i) => {
            const reached = stepIndex(step) >= i;
            return (
              <View key={s} style={[styles.stepSeg, reached ? styles.stepSegActive : undefined]} />
            );
          })}
        </View>
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClose}
          style={styles.iconBtn}
        >
          <Feather color={tokens.color.ink} name="x" size={20} />
        </Pressable>
      </View>

      {step === "photo" ? (
        <PhotoStep onPickLibrary={pickFromLibrary} onTakePhoto={takePhoto} />
      ) : null}

      {step === "template" && photoUri ? (
        <TemplateStep
          book={book}
          dateLabel={dateLabel}
          onPick={(id) => {
            setTemplateId(id);
            setStep("preview");
          }}
          photoUri={photoUri}
          quote={quote}
          selected={templateId}
        />
      ) : null}

      {step === "preview" && photoUri ? (
        <PreviewStep
          book={book}
          cardRef={cardRef}
          dateLabel={dateLabel}
          editingQuote={editingQuote}
          onPickPhoto={pickFromLibrary}
          onShare={() => void captureAndShare(cardRef, "Share Inki card")}
          onSave={() => void captureAndShare(cardRef, "Save Inki card")}
          onStory={() => void captureAndShare(cardRef, "Send to story")}
          onToggleEditQuote={() => setEditingQuote((current) => !current)}
          photoUri={photoUri}
          quote={quote}
          setQuote={setQuote}
          shareLoading={shareLoading}
          shareMessage={shareMessage}
          templateId={templateId}
        />
      ) : null}
    </SafeAreaView>
  );
}

const stepIndex = (step: Step): number =>
  step === "photo" ? 0 : step === "template" ? 1 : 2;

function PhotoStep({
  onPickLibrary,
  onTakePhoto,
}: {
  onPickLibrary: () => void;
  onTakePhoto: () => void;
}): ReactElement {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Add a photo.</Text>
      <Text style={styles.stepSub}>
        Take a quick shot or pick one from your library. Your share card lives on top of it.
      </Text>

      <Pressable accessibilityRole="button" onPress={onTakePhoto} style={styles.bigBtn}>
        <Feather color={tokens.color.black} name="camera" size={22} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bigBtnTitle}>Take a photo</Text>
          <Text style={styles.bigBtnSub}>open the camera</Text>
        </View>
        <Feather color={tokens.color.black} name="arrow-right" size={18} />
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onPickLibrary} style={styles.outlineBtn}>
        <Feather color={tokens.color.accent} name="image" size={22} />
        <View style={{ flex: 1 }}>
          <Text style={styles.outlineBtnTitle}>Pick from library</Text>
          <Text style={styles.outlineBtnSub}>choose an existing photo</Text>
        </View>
        <Feather color={tokens.color.accent} name="arrow-right" size={18} />
      </Pressable>
    </View>
  );
}

function TemplateStep({
  book,
  dateLabel,
  onPick,
  photoUri,
  quote,
  selected,
}: {
  book: Book;
  dateLabel: string;
  onPick: (id: TemplateId) => void;
  photoUri: string;
  quote: string;
  selected: TemplateId;
}): ReactElement {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Pick a template.</Text>
      <Text style={styles.stepSub}>How should the book sit on your photo?</Text>

      <ScrollView
        contentContainerStyle={styles.templateGrid}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {TEMPLATES.map((tpl) => (
          <Pressable
            accessibilityLabel={`Template ${tpl.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: selected === tpl.id }}
            key={tpl.id}
            onPress={() => onPick(tpl.id)}
            style={[
              styles.templateTile,
              selected === tpl.id ? styles.templateTileSelected : undefined,
            ]}
          >
            <View style={styles.templatePreview}>
              <ShareCardArt
                book={book}
                dateLabel={dateLabel}
                photoUri={photoUri}
                quote={quote}
                scale={0.34}
                templateId={tpl.id}
              />
            </View>
            <View style={styles.templateMeta}>
              <Text style={styles.templateLabel}>{tpl.label}</Text>
              <Text style={styles.templateDesc}>{tpl.description}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function PreviewStep({
  book,
  cardRef,
  dateLabel,
  editingQuote,
  onPickPhoto,
  onSave,
  onShare,
  onStory,
  onToggleEditQuote,
  photoUri,
  quote,
  setQuote,
  shareLoading,
  shareMessage,
  templateId,
}: {
  book: Book;
  cardRef: RefObject<View | null>;
  dateLabel: string;
  editingQuote: boolean;
  onPickPhoto: () => void;
  onSave: () => void;
  onShare: () => void;
  onStory: () => void;
  onToggleEditQuote: () => void;
  photoUri: string;
  quote: string;
  setQuote: (value: string) => void;
  shareLoading: boolean;
  shareMessage: string | undefined;
  templateId: TemplateId;
}): ReactElement {
  return (
    <View style={styles.previewWrap}>
      <View style={styles.previewToolbar}>
        <Pressable hitSlop={8} onPress={onPickPhoto} style={styles.previewToolBtn}>
          <Feather color={tokens.color.ink} name="image" size={14} />
          <Text style={styles.previewToolText}>photo</Text>
        </Pressable>
        <Pressable hitSlop={8} onPress={onToggleEditQuote} style={styles.previewToolBtn}>
          <Feather color={tokens.color.ink} name="edit-2" size={14} />
          <Text style={styles.previewToolText}>quote</Text>
        </Pressable>
      </View>

      <View collapsable={false} ref={cardRef} style={styles.cardSurface}>
        <ShareCardArt
          book={book}
          dateLabel={dateLabel}
          editingQuote={editingQuote}
          onChangeQuote={setQuote}
          photoUri={photoUri}
          quote={quote}
          templateId={templateId}
        />
      </View>

      {shareMessage ? <Text style={styles.shareMessage}>{shareMessage}</Text> : null}

      <View style={styles.actionsRow}>
        <ActionIcon disabled={shareLoading} icon="camera" label="story" onPress={onStory} />
        <ActionIcon disabled={shareLoading} icon="download" label="save" onPress={onSave} />
        <ActionIcon disabled={shareLoading} icon="share-2" label="share" onPress={onShare} />
      </View>
    </View>
  );
}

function ActionIcon({
  disabled,
  icon,
  label,
  onPress,
}: {
  disabled: boolean;
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.actionItem, pressed ? { opacity: 0.7 } : undefined]}
    >
      <View style={styles.actionBox}>
        <Feather color={tokens.color.inkSoft} name={icon} size={20} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

interface ShareCardArtProps {
  book: Book;
  dateLabel: string;
  editingQuote?: boolean;
  onChangeQuote?: (value: string) => void;
  photoUri: string;
  quote: string;
  scale?: number;
  templateId: TemplateId;
}

function ShareCardArt({
  book,
  dateLabel,
  editingQuote = false,
  onChangeQuote,
  photoUri,
  quote,
  scale = 1,
  templateId,
}: ShareCardArtProps): ReactElement {
  const hasCover = Boolean(book.coverPath);
  const isQuoteTemplate = templateId === "quote";
  const isLeftCover = templateId === "cover-left";

  const QuoteBlock = (
    <View
      style={[
        styles.cardQuoteBlock,
        scaled({ paddingHorizontal: 8, paddingVertical: 6 }, scale),
      ]}
    >
      {editingQuote && onChangeQuote ? (
        <TextInput
          multiline
          onChangeText={onChangeQuote}
          placeholder="Type the line…"
          placeholderTextColor="rgba(255,255,255,0.6)"
          style={[styles.cardQuoteText, scaled({ fontSize: 22, lineHeight: 30 }, scale)]}
          value={quote}
        />
      ) : (
        <Text style={[styles.cardQuoteText, scaled({ fontSize: 22, lineHeight: 30 }, scale)]}>
          {`"${quote.replace(/^"|"$/g, "")}"`}
        </Text>
      )}
    </View>
  );

  const Attribution = (
    <View style={scaled({ marginTop: 14 }, scale)}>
      <View style={styles.cardDivider} />
      <Text style={[styles.cardAttrib, scaled({ fontSize: 14, paddingVertical: 4 }, scale)]}>
        pg. {book.currentPage || 0}  ·  {book.author}
      </Text>
      <View style={styles.cardDivider} />
      <Text style={[styles.cardBookTitle, scaled({ fontSize: 22, paddingVertical: 6 }, scale)]}>
        {book.title}
      </Text>
    </View>
  );

  const Brand = (
    <View style={[styles.cardFooterRow, scaled({ marginTop: 14 }, scale)]}>
      <View style={{ flex: 1 }} />
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={require("../../../assets/transparent-white-logo.png")}
        style={scaled({ height: 28, width: 70 }, scale)}
      />
    </View>
  );

  return (
    <ImageBackground
      imageStyle={styles.cardImage}
      resizeMode="cover"
      source={{ uri: photoUri }}
      style={styles.cardArt}
    >
      <View style={[styles.cardOverlay, scaled({ padding: 22 }, scale)]}>
        <Text style={[styles.cardDate, scaled({ fontSize: 15 }, scale)]}>{dateLabel}</Text>

        {/* cover-left: cover takes the upper-left, large, like 10.png */}
        {isLeftCover && hasCover ? (
          <View
            style={[
              styles.coverLeft,
              scaled({ height: 260, marginTop: 18, width: 165 }, scale),
            ]}
          >
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="cover"
              source={{ uri: book.coverPath }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : null}

        {/* cover-center: centered upper cover, like 13.png */}
        {templateId === "cover-center" && hasCover ? (
          <View
            style={[
              styles.coverCenter,
              scaled({ height: 260, marginTop: 18, width: 170 }, scale),
            ]}
          >
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="cover"
              source={{ uri: book.coverPath }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : null}

        <View style={{ flex: 1 }} />
        {QuoteBlock}
        {isQuoteTemplate ? Attribution : null}
        {Brand}
      </View>
    </ImageBackground>
  );
}

const scaled = (
  obj: Record<string, number>,
  scale: number,
): Record<string, number> => {
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(obj)) {
    next[key] = value * scale;
  }
  return next;
};

const styles = StyleSheet.create({
  actionBox: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  actionItem: { alignItems: "center", gap: 4 },
  actionLabel: { color: tokens.color.muted, fontSize: 11 },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: tokens.space[3],
  },
  bigBtn: {
    alignItems: "center",
    backgroundColor: tokens.color.accent,
    borderRadius: tokens.radius.lg,
    flexDirection: "row",
    gap: tokens.space[3],
    padding: tokens.space[4],
  },
  bigBtnSub: { color: tokens.color.black, fontSize: 12, opacity: 0.7 },
  bigBtnTitle: { color: tokens.color.black, fontSize: 16, fontWeight: "800" },
  cardArt: {
    aspectRatio: 9 / 16,
    backgroundColor: tokens.color.black,
    borderRadius: tokens.radius.md,
    flex: 1,
    overflow: "hidden",
  },
  cardAttrib: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  cardBookTitle: {
    color: tokens.color.white,
    fontFamily: fontFamily.bold,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  coverCenter: {
    alignSelf: "center",
    borderRadius: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  coverLeft: {
    alignSelf: "flex-start",
    borderRadius: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  cardDate: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "500" },
  cardDivider: { backgroundColor: "rgba(255,255,255,0.25)", height: 1, marginVertical: 6 },
  cardFooterRow: { alignItems: "center", flexDirection: "row" },
  cardImage: { borderRadius: tokens.radius.md },
  cardOverlay: { backgroundColor: "rgba(0,0,0,0.35)", flex: 1, padding: 20 },
  cardQuoteBlock: { backgroundColor: HIGHLIGHT + "BB", borderRadius: 3, padding: 6 },
  cardQuoteText: {
    color: tokens.color.white,
    fontFamily: fontFamily.bold,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
  },
  cardSurface: { aspectRatio: 9 / 16, alignSelf: "stretch" },
  iconBtn: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  outlineBtn: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.accent,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: tokens.space[3],
    padding: tokens.space[4],
  },
  outlineBtnSub: { color: tokens.color.muted, fontSize: 12 },
  outlineBtnTitle: { color: tokens.color.ink, fontSize: 16, fontWeight: "800" },
  previewToolBtn: {
    alignItems: "center",
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
  },
  previewToolText: { color: tokens.color.ink, fontSize: 12, fontWeight: "700" },
  previewToolbar: { flexDirection: "row", gap: tokens.space[2] },
  previewWrap: { flex: 1, gap: tokens.space[3], padding: tokens.space[5] },
  root: { backgroundColor: tokens.color.canvas, flex: 1 },
  shareMessage: { color: tokens.color.accent, textAlign: "center" },
  stepRow: { flex: 1, flexDirection: "row", gap: 4, paddingHorizontal: tokens.space[3] },
  stepSeg: {
    backgroundColor: tokens.color.border,
    borderRadius: 1,
    flex: 1,
    height: 3,
  },
  stepSegActive: { backgroundColor: tokens.color.accent },
  stepSub: { color: tokens.color.inkSoft, fontSize: 15, lineHeight: 22 },
  stepTitle: {
    color: tokens.color.ink,
    fontFamily: fontFamily.bold,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
  },
  stepWrap: { flex: 1, gap: tokens.space[3], padding: tokens.space[5] },
  templateDesc: { color: tokens.color.muted, fontSize: 12 },
  templateGrid: { flexDirection: "row", flexWrap: "wrap", gap: tokens.space[3] },
  templateLabel: { color: tokens.color.ink, fontSize: 14, fontWeight: "800" },
  templateMeta: { gap: 2, padding: tokens.space[2] },
  templatePreview: {
    aspectRatio: 9 / 16,
    backgroundColor: tokens.color.black,
    overflow: "hidden",
  },
  templateTile: {
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    overflow: "hidden",
    width: "47%",
  },
  templateTileSelected: { borderColor: tokens.color.accent, borderWidth: 2 },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: tokens.space[2],
    padding: tokens.space[4],
  },
});
