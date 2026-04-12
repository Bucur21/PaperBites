import { TOPIC_MAP } from "@research-feed/shared";
import type { TopicId } from "@research-feed/shared";

export type VisualMotif = "waveform" | "network" | "motion" | "pulse" | "grid" | "spectrum";

const TOPIC_MOTIF: Record<TopicId, VisualMotif> = {
  wearables: "waveform",
  biomechanics: "motion",
  "ai-health": "network",
  rehabilitation: "motion",
  "sports-performance": "spectrum",
  musculoskeletal: "pulse",
  "digital-biomarkers": "grid",
  "clinical-ml": "network"
};

/** Title/summary keyword hints → motif override (still abstract, not diagnostic imagery). */
const TITLE_MOTIF_RULES: Array<{ test: RegExp; motif: VisualMotif }> = [
  { test: /\b(ecg|ekg|electrocardiogram|heart rate|cardiac|arrhythmia)\b/i, motif: "waveform" },
  { test: /\b(eeg|brain|neuro|neural)\b/i, motif: "network" },
  { test: /\b(machine learning|deep learning|neural network|transformer|llm)\b/i, motif: "network" },
  { test: /\b(accelerometer|imu|gyro|sensor|wearable|smartwatch)\b/i, motif: "waveform" },
  { test: /\b(gait|stride|walking|locomotion|kinematic|kinetic)\b/i, motif: "motion" },
  { test: /\b(sleep|circadian)\b/i, motif: "spectrum" },
  { test: /\b(bone|tendon|joint|spine|orthopedic|fracture)\b/i, motif: "pulse" },
  { test: /\b(biomarker|phenotyp|digital health)\b/i, motif: "grid" }
];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickMotif(topicIds: TopicId[], title: string, summary: string): VisualMotif {
  const blob = `${title}\n${summary}`;
  for (const rule of TITLE_MOTIF_RULES) {
    if (rule.test.test(blob)) {
      return rule.motif;
    }
  }

  for (const id of topicIds) {
    const keywords = TOPIC_MAP[id]?.keywords ?? [];
    for (const kw of keywords) {
      if (kw.length > 3 && blob.toLowerCase().includes(kw.toLowerCase())) {
        return TOPIC_MOTIF[id];
      }
    }
  }

  const primary = topicIds[0];
  if (primary && TOPIC_MOTIF[primary]) {
    return TOPIC_MOTIF[primary];
  }

  return "waveform";
}

function hueRangeForTopic(primary: TopicId | undefined): { base: number; spread: number } {
  switch (primary) {
    case "wearables":
      return { base: 32, spread: 14 };
    case "biomechanics":
    case "rehabilitation":
    case "sports-performance":
    case "musculoskeletal":
      return { base: 28, spread: 12 };
    case "ai-health":
    case "clinical-ml":
      return { base: 38, spread: 18 };
    case "digital-biomarkers":
      return { base: 35, spread: 16 };
    default:
      return { base: 30, spread: 15 };
  }
}

export interface ArticleVisualTheme {
  motif: VisualMotif;
  caption: string;
  safeId: string;
  hueA: number;
  hueB: number;
  hueC: number;
  accentHue: number;
}

export function getArticleVisualTheme(input: {
  seed: string;
  topicIds: TopicId[];
  title: string;
  summary?: string;
}): ArticleVisualTheme {
  const summary = input.summary ?? "";
  const primary = input.topicIds[0];
  const motif = pickMotif(input.topicIds, input.title, summary);
  const { base, spread } = hueRangeForTopic(primary);

  const h = hashString(`${input.seed}|${input.title}|${motif}`);
  const hueA = base + (h % spread);
  const hueB = base + ((h >> 8) % spread);
  const hueC = base + ((h >> 16) % Math.max(6, spread - 4));
  const accentHue = primary === "ai-health" || primary === "clinical-ml" ? 285 + (h % 25) : hueA + 8;

  const label = primary ? TOPIC_MAP[primary]?.label ?? primary : "Research";
  const motifCaption: Record<VisualMotif, string> = {
    waveform: "Signal · monitoring",
    network: "Models · inference",
    motion: "Movement · mechanics",
    pulse: "Structure · load",
    grid: "Markers · phenotypes",
    spectrum: "Performance · load"
  };

  const safeId = input.seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "img";

  return {
    motif,
    caption: `${label} · ${motifCaption[motif]}`,
    safeId,
    hueA,
    hueB,
    hueC,
    accentHue
  };
}
