import { Bookmark, Play, Pause, Check, X } from "lucide-react";
import { WatchStatus } from "@/lib/types";

export const STATUS_STYLE: Record<
  WatchStatus,
  { icon: typeof Play; className: string }
> = {
  PLAN_TO_WATCH: {
    icon: Bookmark,
    className: "bg-slate-600 text-slate-50",
  },
  WATCHING: {
    icon: Play,
    className: "bg-blue-600 text-blue-50",
  },
  ON_HOLD: {
    icon: Pause,
    className: "bg-amber-500 text-amber-50",
  },
  COMPLETED: {
    icon: Check,
    className: "bg-emerald-600 text-emerald-50",
  },
  DROPPED: {
    icon: X,
    className: "bg-rose-600 text-rose-50",
  },
};

export default function StatusBadge({
  status,
  size = "md",
}: {
  status: WatchStatus;
  size?: "sm" | "md";
}) {
  const { icon: Icon, className } = STATUS_STYLE[status];
  const dim = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  const iconDim = size === "sm" ? 11 : 14;

  return (
    <span
      className={`inline-flex ${dim} items-center justify-center rounded-full shadow-md ring-2 ring-black/40 ${className}`}
    >
      <Icon size={iconDim} strokeWidth={2.75} />
    </span>
  );
}
