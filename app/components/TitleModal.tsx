"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Title, WatchStatus, MediaType, STATUS_LABELS, parseTags } from "@/lib/types";

export interface TitleFormData {
  name: string;
  type: MediaType;
  status: WatchStatus;
  posterUrl: string;
  watchUrl: string;
  tags: string[];
  currentSeason: number;
  currentEpisode: number;
  totalSeasons: string;
  totalEpisodes: string;
  rating: string;
  notes: string;
}

function toFormData(title?: Title): TitleFormData {
  return {
    name: title?.name ?? "",
    type: title?.type ?? "SERIES",
    status: title?.status ?? "PLAN_TO_WATCH",
    posterUrl: title?.posterUrl ?? "",
    watchUrl: title?.watchUrl ?? "",
    tags: title ? parseTags(title.tags) : [],
    currentSeason: title?.currentSeason ?? 1,
    currentEpisode: title?.currentEpisode ?? 0,
    totalSeasons: title?.totalSeasons?.toString() ?? "",
    totalEpisodes: title?.totalEpisodes?.toString() ?? "",
    rating: title?.rating?.toString() ?? "",
    notes: title?.notes ?? "",
  };
}

export default function TitleModal({
  title,
  onClose,
  onSave,
  onDelete,
}: {
  title?: Title;
  onClose: () => void;
  onSave: (data: TitleFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [form, setForm] = useState<TitleFormData>(toFormData(title));
  const [tagsInput, setTagsInput] = useState(form.tags.join(", "));
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(title);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        data-testid="title-modal"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface ring-1 ring-border-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit title" : "Add a title"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-surface-raised hover:text-foreground cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="e.g. The Fox's Love Refresher"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as MediaType })
                }
                className="w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="SERIES">Series</option>
                <option value="MOVIE">Movie</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Status
              </label>
              <select
                data-testid="status-select"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as WatchStatus })
                }
                className="w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Poster image URL
            </label>
            <input
              value={form.posterUrl}
              onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
              className="w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Where to watch (link)
            </label>
            <input
              value={form.watchUrl}
              onChange={(e) => setForm({ ...form, watchUrl: e.target.value })}
              className="w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="https://netflix.com/..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Genres / tags (comma separated)
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Fantasy, Romance, Game"
            />
          </div>

          {form.type === "SERIES" && (
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Season
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.currentSeason}
                  onChange={(e) =>
                    setForm({ ...form, currentSeason: Number(e.target.value) })
                  }
                  className="w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Episode
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.currentEpisode}
                  onChange={(e) =>
                    setForm({ ...form, currentEpisode: Number(e.target.value) })
                  }
                  className="w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Total seasons
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.totalSeasons}
                  onChange={(e) =>
                    setForm({ ...form, totalSeasons: e.target.value })
                  }
                  className="w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Total episodes
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.totalEpisodes}
                  onChange={(e) =>
                    setForm({ ...form, totalEpisodes: e.target.value })
                  }
                  className="w-full rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              >
                <Trash2 size={15} />
                Delete
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              data-testid="submit-title"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add title"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
