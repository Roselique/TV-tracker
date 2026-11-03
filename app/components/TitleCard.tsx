"use client";

import { useEffect, useState } from "react";
import { Clapperboard, ExternalLink } from "lucide-react";
import { Title, parseTags } from "@/lib/types";
import { timeAgo } from "@/lib/time";
import StatusBadge from "./StatusBadge";

export default function TitleCard({
  title,
  onClick,
}: {
  title: Title;
  onClick: () => void;
}) {
  const [updatedLabel, setUpdatedLabel] = useState<string | null>(null);
  useEffect(() => {
    setUpdatedLabel(timeAgo(title.updatedAt));
  }, [title.updatedAt]);

  const tags = parseTags(title.tags);
  const progress =
    title.type === "SERIES"
      ? `S${title.currentSeason} · E${title.currentEpisode}${
          title.totalEpisodes ? ` / ${title.totalEpisodes}` : ""
        }`
      : title.status === "COMPLETED"
      ? "Watched"
      : "Movie";

  return (
    <div className="group flex flex-col">
      <button
        onClick={onClick}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-raised ring-1 ring-border-subtle transition-transform duration-150 group-hover:scale-[1.02] group-hover:ring-blue-500/60 cursor-pointer text-left"
      >
        {title.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={title.posterUrl}
            alt={title.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-raised text-muted">
            <Clapperboard size={32} />
          </div>
        )}

        <div className="absolute top-1.5 right-1.5">
          <StatusBadge status={title.status} />
        </div>

        {title.watchUrl && (
          <a
            href={title.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-1.5 left-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 ring-1 ring-white/20 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-black/80"
            title="Watch now"
          >
            <ExternalLink size={13} />
          </a>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pb-1.5 pt-6">
          <p className="truncate text-[11px] font-medium text-white/90">
            {progress}
          </p>
        </div>
      </button>

      <button onClick={onClick} className="mt-1.5 text-left cursor-pointer">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-blue-400">
          {title.name}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted">
            {tags[0] ?? (title.type === "MOVIE" ? "Movie" : "Series")}
          </span>
          <span className="shrink-0 text-xs text-muted">
            {updatedLabel ?? " "}
          </span>
        </div>
      </button>
    </div>
  );
}
