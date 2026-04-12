import "./env";

import OpenAI from "openai";
import { CONTENT_POLICY_NOTES } from "../../../packages/shared/src";
import { getPapersMissingSummaries, pool, saveImage, saveSummary } from "./db";

const modelName = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const imageModel = process.env.IMAGE_MODEL ?? "gpt-image-1";
const enableAiImages = process.env.ENABLE_AI_IMAGES === "true";
const openAiBaseUrl = process.env.OPENAI_BASE_URL;

const client =
  process.env.OPENAI_API_KEY || openAiBaseUrl
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? "local-model",
        baseURL: openAiBaseUrl || undefined
      })
    : null;

function heuristicSummary(title: string, journal: string, articleType: string) {
  const shortSummary = `${title} appears in ${journal} and is currently framed as a ${articleType.toLowerCase()} worth reviewing directly in the original source.`;
  const longSummary =
    "This fallback summary keeps the feed usable before an external language model is configured. It avoids medical advice, avoids causal overclaiming, and pushes readers to inspect the source article.";

  return {
    shortSummary,
    longSummary,
    whyItMatters: "It keeps the feed readable while preserving a cautious, source-first workflow.",
    takeaway: "One-line takeaway: useful enough to scan quickly, but still worth validating in the source.",
    clinicalImpact: "Treat as directional signal rather than direct practice guidance until you review the source paper.",
    methodQuality: `${articleType} framing suggests the paper may be informative, but the original methods determine how much confidence it deserves.`,
    whoItsFor: "Best for professionals and students tracking this field who want a quick first-pass summary.",
    qualityFlags: ["fallback-summary"]
  };
}

async function generateSummary(title: string, journal: string, articleType: string) {
  if (!client) {
    return heuristicSummary(title, journal, articleType);
  }

  const prompt = [
    "You are generating a summary for a scientific research discovery feed.",
    "Return strict JSON with keys shortSummary, longSummary, whyItMatters, takeaway, clinicalImpact, methodQuality, whoItsFor, qualityFlags.",
    "Keep tone cautious, plain language, and never provide medical advice.",
    "Mention if the evidence is early or limited when details are sparse.",
    "The takeaway must be one sentence and optimized for fast skimming.",
    "ClinicalImpact should explain what this might change in care or why it probably should not change care yet.",
    "MethodQuality should explain the likely confidence level in plain language.",
    "WhoItsFor should name the audience who benefits most from reading this paper.",
    `Title: ${title}`,
    `Journal: ${journal}`,
    `ArticleType: ${articleType}`,
    `Content constraints: ${CONTENT_POLICY_NOTES.join(" ")}`
  ].join("\n");

  const response = await client.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" }
  });

  const output = response.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(output) as {
    shortSummary?: string;
    longSummary?: string;
    whyItMatters?: string;
    takeaway?: string;
    clinicalImpact?: string;
    methodQuality?: string;
    whoItsFor?: string;
    qualityFlags?: string[];
  };

  const fallback = heuristicSummary(title, journal, articleType);

  return {
    shortSummary: parsed.shortSummary ?? fallback.shortSummary,
    longSummary: parsed.longSummary ?? fallback.longSummary,
    whyItMatters: parsed.whyItMatters ?? null,
    takeaway: parsed.takeaway ?? fallback.takeaway,
    clinicalImpact: parsed.clinicalImpact ?? fallback.clinicalImpact,
    methodQuality: parsed.methodQuality ?? fallback.methodQuality,
    whoItsFor: parsed.whoItsFor ?? fallback.whoItsFor,
    qualityFlags: Array.isArray(parsed.qualityFlags) ? parsed.qualityFlags : []
  };
}

function shouldSkipImage(title: string) {
  const lower = title.toLowerCase();
  return lower.includes("mri") || lower.includes("x-ray") || lower.includes("ct") || lower.includes("diagnostic");
}

async function generateImagePrompt(title: string, summary: string) {
  return `Create a clean editorial illustration for a scientific news card. Use abstract shapes, muted colors, and biomechanical or data-inspired forms. Do not include charts, medical scans, or realistic anatomy. Title: ${title}. Summary: ${summary}`;
}

async function maybeGenerateImage(paperId: string, title: string, summary: string) {
  const prompt = await generateImagePrompt(title, summary);

  if (!enableAiImages || shouldSkipImage(title) || !client) {
    await saveImage({
      paperId,
      prompt,
      imageUrl: null,
      status: "skipped",
      moderationNotes: enableAiImages ? ["image-skipped-by-policy"] : ["image-flag-disabled"],
      modelName: imageModel
    });
    return;
  }

  const image = await client.images.generate({
    model: imageModel,
    prompt,
    size: "1024x1024"
  });

  const imageUrl = image.data?.[0]?.url ?? null;

  await saveImage({
    paperId,
    prompt,
    imageUrl,
    status: imageUrl ? "ready" : "skipped",
    moderationNotes: [],
    modelName: imageModel
  });
}

async function processQueue() {
  while (true) {
    const papers = await getPapersMissingSummaries(25);

    if (papers.length === 0) {
      break;
    }

    for (const paper of papers) {
      const summary = await generateSummary(paper.title, paper.journal, paper.article_type);

      await saveSummary({
        paperId: paper.id,
        shortSummary: summary.shortSummary,
        longSummary: summary.longSummary,
        whyItMatters: summary.whyItMatters,
        takeaway: summary.takeaway,
        clinicalImpact: summary.clinicalImpact,
        methodQuality: summary.methodQuality,
        whoItsFor: summary.whoItsFor,
        qualityFlags: summary.qualityFlags,
        modelName: client ? modelName : "heuristic-fallback"
      });

      await maybeGenerateImage(paper.id, paper.title, summary.shortSummary);
      console.log(`Processed AI enrichment for ${paper.id}`);
    }
  }
}

try {
  await processQueue();
} finally {
  await pool.end();
}
