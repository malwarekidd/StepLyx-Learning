import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { localDateString } from "@/lib/game-logic";
import { getChatHistory, getDashboard, getLeaderboard } from "@/lib/learn.functions";

export const dashboardQuery = () =>
  queryOptions({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard({ data: { localDate: localDateString() } }),
    staleTime: 30_000,
  });

export const useDashboard = () => useSuspenseQuery(dashboardQuery());
export const useDashboardMaybe = () => useQuery(dashboardQuery());

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

export const leaderboardQuery = (scope: "global" | "topic", curriculumKey?: string, lessonId?: string) =>
  queryOptions({
    queryKey: ["leaderboard", scope, curriculumKey ?? "", lessonId ?? ""],
    queryFn: () =>
      getLeaderboard({
        data: { scope, ...(curriculumKey ? { curriculumKey } : {}), ...(lessonId ? { lessonId } : {}) },
      }),
    staleTime: 15_000,
  });

export const chatHistoryQuery = () =>
  queryOptions({ queryKey: ["chat-history"], queryFn: () => getChatHistory(), staleTime: Infinity });
