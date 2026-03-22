import "server-only";
import { parseRoastAnalysisResult, type RoastAnalysisResult } from "./types";

export function parseGeminiRoastResponse(raw: string): RoastAnalysisResult {
  return parseRoastAnalysisResult(raw);
}
