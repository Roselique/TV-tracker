"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Title, WatchStatus, STATUS_LABELS, STATUS_ORDER, parseTags } from "@/lib/types";
import TitleCard from "./TitleCard";
import TitleModal, { TitleFormData } from "./TitleModal";

type SortMode = "updated" | "added" | "name";

export default function Library({ initialTitles }: { initialTitles: Title[] }) {
  const [titles, setTitles] = useState<Title[]>(initialTitles);
  const [statusFilter, setStatusFilter] = useState<WatchStatus | "ALL">("ALL");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("updated");
  const [modal, setModal] = useState<"add" | Title | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    titles.forEach((t) => parseTags(t.tags).forEach((tag) => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [titles]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: titles.length };
    for (const s of STATUS_ORDER) c[s] = 0;
    titles.forEach((t) => {
      c[t.status] = (c[t.status] ?? 0) + 1;
    });
    return c;
  }, [titles]);

  const visible = useMemo(() => {
    let list = titles;
    if (statusFilter !== "ALL") list = list.filter((t) => t.status === statusFilter);
    if (tagFilter) list = list.filter((t) => parseTags(t.tags).includes(tagFilter));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sort === "updated") {
      sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } else if (sort === "added") {
      sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [titles, statusFilter, tagFilter, query, sort]);

  async function handleSave(data: TitleFormData) {
    const payload = {
      ...data,
      totalSeasons: data.totalSeasons || null,
      totalEpisodes: data.totalEpisodes || null,
      rating: data.rating || null,
    };

    if (modal && modal !== "add") {
      const res = await fetch(`/api/titles/${modal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated: Title = await res.json();
      setTitles((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const res = await fetch("/api/titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created: Title = await res.json();
      setTitles((prev) => [created, ...prev]);
    }
    setModal(null);
  }

  async function handleDelete() {
    if (!modal || modal === "add") return;
    await fetch(`/api/titles/${modal.id}`, { method: "DELETE" });
    setTitles((prev) => prev.filter((t) => t.id !== (modal as Title).id));
    setModal(null);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface p-5 ring-1 ring-border-subtle">
        <div>
          <h1 className="text-xl font-bold">My Watchlist</h1>
          <p className="mt-1 text-sm text-muted">
            {titles.length} title{titles.length === 1 ? "" : "s"} in your library
          </p>
        </div>
        <div className="flex gap-6 text-center">
          {STATUS_ORDER.map((s) => (
            <div key={s}>
              <p className="text-lg font-bold">{counts[s] ?? 0}</p>
              <p className="text-xs text-muted">{STATUS_LABELS[s]}</p>
            </div>
          ))}
        </div>
        <button
          data-testid="open-add-title"
          onClick={() => setModal("add")}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 cursor-pointer"
        >
          <Plus size={16} />
          Add title
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-blue-600 text-white"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          All
        </button>
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer ${
              statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setTagFilter(null)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer ${
              tagFilter === null
                ? "bg-surface-raised text-foreground ring-1 ring-blue-500"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            All genres
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer ${
                tagFilter === tag
                  ? "bg-surface-raised text-foreground ring-1 ring-blue-500"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your library..."
            className="w-full rounded-md border border-border-subtle bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="rounded-md border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="updated">Recently updated</option>
          <option value="added">Recently added</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface py-20 text-center ring-1 ring-border-subtle">
          <p className="text-muted">
            {titles.length === 0
              ? "Your library is empty. Add the first title you're watching."
              : "No titles match these filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visible.map((title) => (
            <TitleCard key={title.id} title={title} onClick={() => setModal(title)} />
          ))}
        </div>
      )}

      {modal && (
        <TitleModal
          title={modal === "add" ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={modal !== "add" ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
