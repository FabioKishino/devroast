import { createTRPCRouter } from "../init";
import { leaderboardRouter } from "./leaderboard";

export const appRouter = createTRPCRouter({
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
