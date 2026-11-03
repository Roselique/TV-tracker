export type MediaType = "SERIES" | "MOVIE";
export type WatchStatus =
  | "PLAN_TO_WATCH"
  | "WATCHING"
  | "ON_HOLD"
  | "COMPLETED"
  | "DROPPED";

export interface Title {
  id: string;
  name: string;
  type: MediaType;
  status: WatchStatus;
  posterUrl: string | null;
  watchUrl: string | null;
  tags: string;
  currentSeason: number;
  currentEpisode: number;
  totalSeasons: number | null;
  totalEpisodes: number | null;
  rating: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<WatchStatus, string> = {
  PLAN_TO_WATCH: "Plan to Watch",
  WATCHING: "Watching",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};

export const STATUS_ORDER: WatchStatus[] = [
  "WATCHING",
  "PLAN_TO_WATCH",
  "ON_HOLD",
  "COMPLETED",
  "DROPPED",
];

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function serializeTags(tags: string[]): string {
  return tags.map((t) => t.trim()).filter(Boolean).join(",");
}
