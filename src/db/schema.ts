import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const severityEnum = pgEnum("severity", ["critical", "warning", "good"]);

export const diffLineTypeEnum = pgEnum("diff_line_type", [
  "added",
  "removed",
  "context",
]);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid().defaultRandom().primaryKey(),
    code: text().notNull(),
    language: varchar({ length: 64 }).notNull().default("plaintext"),
    linesCount: integer().notNull(),
    roastMode: boolean().notNull().default(false),
    score: numeric({ precision: 4, scale: 2 }),
    roastQuote: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("submissions_score_idx").on(
      t.score.asc().nullsLast(),
      t.createdAt.desc()
    ),
  ]
);

export const analysisItems = pgTable("analysis_items", {
  id: uuid().defaultRandom().primaryKey(),
  submissionId: uuid()
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  severity: severityEnum().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  sortOrder: integer().notNull().default(0),
});

export const diffSuggestions = pgTable("diff_suggestions", {
  id: uuid().defaultRandom().primaryKey(),
  submissionId: uuid()
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  lineType: diffLineTypeEnum().notNull(),
  content: text().notNull(),
  lineNumber: integer().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type AnalysisItem = typeof analysisItems.$inferSelect;
export type NewAnalysisItem = typeof analysisItems.$inferInsert;
export type DiffSuggestion = typeof diffSuggestions.$inferSelect;
export type NewDiffSuggestion = typeof diffSuggestions.$inferInsert;
