import { z } from "zod";

export const roastSeveritySchema = z.enum(["critical", "warning", "good"]);

export const roastDiffLineTypeSchema = z.enum(["added", "removed", "context"]);

export const roastAnalysisItemSchema = z.object({
  severity: roastSeveritySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
});

export const roastDiffSuggestionSchema = z.object({
  lineType: roastDiffLineTypeSchema,
  content: z.string(),
  lineNumber: z.number().int().positive(),
});

export const roastAnalysisResultSchema = z.object({
  score: z.number().min(0).max(10),
  roastQuote: z.string().trim().min(1),
  analysisItems: z.array(roastAnalysisItemSchema),
  diffSuggestions: z.array(roastDiffSuggestionSchema),
});

export type RoastAnalysisItem = z.infer<typeof roastAnalysisItemSchema>;
export type RoastDiffSuggestion = z.infer<typeof roastDiffSuggestionSchema>;
export type RoastAnalysisResult = z.infer<typeof roastAnalysisResultSchema>;
