import "server-only";
import { type RoastAnalysisResult, roastAnalysisResultSchema } from "./types";

export function parseGeminiRoastResponse(raw: string): RoastAnalysisResult {
  const payload = JSON.parse(raw);

  return roastAnalysisResultSchema.parse(payload);
}
