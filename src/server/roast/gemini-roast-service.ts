import "server-only";
import { GoogleGenAI } from "@google/genai";
import { parseRoastAnalysisResult, type RoastAnalysisResult } from "./types";

export const GEMINI_MODEL_ID = "gemini-2.5-flash";

type BuildRoastPromptInput = {
  code: string;
  roastMode: boolean;
  language?: string;
};

type AnalyzeCodeWithGeminiInput = BuildRoastPromptInput;

type GeminiClient = {
  models: {
    generateContent: (params: {
      model: string;
      contents: string;
      config: {
        responseMimeType: string;
      };
    }) => Promise<{ text?: string }>;
  };
};

type AnalyzeCodeWithGeminiOptions = {
  clientFactory?: (apiKey: string) => GeminiClient;
};

export function buildRoastPrompt({
  code,
  roastMode,
  language,
}: BuildRoastPromptInput): string {
  const normalizedLanguage = language?.trim() || "plaintext";
  const toneInstruction = roastMode
    ? "Use a sarcastic persona with witty and sharp jokes, but keep feedback useful."
    : "Use a technical and direct tone. Be concise and specific.";

  return [
    "You are a senior code reviewer.",
    toneInstruction,
    "Respond with JSON only and no markdown fences.",
    "The JSON must match this exact shape:",
    '{"score":number,"roastQuote":string,"analysisItems":[{"severity":"critical|warning|good","title":string,"description":string,"sortOrder":number}],"diffSuggestions":[{"lineType":"added|removed|context","content":string,"lineNumber":number}]}',
    `Language: ${normalizedLanguage}`,
    "Code:",
    code,
  ].join("\n");
}

export function parseGeminiRoastResponse(raw: string): RoastAnalysisResult {
  return parseRoastAnalysisResult(raw);
}

export async function analyzeCodeWithGemini({
  code,
  roastMode,
  language,
  clientFactory,
}: AnalyzeCodeWithGeminiInput &
  AnalyzeCodeWithGeminiOptions): Promise<RoastAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "Gemini service is not configured: GEMINI_API_KEY is missing or blank"
    );
  }

  const createClient =
    clientFactory ??
    ((resolvedApiKey: string) => new GoogleGenAI({ apiKey: resolvedApiKey }));

  const client = createClient(apiKey);
  const prompt = buildRoastPrompt({ code, roastMode, language });

  let response: { text?: string };

  try {
    response = await client.models.generateContent({
      model: GEMINI_MODEL_ID,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
  } catch (error) {
    throw new Error("Gemini request failed", { cause: error });
  }

  if (!response.text) {
    throw new Error("Gemini returned empty response");
  }

  return parseGeminiRoastResponse(response.text);
}
