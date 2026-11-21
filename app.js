(() => {
  "use strict";

  const STORAGE_KEY = "tv-tracker-titles";

  const STATUS_LABELS = {
    PLAN_TO_WATCH: "Plan to Watch",
    WATCHING: "Watching",
    ON_HOLD: "On Hold",
    COMPLETED: "Completed",
    DROPPED: "Dropped",
  };
  const STATUS_ORDER = ["WATCHING", "PLAN_TO_WATCH", "ON_HOLD", "COMPLETED", "DROPPED"];

  const STATUS_ICONS = {
    PLAN_TO_WATCH: { color: "#475569", svg: '<path d="M6 3h12v18l-6-4-6 4V3Z" fill="currentColor"/>' },
    WATCHING: { color: "#2563eb", svg: '<path d="M8 5v14l11-7-11-7Z" fill="currentColor"/>' },
    ON_HOLD: { color: "#d97706", svg: '<path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/>' },
    COMPLETED: { color: "#059669", svg: '<path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
    DROPPED: { color: "#dc2626", svg: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>' },
  };

  // TMDB API Read Access Token (public, client-side — see README for why).
  const TMDB_TOKEN =
    "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4MzgxZjE3YWU1ODAwODgyNWZjMGY0Yzc2M2Y4NjcwOSIsIm5iZiI6MTc5MzcyMjY1NC45NzYsInN1YiI6IjZhZWEwOTFlNDU3MzhkNjk2MGMzNGJiYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hCHEgsuqgyKz8H1J0zfQ4BwMBz-40ogAOMdZMP9m_Qc";
  const TMDB_API = "https://api.themoviedb.org/3";
  const TMDB_POSTER_LIST = "https://image.tmdb.org/t/p/w92";
  const TMDB_POSTER_FULL = "https://image.tmdb.org/t/p/w500";
  const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";
  const DISCOVER_CACHE_KEY = "tv-tracker-discover-cache";
  const HERO_ROTATE_MS = 6000;

  const TMDB_MOVIE_GENRES = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
    27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
    878: "Science Fiction", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
  };
  const TMDB_TV_GENRES = {
    10759: "Action & Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 10762: "Kids", 9648: "Mystery",
    10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap",
    10767: "Talk", 10768: "War & Politics", 37: "Western",
  };

  async function tmdbFetch(path) {
    const res = await fetch(`${TMDB_API}${path}`, {
      headers: { accept: "application/json", Authorization: `Bearer ${TMDB_TOKEN}` },
    });
    if (!res.ok) throw new Error(`TMDB request failed (${res.status})`);
    return res.json();
  }

  function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function uid() {
    return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function loadTitles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveTitles(titles) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(titles));
  }

  function sampleTitles() {
    const now = Date.now();
    const mk = (overrides, minsAgo) => ({
      id: uid(),
      name: "",
      type: "SERIES",
      status: "PLAN_TO_WATCH",
      posterUrl: "",
      watchUrl: "",
      tags: [],
      currentSeason: 1,
      currentEpisode: 0,
      totalSeasons: null,
      totalEpisodes: null,
      notes: "",
      createdAt: now - minsAgo * 60000,
      updatedAt: now - minsAgo * 60000,
      ...overrides,
    });
    return [
      mk({ name: "Arcane", status: "WATCHING", posterUrl: "posters/arcane.svg", watchUrl: "https://www.netflix.com/title/81435684", tags: ["Fantasy", "Action", "Animation"], currentSeason: 2, currentEpisode: 4, totalSeasons: 2, totalEpisodes: 18 }, 5),
      mk({ name: "The Bear", status: "COMPLETED", posterUrl: "posters/thebear.svg", watchUrl: "https://www.hulu.com/series/the-bear", tags: ["Drama", "Comedy"], currentSeason: 3, currentEpisode: 10, totalSeasons: 3, totalEpisodes: 28 }, 15),
      mk({ name: "Dune: Part Two", type: "MOVIE", status: "PLAN_TO_WATCH", posterUrl: "posters/dune2.svg", watchUrl: "https://www.max.com/movies/dune-part-two", tags: ["Sci-Fi", "Fantasy"] }, 25),
      mk({ name: "Severance", status: "WATCHING", posterUrl: "posters/severance.svg", watchUrl: "https://tv.apple.com/show/severance", tags: ["Sci-Fi", "Mystery", "Drama"], currentSeason: 2, currentEpisode: 1, totalSeasons: 2, totalEpisodes: 19 }, 35),
      mk({ name: "Attack on Titan", status: "ON_HOLD", posterUrl: "posters/aot.svg", watchUrl: "https://crunchyroll.com/attack-on-titan", tags: ["Anime", "Action", "Fantasy"], currentSeason: 4, currentEpisode: 12, totalSeasons: 4, totalEpisodes: 94 }, 45),
      mk({ name: "Cowboy Bebop", status: "DROPPED", posterUrl: "posters/bebop.svg", watchUrl: "https://www.crunchyroll.com/cowboy-bebop", tags: ["Anime", "Sci-Fi"], currentSeason: 1, currentEpisode: 5, totalSeasons: 1, totalEpisodes: 26 }, 55),
    ];
  }

  let titles = loadTitles();
  if (titles === null) {
    titles = sampleTitles();
    saveTitles(titles);
  }

  let state = {
    status: "ALL",
    tag: null,
    franchise: null,
    query: "",
    sort: "updated",
    modalTitleId: null,
    isAdding: false,
  };

  const els = {
    grid: document.getElementById("grid"),
    empty: document.getElementById("empty"),
    titleCount: document.getElementById("title-count"),
    stats: document.getElementById("stats"),
    statusTabs: document.getElementById("status-tabs"),
    tagChips: document.getElementById("tag-chips"),
    search: document.getElementById("search"),
    searchClear: document.getElementById("search-clear"),
    sort: document.getElementById("sort"),
    openAdd: document.getElementById("open-add"),
    backdrop: document.getElementById("modal-backdrop"),
    modalTitle: document.getElementById("modal-title"),
    form: document.getElementById("title-form"),
    deleteBtn: document.getElementById("delete-title"),
    submitBtn: document.getElementById("submit-title"),
    closeModal: document.getElementById("close-modal"),
    seasonFields: document.getElementById("season-fields"),
    fType: document.getElementById("f-type"),
    fName: document.getElementById("f-name"),
    fYear: document.getElementById("f-year"),
    fMyScore: document.getElementById("f-my-score"),
    fTmdbScore: document.getElementById("f-tmdb-score"),
    fTmdbId: document.getElementById("f-tmdb-id"),
    fTmdbMediaType: document.getElementById("f-tmdb-media-type"),
    fCollection: document.getElementById("f-collection"),
    fFranchise: document.getElementById("f-franchise"),
    tmdbResults: document.getElementById("tmdb-results"),
    tmdbHint: document.getElementById("tmdb-hint"),
    exportBtn: document.getElementById("export-btn"),
    importBtn: document.getElementById("import-btn"),
    importFile: document.getElementById("import-file"),
    collectionBackdrop: document.getElementById("collection-backdrop"),
    collectionModalTitle: document.getElementById("collection-modal-title"),
    collectionModalSubtitle: document.getElementById("collection-modal-subtitle"),
    collectionList: document.getElementById("collection-list"),
    closeCollectionModal: document.getElementById("close-collection-modal"),
    franchiseChips: document.getElementById("franchise-chips"),
    franchiseBackdrop: document.getElementById("franchise-backdrop"),
    franchiseModalTitle: document.getElementById("franchise-modal-title"),
    franchiseModalSubtitle: document.getElementById("franchise-modal-subtitle"),
    franchiseList: document.getElementById("franchise-list"),
    closeFranchiseModal: document.getElementById("close-franchise-modal"),
    matchTmdbBtn: document.getElementById("match-tmdb-btn"),
    matchTmdbLabel: document.getElementById("match-tmdb-label"),
    tmdbMatchBackdrop: document.getElementById("tmdb-match-backdrop"),
    tmdbMatchSubtitle: document.getElementById("tmdb-match-subtitle"),
    tmdbMatchCandidates: document.getElementById("tmdb-match-candidates"),
    closeTmdbMatchModal: document.getElementById("close-tmdb-match-modal"),
    discoverStatus: document.getElementById("discover-status"),
    discoverRefreshBtn: document.getElementById("discover-refresh-btn"),
    discoverHero: document.getElementById("discover-hero"),
    discoverCarousels: document.getElementById("discover-carousels"),
    tmdbMatchSkip: document.getElementById("tmdb-match-skip"),
  };

  function timeAgo(ts) {
    const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (seconds < 60) return seconds + "s ago";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m ago";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    const days = Math.floor(hours / 24);
    if (days < 30) return days + "d ago";
    const months = Math.floor(days / 30);
    if (months < 12) return months + "mo ago";
    return Math.floor(months / 12) + "y ago";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function allTags() {
    const set = new Set();
    titles.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function allFranchises() {
    const set = new Set();
    titles.forEach((t) => {
      const f = (t.franchise || "").trim();
      if (f) set.add(f);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function counts() {
    const c = { ALL: titles.length };
    STATUS_ORDER.forEach((s) => (c[s] = 0));
    titles.forEach((t) => (c[t.status] = (c[t.status] || 0) + 1));
    return c;
  }

  function visibleTitles() {
    let list = titles.slice();
    if (state.status !== "ALL") list = list.filter((t) => t.status === state.status);
    if (state.tag) list = list.filter((t) => (t.tags || []).includes(state.tag));
    if (state.franchise) list = list.filter((t) => (t.franchise || "").trim() === state.franchise);
    if (state.query.trim()) {
      const q = state.query.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    if (state.sort === "updated") list.sort((a, b) => b.updatedAt - a.updatedAt);
    else if (state.sort === "added") list.sort((a, b) => b.createdAt - a.createdAt);
    else if (state.sort === "tmdb_score")
      list.sort((a, b) => (b.tmdbScore ?? -1) - (a.tmdbScore ?? -1));
    else if (state.sort === "my_score") list.sort((a, b) => (b.myScore ?? -1) - (a.myScore ?? -1));
    else if (state.sort === "watch_order") list = orderItemsBy(list, "watchOrder");
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function renderStats() {
    const c = counts();
    els.titleCount.textContent = `${titles.length} title${titles.length === 1 ? "" : "s"} in your library`;
    els.stats.innerHTML = STATUS_ORDER.map(
      (s) => `<div><p class="stat-num">${c[s] || 0}</p><p class="stat-label">${STATUS_LABELS[s]}</p></div>`
    ).join("");
  }

  function renderStatusTabs() {
    const tabs = [{ key: "ALL", label: "All" }].concat(
      STATUS_ORDER.map((s) => ({ key: s, label: STATUS_LABELS[s] }))
    );
    els.statusTabs.innerHTML = tabs
      .map(
        (t) =>
          `<button class="chip ${state.status === t.key ? "active" : ""}" data-status="${t.key}">${t.label}</button>`
      )
      .join("");
    els.statusTabs.querySelectorAll("[data-status]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.status = btn.dataset.status;
        render();
      });
    });
  }

  function renderTagChips() {
    const tags = allTags();
    if (tags.length === 0) {
      els.tagChips.innerHTML = "";
      return;
    }
    const chips = [{ key: null, label: "All genres" }].concat(tags.map((t) => ({ key: t, label: t })));
    els.tagChips.innerHTML = chips
      .map(
        (c) =>
          `<button class="chip chip-tag ${state.tag === c.key ? "active" : ""}" data-tag="${escapeHtml(c.key ?? "")}">${escapeHtml(c.label)}</button>`
      )
      .join("");
    els.tagChips.querySelectorAll("[data-tag]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tag = btn.dataset.tag || null;
        state.tag = state.tag === tag ? null : tag;
        render();
      });
    });
  }

  function renderFranchiseChips() {
    const franchises = allFranchises();
    if (franchises.length === 0) {
      els.franchiseChips.innerHTML = "";
      return;
    }
    const chips = [{ key: null, label: "All franchises" }].concat(
      franchises.map((f) => ({ key: f, label: f }))
    );
    let html = chips
      .map(
        (c) =>
          `<button class="chip chip-tag ${state.franchise === c.key ? "active" : ""}" data-franchise="${escapeHtml(c.key ?? "")}">${escapeHtml(c.label)}</button>`
      )
      .join("");
    if (state.franchise) {
      html += `<button type="button" class="chip" id="franchise-reorder-btn" title="Set your watch order for this franchise">⇅ Reorder</button>`;
    }
    els.franchiseChips.innerHTML = html;
    els.franchiseChips.querySelectorAll("[data-franchise]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.dataset.franchise || null;
        state.franchise = state.franchise === f ? null : f;
        render();
      });
    });
    const reorderBtn = document.getElementById("franchise-reorder-btn");
    if (reorderBtn) {
      reorderBtn.addEventListener("click", () => openFranchiseModal(state.franchise));
    }
  }

  function progressLabel(t) {
    if (t.type === "SERIES") {
      const total = t.totalEpisodes ? ` / ${t.totalEpisodes}` : "";
      return `S${t.currentSeason} · E${t.currentEpisode}${total}`;
    }
    return t.status === "COMPLETED" ? "Watched" : "Movie";
  }

  function scoreMetaLine(t) {
    const parts = [];
    if (t.year) parts.push(String(t.year));
    if (t.tmdbScore != null) parts.push(`★ ${Math.round(t.tmdbScore * 10)}%`);
    if (t.myScore != null) parts.push(`♥ ${t.myScore}`);
    return parts.join(" · ");
  }

  function collectionKey(t) {
    return (t.collection || "").trim().toLowerCase();
  }

  // Orders items by an explicit manual-order field first (set by
  // dragging in a reorder panel), falling back to release year for
  // anything not yet manually placed.
  function orderItemsBy(items, field) {
    return [...items].sort((a, b) => {
      const ao = a[field];
      const bo = b[field];
      if (ao != null && bo != null) return ao - bo;
      if (ao != null) return -1;
      if (bo != null) return 1;
      return (a.year ?? 9999) - (b.year ?? 9999);
    });
  }

  function collectionSortItems(items) {
    return orderItemsBy(items, "collectionOrder");
  }

  function franchiseSortItems(items) {
    return orderItemsBy(items, "watchOrder");
  }

  // Groups an already-filtered/sorted list into single titles and
  // collections (2+ titles sharing a non-empty `collection` field).
  // A group is placed at the position of its first-seen member, so it
  // naturally inherits that member's rank under the active sort.
  function groupForDisplay(sortedList) {
    const renderItems = [];
    const groupsByKey = new Map();
    for (const t of sortedList) {
      const key = collectionKey(t);
      if (!key) {
        renderItems.push({ kind: "single", title: t });
        continue;
      }
      let group = groupsByKey.get(key);
      if (!group) {
        group = { kind: "group", key, collection: t.collection.trim(), items: [] };
        groupsByKey.set(key, group);
        renderItems.push(group);
      }
      group.items.push(t);
    }
    return renderItems.map((item) =>
      item.kind === "group" && item.items.length < 2 ? { kind: "single", title: item.items[0] } : item
    );
  }

  const STATUS_PRIORITY = ["WATCHING", "ON_HOLD", "PLAN_TO_WATCH", "DROPPED"];

  function aggregateStatus(items) {
    if (items.every((i) => i.status === "COMPLETED")) return "COMPLETED";
    for (const s of STATUS_PRIORITY) {
      if (items.some((i) => i.status === s)) return s;
    }
    return items[0].status;
  }

  function posterMarkup(posterUrl, name) {
    return posterUrl
      ? `<img src="${escapeHtml(posterUrl)}" alt="${escapeHtml(name || "")}" loading="lazy" />`
      : `<div class="poster-placeholder"><svg viewBox="0 0 24 24" width="32" height="32"><path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M4 15l4-4 4 4 4-6 4 4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></div>`;
  }

  function renderSingleCard(t) {
    const icon = STATUS_ICONS[t.status];
    const poster = posterMarkup(t.posterUrl, t.name);
    const watchLink = t.watchUrl
      ? `<a class="watch-link" href="${escapeHtml(t.watchUrl)}" target="_blank" rel="noopener noreferrer" title="Watch now" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M14 4h6v6M20 4l-9 9M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`
      : "";
    const tag0 = (t.tags && t.tags[0]) || (t.type === "MOVIE" ? "Movie" : "Series");
    const metaLine = scoreMetaLine(t);

    const canQuickProgress = t.status !== "COMPLETED" && t.status !== "DROPPED";
    let quickBtn = "";
    if (canQuickProgress && t.type === "SERIES") {
      quickBtn = `<button type="button" class="quick-progress" data-quick-episode="${t.id}" title="+1 episode"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></button>`;
    } else if (canQuickProgress && t.type === "MOVIE") {
      quickBtn = `<button type="button" class="quick-progress" data-quick-watched="${t.id}" title="Mark as watched"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
    }

    return `
    <div class="card">
      <div class="poster-btn" data-open="${t.id}" role="button" tabindex="0">
        ${poster}
        <span class="status-badge" style="background:${icon.color}"><svg viewBox="0 0 24 24" width="13" height="13">${icon.svg}</svg></span>
        ${watchLink}
        ${quickBtn}
        <span class="progress-overlay">
          ${metaLine ? `<span class="progress-overlay-meta">${escapeHtml(metaLine)}</span>` : ""}
          <span class="progress-overlay-main">${escapeHtml(progressLabel(t))}</span>
        </span>
      </div>
      <button class="card-title-btn" data-open="${t.id}">
        <div class="name">${escapeHtml(t.name)}</div>
        <div class="card-meta"><span>${escapeHtml(tag0)}</span><span>${timeAgo(t.updatedAt)}</span></div>
      </button>
    </div>`;
  }

  function renderGroupCard(group) {
    const ordered = collectionSortItems(group.items);
    const withPoster = ordered.find((i) => i.posterUrl) || ordered[0];
    const poster = posterMarkup(withPoster.posterUrl, group.collection);
    const icon = STATUS_ICONS[aggregateStatus(group.items)];
    const completedCount = group.items.filter((i) => i.status === "COMPLETED").length;

    const years = group.items.map((i) => i.year).filter(Boolean);
    let yearLabel = "";
    if (years.length) {
      const min = Math.min(...years);
      const max = Math.max(...years);
      yearLabel = min === max ? String(min) : `${min}–${max}`;
    }
    const latestUpdated = Math.max(...group.items.map((i) => i.updatedAt));

    return `
    <div class="card">
      <div class="poster-stack-wrap">
        <div class="poster-ghost poster-ghost-2"></div>
        <div class="poster-ghost poster-ghost-1"></div>
        <div class="poster-btn" data-group="${escapeHtml(group.key)}" role="button" tabindex="0">
          ${poster}
          <span class="status-badge" style="background:${icon.color}"><svg viewBox="0 0 24 24" width="13" height="13">${icon.svg}</svg></span>
          <span class="parts-badge">${completedCount}/${group.items.length} done</span>
          ${
            yearLabel
              ? `<span class="progress-overlay"><span class="progress-overlay-meta">${escapeHtml(yearLabel)}</span></span>`
              : ""
          }
        </div>
      </div>
      <button class="card-title-btn" data-group="${escapeHtml(group.key)}">
        <div class="name">${escapeHtml(group.collection)}</div>
        <div class="card-meta"><span>${group.items.length} titles</span><span>${timeAgo(latestUpdated)}</span></div>
      </button>
    </div>`;
  }

  function renderGrid() {
    const list = visibleTitles();
    els.empty.hidden = list.length !== 0;
    els.empty.querySelector("p").textContent =
      titles.length === 0
        ? "Your library is empty. Add the first title you're watching."
        : "No titles match these filters.";

    const renderItems = groupForDisplay(list);

    els.grid.innerHTML = renderItems
      .map((item) => (item.kind === "group" ? renderGroupCard(item) : renderSingleCard(item.title)))
      .join("");

    els.grid.querySelectorAll("[data-open]").forEach((el) => {
      el.addEventListener("click", () => openModal(el.dataset.open));
      el.addEventListener("keydown", (e) => {
        if (e.target === el && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          openModal(el.dataset.open);
        }
      });
    });
    els.grid.querySelectorAll("[data-group]").forEach((el) => {
      el.addEventListener("click", () => openCollectionModal(el.dataset.group));
      el.addEventListener("keydown", (e) => {
        if (e.target === el && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          openCollectionModal(el.dataset.group);
        }
      });
    });
    els.grid.querySelectorAll("[data-quick-episode]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        quickAdvanceEpisode(btn.dataset.quickEpisode);
      });
    });
    els.grid.querySelectorAll("[data-quick-watched]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        quickMarkWatched(btn.dataset.quickWatched);
      });
    });
  }

  let dragSrcId = null;

  function openCollectionModal(key) {
    const items = titles.filter((t) => collectionKey(t) === key);
    if (items.length === 0) return;
    const sorted = collectionSortItems(items);
    const completedCount = items.filter((t) => t.status === "COMPLETED").length;

    els.collectionModalTitle.textContent = items[0].collection.trim();
    els.collectionModalSubtitle.textContent = `${completedCount}/${items.length} completed`;
    els.collectionList.innerHTML = sorted
      .map((t) => {
        const icon = STATUS_ICONS[t.status];
        const poster = t.posterUrl
          ? `<img src="${escapeHtml(t.posterUrl)}" alt="" />`
          : `<span class="collection-row-poster-placeholder"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></span>`;
        return `
        <div class="collection-row" draggable="true" data-row-id="${t.id}" data-open-part="${t.id}" role="button" tabindex="0">
          <span class="collection-row-handle" title="Drag to reorder"><svg viewBox="0 0 24 24" width="14" height="14"><circle cx="9" cy="6" r="1.4" fill="currentColor"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="9" cy="18" r="1.4" fill="currentColor"/><circle cx="15" cy="6" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="18" r="1.4" fill="currentColor"/></svg></span>
          <span class="collection-row-poster">${poster}</span>
          <span class="collection-row-info">
            <span class="collection-row-name">${escapeHtml(t.name)}${t.year ? ` (${t.year})` : ""}</span>
            <span class="collection-row-meta">${escapeHtml(progressLabel(t))}</span>
          </span>
          <span class="collection-row-status" style="background:${icon.color}"><svg viewBox="0 0 24 24" width="13" height="13">${icon.svg}</svg></span>
        </div>`;
      })
      .join("");

    els.collectionList.querySelectorAll("[data-open-part]").forEach((row) => {
      row.addEventListener("click", () => {
        closeCollectionModal();
        openModal(row.dataset.openPart);
      });
      row.addEventListener("keydown", (e) => {
        if (e.target === row && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          closeCollectionModal();
          openModal(row.dataset.openPart);
        }
      });
      row.addEventListener("dragstart", (e) => {
        dragSrcId = row.dataset.rowId;
        e.dataTransfer.effectAllowed = "move";
        row.classList.add("dragging");
      });
      row.addEventListener("dragend", () => {
        row.classList.remove("dragging");
        els.collectionList.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
      });
      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (row.dataset.rowId !== dragSrcId) row.classList.add("drag-over");
      });
      row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
      row.addEventListener("drop", (e) => {
        e.preventDefault();
        row.classList.remove("drag-over");
        const targetId = row.dataset.rowId;
        if (!dragSrcId || dragSrcId === targetId) return;
        reorderCollectionItems(key, dragSrcId, targetId);
      });
    });

    els.collectionBackdrop.hidden = false;
  }

  function reorderCollectionItems(key, srcId, targetId) {
    const items = titles.filter((t) => collectionKey(t) === key);
    const ordered = collectionSortItems(items);
    const fromIdx = ordered.findIndex((t) => t.id === srcId);
    const toIdx = ordered.findIndex((t) => t.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);
    ordered.forEach((t, i) => {
      t.collectionOrder = i;
    });
    saveTitles(titles);
    openCollectionModal(key);
    renderGrid();
  }

  function closeCollectionModal() {
    els.collectionBackdrop.hidden = true;
  }

  let franchiseDragSrcKey = null;

  function renderItemKey(item) {
    return item.kind === "single" ? `single:${item.title.id}` : `group:${item.key}`;
  }

  function franchiseRowMarkup(item) {
    if (item.kind === "single") {
      const t = item.title;
      const icon = STATUS_ICONS[t.status];
      const poster = t.posterUrl
        ? `<img src="${escapeHtml(t.posterUrl)}" alt="" />`
        : `<span class="collection-row-poster-placeholder"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></span>`;
      return `
      <div class="collection-row" draggable="true" data-row-key="${escapeHtml(renderItemKey(item))}" role="button" tabindex="0">
        <span class="collection-row-handle" title="Drag to reorder"><svg viewBox="0 0 24 24" width="14" height="14"><circle cx="9" cy="6" r="1.4" fill="currentColor"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="9" cy="18" r="1.4" fill="currentColor"/><circle cx="15" cy="6" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="18" r="1.4" fill="currentColor"/></svg></span>
        <span class="collection-row-poster">${poster}</span>
        <span class="collection-row-info">
          <span class="collection-row-name">${escapeHtml(t.name)}${t.year ? ` (${t.year})` : ""}</span>
          <span class="collection-row-meta">${escapeHtml(progressLabel(t))}</span>
        </span>
        <span class="collection-row-status" style="background:${icon.color}"><svg viewBox="0 0 24 24" width="13" height="13">${icon.svg}</svg></span>
      </div>`;
    }

    const ordered = collectionSortItems(item.items);
    const withPoster = ordered.find((i) => i.posterUrl) || ordered[0];
    const poster = withPoster.posterUrl
      ? `<img src="${escapeHtml(withPoster.posterUrl)}" alt="" />`
      : `<span class="collection-row-poster-placeholder"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></span>`;
    const icon = STATUS_ICONS[aggregateStatus(item.items)];
    const completedCount = item.items.filter((i) => i.status === "COMPLETED").length;
    return `
    <div class="collection-row" draggable="true" data-row-key="${escapeHtml(renderItemKey(item))}" role="button" tabindex="0">
      <span class="collection-row-handle" title="Drag to reorder"><svg viewBox="0 0 24 24" width="14" height="14"><circle cx="9" cy="6" r="1.4" fill="currentColor"/><circle cx="9" cy="12" r="1.4" fill="currentColor"/><circle cx="9" cy="18" r="1.4" fill="currentColor"/><circle cx="15" cy="6" r="1.4" fill="currentColor"/><circle cx="15" cy="12" r="1.4" fill="currentColor"/><circle cx="15" cy="18" r="1.4" fill="currentColor"/></svg></span>
      <span class="collection-row-poster">${poster}</span>
      <span class="collection-row-info">
        <span class="collection-row-name">${escapeHtml(item.collection)}</span>
        <span class="collection-row-meta">${item.items.length} parts · ${completedCount} done</span>
      </span>
      <span class="collection-row-status" style="background:${icon.color}"><svg viewBox="0 0 24 24" width="13" height="13">${icon.svg}</svg></span>
    </div>`;
  }

  function openFranchiseModal(franchiseName) {
    const items = titles.filter((t) => (t.franchise || "").trim() === franchiseName);
    if (items.length === 0) return;

    const renderItems = groupForDisplay(franchiseSortItems(items));

    els.franchiseModalTitle.textContent = franchiseName;
    els.franchiseModalSubtitle.textContent = `${items.length} title${items.length === 1 ? "" : "s"}`;
    els.franchiseList.innerHTML = renderItems.map(franchiseRowMarkup).join("");

    els.franchiseList.querySelectorAll(".collection-row").forEach((row) => {
      const key = row.dataset.rowKey;
      const [kind, id] = key.split(/:(.+)/);
      const openTarget = () => {
        closeFranchiseModal();
        if (kind === "single") openModal(id);
        else openCollectionModal(id);
      };
      row.addEventListener("click", openTarget);
      row.addEventListener("keydown", (e) => {
        if (e.target === row && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          openTarget();
        }
      });
      row.addEventListener("dragstart", (e) => {
        franchiseDragSrcKey = key;
        e.dataTransfer.effectAllowed = "move";
        row.classList.add("dragging");
      });
      row.addEventListener("dragend", () => {
        row.classList.remove("dragging");
        els.franchiseList.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
      });
      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (key !== franchiseDragSrcKey) row.classList.add("drag-over");
      });
      row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
      row.addEventListener("drop", (e) => {
        e.preventDefault();
        row.classList.remove("drag-over");
        if (!franchiseDragSrcKey || franchiseDragSrcKey === key) return;
        reorderFranchiseItems(franchiseName, franchiseDragSrcKey, key);
      });
    });

    els.franchiseBackdrop.hidden = false;
  }

  function reorderFranchiseItems(franchiseName, srcKey, targetKey) {
    const items = titles.filter((t) => (t.franchise || "").trim() === franchiseName);
    const renderItems = groupForDisplay(franchiseSortItems(items));
    const fromIdx = renderItems.findIndex((item) => renderItemKey(item) === srcKey);
    const toIdx = renderItems.findIndex((item) => renderItemKey(item) === targetKey);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = renderItems.splice(fromIdx, 1);
    renderItems.splice(toIdx, 0, moved);
    renderItems.forEach((item, i) => {
      if (item.kind === "single") item.title.watchOrder = i;
      else item.items.forEach((t) => (t.watchOrder = i));
    });
    saveTitles(titles);
    state.sort = "watch_order";
    els.sort.value = "watch_order";
    openFranchiseModal(franchiseName);
    renderGrid();
  }

  function closeFranchiseModal() {
    els.franchiseBackdrop.hidden = true;
  }

  function quickAdvanceEpisode(id) {
    const t = titles.find((x) => x.id === id);
    if (!t) return;
    t.currentEpisode = (t.currentEpisode || 0) + 1;
    if (t.status === "PLAN_TO_WATCH" || t.status === "ON_HOLD") t.status = "WATCHING";
    t.updatedAt = Date.now();
    saveTitles(titles);
    render();
  }

  function quickMarkWatched(id) {
    const t = titles.find((x) => x.id === id);
    if (!t) return;
    t.status = "COMPLETED";
    t.updatedAt = Date.now();
    saveTitles(titles);
    render();
  }

  function render() {
    renderStats();
    renderStatusTabs();
    renderTagChips();
    renderFranchiseChips();
    renderGrid();
  }

  function toggleSeasonFields() {
    els.seasonFields.style.display = els.fType.value === "MOVIE" ? "none" : "grid";
  }

  function hideTmdbResults() {
    els.tmdbResults.hidden = true;
    els.tmdbResults.innerHTML = "";
    els.tmdbHint.hidden = true;
  }

  function isAlreadyAdded(result) {
    return titles.some((t) => t.tmdbId === result.id && t.tmdbMediaType === result.media_type);
  }

  function renderTmdbResults(results) {
    if (results.length === 0) {
      els.tmdbResults.innerHTML = '<p class="tmdb-empty">No matches found — you can still fill this in by hand.</p>';
      els.tmdbResults.hidden = false;
      return;
    }
    els.tmdbResults.innerHTML = results
      .map((r, i) => {
        const title = r.media_type === "movie" ? r.title : r.name;
        const date = r.media_type === "movie" ? r.release_date : r.first_air_date;
        const year = date ? date.slice(0, 4) : "—";
        const typeLabel = r.media_type === "movie" ? "Movie" : "Series";
        const poster = r.poster_path
          ? `<img class="tmdb-result-poster" src="${TMDB_POSTER_LIST}${r.poster_path}" alt="" />`
          : `<span class="tmdb-result-poster-placeholder"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></span>`;
        const addedBadge = isAlreadyAdded(r)
          ? `<span class="tmdb-result-added" title="Already in your library"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`
          : "";
        return `
        <button type="button" class="tmdb-result" data-index="${i}">
          ${poster}
          <span class="tmdb-result-info">
            <span class="tmdb-result-title">${escapeHtml(title)}</span>
            <span class="tmdb-result-meta">${typeLabel} · ${year}</span>
          </span>
          ${addedBadge}
        </button>`;
      })
      .join("");
    els.tmdbResults.hidden = false;

    els.tmdbResults.querySelectorAll("[data-index]").forEach((btn) => {
      btn.addEventListener("click", () => selectTmdbResult(results[Number(btn.dataset.index)]));
    });
  }

  async function searchTmdb(query) {
    if (!query || query.trim().length < 2) {
      hideTmdbResults();
      return;
    }
    els.tmdbResults.hidden = true;
    els.tmdbHint.textContent = "Searching TMDB…";
    els.tmdbHint.hidden = false;
    try {
      const data = await tmdbFetch(
        `/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`
      );
      const results = (data.results || [])
        .filter((r) => r.media_type === "movie" || r.media_type === "tv")
        .slice(0, 6);
      els.tmdbHint.hidden = true;
      renderTmdbResults(results);
    } catch {
      els.tmdbHint.textContent = "Couldn't reach TMDB — you can still fill this in by hand.";
      els.tmdbHint.hidden = false;
      els.tmdbResults.hidden = true;
    }
  }

  async function selectTmdbResult(result) {
    const isMovie = result.media_type === "movie";
    const title = isMovie ? result.title : result.name;

    els.fName.value = title;
    els.fType.value = isMovie ? "MOVIE" : "SERIES";
    toggleSeasonFields();

    document.getElementById("f-poster").value = result.poster_path
      ? `${TMDB_POSTER_FULL}${result.poster_path}`
      : "";

    const genreMap = isMovie ? TMDB_MOVIE_GENRES : TMDB_TV_GENRES;
    const genreNames = (result.genre_ids || []).map((id) => genreMap[id]).filter(Boolean);
    if (genreNames.length) document.getElementById("f-tags").value = genreNames.join(", ");

    const dateStr = isMovie ? result.release_date : result.first_air_date;
    els.fYear.value = dateStr ? dateStr.slice(0, 4) : "";
    els.fTmdbScore.value = result.vote_average ? Number(result.vote_average.toFixed(1)) : "";
    els.fCollection.value = "";
    els.fTmdbId.value = result.id;
    els.fTmdbMediaType.value = result.media_type;

    hideTmdbResults();

    if (!isMovie) {
      try {
        const details = await tmdbFetch(`/tv/${result.id}?language=en-US`);
        if (details.number_of_seasons) document.getElementById("f-total-seasons").value = details.number_of_seasons;
        if (details.number_of_episodes) document.getElementById("f-total-episodes").value = details.number_of_episodes;
      } catch {
        // Season/episode totals are a nice-to-have; ignore failures silently.
      }
    } else {
      try {
        const details = await tmdbFetch(`/movie/${result.id}?language=en-US`);
        if (details.belongs_to_collection?.name) {
          els.fCollection.value = details.belongs_to_collection.name.replace(/\s+Collection$/i, "");
        }
      } catch {
        // No formal TMDB collection found; leave it for manual entry.
      }
    }
  }

  async function tmdbSearchForTitle(t) {
    const isMovie = t.type === "MOVIE";
    const endpoint = isMovie ? "/search/movie" : "/search/tv";
    const data = await tmdbFetch(`${endpoint}?query=${encodeURIComponent(t.name)}&language=en-US&page=1`);
    return (data.results || []).map((r) => ({ ...r, media_type: isMovie ? "movie" : "tv" }));
  }

  // Decides how to resolve a title against its TMDB search results:
  // - "auto": exactly one title-text match (or, among several, exactly
  //   one also matches a year we already know) — safe to link silently.
  // - "fuzzy": no exact text match, but results exist — best guess is
  //   the top result, still applied automatically.
  // - "ambiguous": two or more results share the exact same title text
  //   and a known year didn't narrow it down — needs a human pick.
  // - "none": nothing came back at all.
  function pickTmdbMatch(t, results) {
    if (results.length === 0) return { outcome: "none" };
    const normalize = (s) => (s || "").trim().toLowerCase();
    const targetName = normalize(t.name);
    const exact = results.filter((r) => normalize(r.title || r.name) === targetName);

    if (exact.length === 0) return { outcome: "fuzzy", match: results[0] };
    if (exact.length === 1) return { outcome: "auto", match: exact[0] };

    if (t.year) {
      const byYear = exact.filter((r) => {
        const dateStr = r.release_date || r.first_air_date;
        return dateStr && Number(dateStr.slice(0, 4)) === t.year;
      });
      if (byYear.length === 1) return { outcome: "auto", match: byYear[0] };
    }
    return { outcome: "ambiguous", candidates: exact };
  }

  function applyTmdbMatchToTitle(t, result) {
    const isMovie = result.media_type === "movie";
    t.tmdbId = result.id;
    t.tmdbMediaType = isMovie ? "movie" : "tv";
    if (!t.posterUrl && result.poster_path) t.posterUrl = `${TMDB_POSTER_FULL}${result.poster_path}`;
    const dateStr = isMovie ? result.release_date : result.first_air_date;
    if (!t.year && dateStr) t.year = Number(dateStr.slice(0, 4));
    if (result.vote_average) t.tmdbScore = Number(result.vote_average.toFixed(1));
    if ((!t.tags || t.tags.length === 0) && result.genre_ids && result.genre_ids.length) {
      const genreMap = isMovie ? TMDB_MOVIE_GENRES : TMDB_TV_GENRES;
      const names = result.genre_ids.map((id) => genreMap[id]).filter(Boolean);
      if (names.length) t.tags = names;
    }
  }

  let tmdbMatchQueue = [];
  let tmdbMatchSummary = { auto: 0, fuzzy: 0, none: 0, manual: 0, skipped: 0 };

  async function runTmdbMatchBatch() {
    const candidates = titles.filter((t) => !t.tmdbId);
    if (candidates.length === 0) {
      alert("Every title already has a TMDB match.");
      return;
    }

    els.matchTmdbBtn.disabled = true;
    tmdbMatchQueue = [];
    tmdbMatchSummary = { auto: 0, fuzzy: 0, none: 0, manual: 0, skipped: 0 };

    for (let i = 0; i < candidates.length; i++) {
      const t = candidates[i];
      els.matchTmdbLabel.textContent = `Matching ${i + 1}/${candidates.length}…`;
      try {
        const results = await tmdbSearchForTitle(t);
        const decision = pickTmdbMatch(t, results);
        if (decision.outcome === "auto") {
          applyTmdbMatchToTitle(t, decision.match);
          tmdbMatchSummary.auto++;
        } else if (decision.outcome === "fuzzy") {
          applyTmdbMatchToTitle(t, decision.match);
          tmdbMatchSummary.fuzzy++;
        } else if (decision.outcome === "ambiguous") {
          tmdbMatchQueue.push({ title: t, candidates: decision.candidates });
        } else {
          tmdbMatchSummary.none++;
        }
      } catch {
        tmdbMatchSummary.none++;
      }
    }

    saveTitles(titles);
    render();
    els.matchTmdbBtn.disabled = false;
    els.matchTmdbLabel.textContent = "Match TMDB";

    if (tmdbMatchQueue.length > 0) {
      showNextTmdbMatchAmbiguity();
    } else {
      reportTmdbMatchSummary();
    }
  }

  function reportTmdbMatchSummary() {
    const s = tmdbMatchSummary;
    const lines = [];
    if (s.auto) lines.push(`${s.auto} linked automatically`);
    if (s.fuzzy) lines.push(`${s.fuzzy} linked (best guess — no exact title match)`);
    if (s.manual) lines.push(`${s.manual} resolved by you`);
    if (s.skipped) lines.push(`${s.skipped} skipped`);
    if (s.none) lines.push(`${s.none} had no match on TMDB`);
    alert(lines.length ? `TMDB matching done:\n${lines.join("\n")}` : "Nothing to match.");
  }

  function showNextTmdbMatchAmbiguity() {
    if (tmdbMatchQueue.length === 0) {
      els.tmdbMatchBackdrop.hidden = true;
      saveTitles(titles);
      render();
      reportTmdbMatchSummary();
      return;
    }
    const { title: t, candidates } = tmdbMatchQueue[0];
    els.tmdbMatchSubtitle.textContent = `${candidates.length} titles on TMDB are named "${t.name}" — which one is yours?`;
    els.tmdbMatchCandidates.innerHTML = candidates
      .map((r, i) => {
        const isMovie = r.media_type === "movie";
        const date = isMovie ? r.release_date : r.first_air_date;
        const year = date ? date.slice(0, 4) : "—";
        const typeLabel = isMovie ? "Movie" : "Series";
        const poster = r.poster_path
          ? `<img class="tmdb-result-poster" src="${TMDB_POSTER_LIST}${r.poster_path}" alt="" />`
          : `<span class="tmdb-result-poster-placeholder"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></span>`;
        return `
        <button type="button" class="tmdb-result" data-candidate="${i}">
          ${poster}
          <span class="tmdb-result-info">
            <span class="tmdb-result-title">${escapeHtml(typeLabel)} · ${escapeHtml(year)}</span>
            <span class="tmdb-result-meta">${escapeHtml((r.overview || "").slice(0, 80))}${r.overview && r.overview.length > 80 ? "…" : ""}</span>
          </span>
        </button>`;
      })
      .join("");
    els.tmdbMatchCandidates.querySelectorAll("[data-candidate]").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyTmdbMatchToTitle(t, candidates[Number(btn.dataset.candidate)]);
        tmdbMatchSummary.manual++;
        tmdbMatchQueue.shift();
        showNextTmdbMatchAmbiguity();
      });
    });
    els.tmdbMatchBackdrop.hidden = false;
  }

  function skipCurrentTmdbMatch() {
    if (tmdbMatchQueue.length === 0) return;
    tmdbMatchQueue.shift();
    tmdbMatchSummary.skipped++;
    showNextTmdbMatchAmbiguity();
  }

  function closeTmdbMatchModal() {
    // Treat the rest of the queue as skipped rather than leaving it
    // silently unresolved.
    tmdbMatchSummary.skipped += tmdbMatchQueue.length;
    tmdbMatchQueue = [];
    els.tmdbMatchBackdrop.hidden = true;
    saveTitles(titles);
    render();
    reportTmdbMatchSummary();
  }

  // ---------- Discover ----------

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  let discoverData = null;
  let discoverTrendingTab = "movie";
  let heroTimer = null;
  let heroIndex = 0;
  let heroPaused = false;

  // Runs `fn` over `items` with at most `limit` requests in flight at
  // once, instead of firing them all in one Promise.all — a library with
  // many tracked series could otherwise burst well past TMDB's per-second
  // rate limit and have most requests silently fail.
  async function mapWithConcurrency(items, limit, fn) {
    const results = new Array(items.length);
    let next = 0;
    async function worker() {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
  }

  // Looks up one tracked series' own TMDB page for its most recently
  // aired episode, rather than relying on TMDB's global "airing today"
  // list (which only covers a small slice of all TV and rarely includes
  // what you actually watch).
  async function fetchLatestEpisodeForSeries(t) {
    let details;
    try {
      details = await tmdbFetch(`/tv/${t.tmdbId}?language=en-US`);
    } catch {
      return { ok: false, reason: "fetch-error" };
    }
    const episode = details.last_episode_to_air || details.next_episode_to_air;
    if (!episode || !episode.air_date) return { ok: false, reason: "no-episode" };
    return {
      ok: true,
      data: {
        id: details.id,
        name: details.name,
        media_type: "tv",
        poster_path: details.poster_path,
        backdrop_path: details.backdrop_path,
        first_air_date: details.first_air_date,
        vote_average: details.vote_average,
        overview: details.overview,
        genre_ids: (details.genres || []).map((g) => g.id),
        _episodeInfo: { season: episode.season_number, episode: episode.episode_number },
        _episodeAirDate: episode.air_date,
        _localTitleId: t.id,
      },
    };
  }

  async function fetchLatestEpisodesForLibrary() {
    const tracked = titles.filter(
      (t) => t.type === "SERIES" && t.tmdbId && t.tmdbMediaType === "tv" && t.status !== "DROPPED"
    );
    if (tracked.length === 0) {
      return {
        items: [],
        emptyReason:
          "None of your tracked series are linked to TMDB yet — add them via search, or use the Match TMDB button.",
      };
    }
    const checked = await mapWithConcurrency(tracked, 6, fetchLatestEpisodeForSeries);
    const items = checked
      .filter((c) => c.ok)
      .map((c) => c.data)
      .sort((a, b) => new Date(b._episodeAirDate) - new Date(a._episodeAirDate));

    let emptyReason = null;
    if (items.length === 0) {
      const fetchErrors = checked.filter((c) => !c.ok && c.reason === "fetch-error").length;
      if (fetchErrors === tracked.length) {
        emptyReason = `Checked ${tracked.length} tracked series but couldn't reach TMDB for any of them — try Refresh in a bit.`;
      } else if (fetchErrors > 0) {
        emptyReason = `Checked ${tracked.length} tracked series (${fetchErrors} couldn't be reached) — none had episode info on TMDB.`;
      } else {
        emptyReason = `Checked ${tracked.length} tracked series — none had episode info on TMDB yet.`;
      }
    }
    return { items, emptyReason };
  }

  async function fetchDiscoverData() {
    const [all, trendMovie, trendTv, airing, popMovies, topTv] = await Promise.all([
      tmdbFetch("/trending/all/day?language=en-US"),
      tmdbFetch("/trending/movie/day?language=en-US"),
      tmdbFetch("/trending/tv/day?language=en-US"),
      fetchLatestEpisodesForLibrary(),
      tmdbFetch("/movie/popular?language=en-US"),
      tmdbFetch("/tv/top_rated?language=en-US"),
    ]);
    return {
      date: todayKey(),
      hero: (all.results || [])
        .filter((r) => (r.media_type === "movie" || r.media_type === "tv") && r.backdrop_path)
        .slice(0, 6),
      trendingMovie: (trendMovie.results || []).map((r) => ({ ...r, media_type: "movie" })).slice(0, 10),
      trendingTv: (trendTv.results || []).map((r) => ({ ...r, media_type: "tv" })).slice(0, 10),
      latestEpisodes: airing.items.slice(0, 14),
      latestEpisodesEmptyReason: airing.emptyReason,
      popularMovies: (popMovies.results || []).map((r) => ({ ...r, media_type: "movie" })).slice(0, 14),
      topRatedTv: (topTv.results || []).map((r) => ({ ...r, media_type: "tv" })).slice(0, 14),
    };
  }

  async function loadDiscoverData(forceRefresh) {
    if (!forceRefresh) {
      try {
        const cached = JSON.parse(localStorage.getItem(DISCOVER_CACHE_KEY) || "null");
        if (cached && cached.date === todayKey()) {
          discoverData = cached;
          els.discoverStatus.textContent = "Trending today, updated automatically.";
          renderDiscoverSections();
          return;
        }
      } catch {
        // A corrupt cache just means we refetch below.
      }
    }
    els.discoverStatus.textContent = "Loading what's trending…";
    els.discoverRefreshBtn.disabled = true;
    try {
      discoverData = await fetchDiscoverData();
      localStorage.setItem(DISCOVER_CACHE_KEY, JSON.stringify(discoverData));
      els.discoverStatus.textContent = "Trending today, updated automatically.";
    } catch {
      discoverData = null;
      els.discoverStatus.textContent = "Couldn't reach TMDB right now — try Refresh in a bit.";
    }
    els.discoverRefreshBtn.disabled = false;
    renderDiscoverSections();
  }

  function discoverAddButtonMarkup(r) {
    if (isAlreadyAdded(r)) {
      return `<span class="discover-add-btn added" title="Already in your library"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    }
    return `<button type="button" class="discover-add-btn" data-quick-add="${r.media_type}:${r.id}" title="Add to Plan to Watch"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg></button>`;
  }

  function discoverHeroAddButtonMarkup(r) {
    if (isAlreadyAdded(r)) {
      return `<span class="btn btn-ghost" style="cursor:default;"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg> In your library</span>`;
    }
    return `<button type="button" class="btn btn-primary" data-hero-add="1"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg> Add to Plan to Watch</button>`;
  }

  function quickAddFromDiscover(result) {
    if (isAlreadyAdded(result)) return;
    const isMovie = result.media_type === "movie";
    const now = Date.now();
    const t = {
      id: uid(),
      name: isMovie ? result.title : result.name,
      type: isMovie ? "MOVIE" : "SERIES",
      status: "PLAN_TO_WATCH",
      posterUrl: "",
      watchUrl: "",
      tags: [],
      currentSeason: 1,
      currentEpisode: 0,
      totalSeasons: null,
      totalEpisodes: null,
      notes: "",
      year: null,
      myScore: null,
      tmdbScore: null,
      collection: "",
      franchise: "",
      tmdbId: null,
      tmdbMediaType: null,
      collectionOrder: null,
      watchOrder: null,
      createdAt: now,
      updatedAt: now,
    };
    applyTmdbMatchToTitle(t, result);
    titles.unshift(t);
    saveTitles(titles);
    render();
    renderDiscoverSections();
  }

  function discoverCardMarkup(r, opts = {}) {
    const isMovie = r.media_type === "movie";
    const title = isMovie ? r.title : r.name;
    const date = isMovie ? r.release_date : r.first_air_date;
    const year = date ? date.slice(0, 4) : "";
    const typeLabel = isMovie ? "Movie" : "Series";
    const imgPath = opts.useBackdrop ? r.backdrop_path : r.poster_path;
    const imgBase = opts.useBackdrop ? TMDB_BACKDROP : TMDB_POSTER_FULL;
    const img = imgPath
      ? `<img src="${imgBase}${imgPath}" alt="${escapeHtml(title)}" loading="lazy" />`
      : `<div class="poster-placeholder"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></div>`;
    const score = r.vote_average ? `<span class="discover-card-score">★ ${Math.round(r.vote_average * 10)}%</span>` : "";
    const rank = opts.rank ? `<span class="discover-card-rank">${opts.rank}</span>` : "";
    const episodeBadge = r._episodeInfo
      ? `<span class="discover-card-episode">S${r._episodeInfo.season} · E${r._episodeInfo.episode}</span>`
      : "";
    const clickable = r._localTitleId ? ` data-open-library="${r._localTitleId}" role="button" tabindex="0"` : "";
    return `
    <div class="discover-card${opts.useBackdrop ? " discover-card-wide" : ""}">
      <div class="discover-card-poster"${clickable}>
        ${img}
        ${score}
        ${discoverAddButtonMarkup(r)}
        ${rank}
        ${episodeBadge}
      </div>
      <div class="discover-card-title">${escapeHtml(title)}</div>
      <div class="discover-card-meta">${typeLabel} · ${
        opts.useAiredMeta && r._episodeAirDate ? timeAgo(new Date(r._episodeAirDate).getTime()) : year
      }</div>
    </div>`;
  }

  function updateCarouselArrows(row) {
    const wrap = row.closest(".carousel-row-wrap");
    if (!wrap) return;
    const left = wrap.querySelector(".carousel-arrow-left");
    const right = wrap.querySelector(".carousel-arrow-right");
    const maxScroll = row.scrollWidth - row.clientWidth;
    if (left) left.hidden = row.scrollLeft <= 2;
    if (right) right.hidden = maxScroll <= 2 || row.scrollLeft >= maxScroll - 2;
  }

  function renderCarouselRow(containerId, items, opts = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (items.length === 0) {
      el.innerHTML = `<p class="carousel-empty">${escapeHtml(opts.emptyMessage || "Nothing to show right now.")}</p>`;
      return;
    }
    el.innerHTML = items.map((r, i) => discoverCardMarkup(r, { ...opts, rank: opts.ranked ? i + 1 : null })).join("");
    el.querySelectorAll("[data-quick-add]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const [mediaType, idStr] = btn.dataset.quickAdd.split(":");
        const id = Number(idStr);
        const result = items.find((r) => r.id === id && r.media_type === mediaType);
        if (result) quickAddFromDiscover(result);
      });
    });
    el.querySelectorAll("[data-open-library]").forEach((poster) => {
      poster.addEventListener("click", () => openModal(poster.dataset.openLibrary));
      poster.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(poster.dataset.openLibrary);
        }
      });
    });
    updateCarouselArrows(el);
    el.addEventListener("scroll", () => updateCarouselArrows(el));
  }

  function carouselBlockMarkup(id, heading, options = {}) {
    const toggleHtml = options.toggle
      ? `<div class="carousel-toggle">
           <button type="button" class="chip ${discoverTrendingTab === "movie" ? "active" : ""}" data-trend-tab="movie">Movies</button>
           <button type="button" class="chip ${discoverTrendingTab === "tv" ? "active" : ""}" data-trend-tab="tv">Series</button>
         </div>`
      : "";
    return `
    <div class="carousel-block">
      <div class="carousel-header">
        <h3>${escapeHtml(heading)}</h3>
        ${toggleHtml}
      </div>
      <div class="carousel-row-wrap">
        <button type="button" class="carousel-arrow carousel-arrow-left" data-scroll-target="${id}" data-dir="-1">‹</button>
        <div class="carousel-row" id="${id}"></div>
        <button type="button" class="carousel-arrow carousel-arrow-right" data-scroll-target="${id}" data-dir="1">›</button>
      </div>
    </div>`;
  }

  function renderDiscoverSections() {
    renderDiscoverHero();

    if (!discoverData) {
      els.discoverCarousels.innerHTML = "";
      return;
    }

    els.discoverCarousels.innerHTML = [
      carouselBlockMarkup("discover-trending-row", "Trending Today", { toggle: true }),
      carouselBlockMarkup("discover-airing-row", "Latest Episodes"),
      carouselBlockMarkup("discover-popular-row", "Popular Movies"),
      carouselBlockMarkup("discover-top-rated-row", "Top Rated Series"),
    ].join("");

    const trendingItems = discoverTrendingTab === "movie" ? discoverData.trendingMovie : discoverData.trendingTv;
    renderCarouselRow("discover-trending-row", trendingItems, { ranked: true });
    renderCarouselRow("discover-airing-row", discoverData.latestEpisodes, {
      useBackdrop: true,
      useAiredMeta: true,
      emptyMessage:
        discoverData.latestEpisodesEmptyReason ||
        "No recent episode info found for the series you're tracking.",
    });
    renderCarouselRow("discover-popular-row", discoverData.popularMovies);
    renderCarouselRow("discover-top-rated-row", discoverData.topRatedTv);

    els.discoverCarousels.querySelectorAll("[data-trend-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        discoverTrendingTab = btn.dataset.trendTab;
        renderDiscoverSections();
      });
    });
    els.discoverCarousels.querySelectorAll("[data-scroll-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = document.getElementById(btn.dataset.scrollTarget);
        if (row) row.scrollBy({ left: Number(btn.dataset.dir) * 420, behavior: "smooth" });
      });
    });
  }

  function renderDiscoverHero() {
    if (!discoverData || !discoverData.hero || discoverData.hero.length === 0) {
      els.discoverHero.hidden = true;
      stopHeroRotation();
      return;
    }
    els.discoverHero.hidden = false;
    if (heroIndex >= discoverData.hero.length) heroIndex = 0;

    const slides = discoverData.hero
      .map((r, i) => {
        const isMovie = r.media_type === "movie";
        const title = isMovie ? r.title : r.name;
        const date = isMovie ? r.release_date : r.first_air_date;
        const year = date ? date.slice(0, 4) : "";
        const typeLabel = isMovie ? "Movie" : "Series";
        const score = r.vote_average ? Math.round(r.vote_average * 10) : null;
        return `
        <div class="discover-hero-slide${i === heroIndex ? " active" : ""}" style="background-image:url('${TMDB_BACKDROP}${r.backdrop_path}')">
          <div class="discover-hero-content">
            <div class="discover-hero-kicker">Trending Today</div>
            <h3 class="discover-hero-title">${escapeHtml(title)}</h3>
            <div class="discover-hero-meta">
              ${score ? `<span class="discover-hero-score">${score}%</span>` : ""}
              ${year ? `<span>${year}</span>` : ""}
              <span>${typeLabel}</span>
            </div>
            <p class="discover-hero-overview">${escapeHtml(r.overview || "")}</p>
            <div class="discover-hero-actions">${discoverHeroAddButtonMarkup(r)}</div>
          </div>
        </div>`;
      })
      .join("");

    const dots = `<div class="discover-hero-dots">${discoverData.hero
      .map((_, i) => `<button type="button" class="discover-hero-dot${i === heroIndex ? " active" : ""}" data-hero-dot="${i}"></button>`)
      .join("")}</div>`;

    els.discoverHero.innerHTML = slides + dots;

    els.discoverHero.querySelectorAll("[data-hero-dot]").forEach((btn) => {
      btn.addEventListener("click", () => {
        heroIndex = Number(btn.dataset.heroDot);
        renderDiscoverHero();
      });
    });
    const addBtn = els.discoverHero.querySelector("[data-hero-add]");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        quickAddFromDiscover(discoverData.hero[heroIndex]);
        renderDiscoverHero();
      });
    }

    startHeroRotation();
  }

  function startHeroRotation() {
    stopHeroRotation();
    heroTimer = setInterval(() => {
      if (heroPaused || !discoverData || !discoverData.hero.length) return;
      heroIndex = (heroIndex + 1) % discoverData.hero.length;
      renderDiscoverHero();
    }, HERO_ROTATE_MS);
  }

  function stopHeroRotation() {
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = null;
  }

  function openModal(id) {
    state.modalTitleId = id || null;
    state.isAdding = !id;
    const t = id ? titles.find((x) => x.id === id) : null;
    hideTmdbResults();

    els.modalTitle.textContent = t ? "Edit title" : "Add a title";
    els.submitBtn.textContent = t ? "Save changes" : "Add title";
    els.deleteBtn.hidden = !t;

    document.getElementById("f-name").value = t?.name || "";
    els.fType.value = t?.type || "SERIES";
    document.getElementById("f-status").value = t?.status || "PLAN_TO_WATCH";
    document.getElementById("f-poster").value = t?.posterUrl || "";
    document.getElementById("f-watch").value = t?.watchUrl || "";
    document.getElementById("f-tags").value = (t?.tags || []).join(", ");
    document.getElementById("f-season").value = t?.currentSeason ?? 1;
    document.getElementById("f-episode").value = t?.currentEpisode ?? 0;
    document.getElementById("f-total-seasons").value = t?.totalSeasons ?? "";
    document.getElementById("f-total-episodes").value = t?.totalEpisodes ?? "";
    document.getElementById("f-notes").value = t?.notes || "";
    els.fYear.value = t?.year ?? "";
    els.fMyScore.value = t?.myScore ?? "";
    els.fTmdbScore.value = t?.tmdbScore ?? "";
    els.fCollection.value = t?.collection || "";
    els.fFranchise.value = t?.franchise || "";
    els.fTmdbId.value = t?.tmdbId ?? "";
    els.fTmdbMediaType.value = t?.tmdbMediaType || "";

    toggleSeasonFields();
    els.backdrop.hidden = false;
  }

  function closeModal() {
    els.backdrop.hidden = true;
    state.modalTitleId = null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("f-name").value.trim();
    if (!name) return;

    const tags = document
      .getElementById("f-tags")
      .value.split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const totalSeasonsVal = document.getElementById("f-total-seasons").value;
    const totalEpisodesVal = document.getElementById("f-total-episodes").value;
    const yearVal = els.fYear.value;
    const myScoreVal = els.fMyScore.value;
    const tmdbScoreVal = els.fTmdbScore.value;

    const data = {
      name,
      type: els.fType.value,
      status: document.getElementById("f-status").value,
      posterUrl: document.getElementById("f-poster").value.trim(),
      watchUrl: document.getElementById("f-watch").value.trim(),
      tags,
      currentSeason: Number(document.getElementById("f-season").value) || 1,
      currentEpisode: Number(document.getElementById("f-episode").value) || 0,
      totalSeasons: totalSeasonsVal ? Number(totalSeasonsVal) : null,
      totalEpisodes: totalEpisodesVal ? Number(totalEpisodesVal) : null,
      notes: document.getElementById("f-notes").value,
      year: yearVal ? Number(yearVal) : null,
      myScore: myScoreVal ? Number(myScoreVal) : null,
      tmdbScore: tmdbScoreVal ? Number(tmdbScoreVal) : null,
      collection: els.fCollection.value.trim(),
      franchise: els.fFranchise.value.trim(),
      tmdbId: els.fTmdbId.value ? Number(els.fTmdbId.value) : null,
      tmdbMediaType: els.fTmdbMediaType.value || null,
    };

    const now = Date.now();
    if (state.modalTitleId) {
      const t = titles.find((x) => x.id === state.modalTitleId);
      Object.assign(t, data, { updatedAt: now });
    } else {
      titles.unshift({ id: uid(), ...data, createdAt: now, updatedAt: now });
    }
    saveTitles(titles);
    closeModal();
    render();
  }

  function handleDelete() {
    if (!state.modalTitleId) return;
    titles = titles.filter((t) => t.id !== state.modalTitleId);
    saveTitles(titles);
    closeModal();
    render();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(titles, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tv-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let incoming;
      try {
        incoming = JSON.parse(reader.result);
      } catch {
        alert("That file isn't valid JSON — couldn't import it.");
        return;
      }
      if (!Array.isArray(incoming)) {
        alert("That file doesn't look like a TV Tracker backup (expected a list of titles).");
        return;
      }
      const existingIds = new Set(titles.map((t) => t.id));
      let added = 0;
      let skipped = 0;
      for (const item of incoming) {
        if (!item || typeof item.id !== "string" || typeof item.name !== "string") {
          skipped++;
          continue;
        }
        if (existingIds.has(item.id)) {
          skipped++;
          continue;
        }
        titles.push(item);
        existingIds.add(item.id);
        added++;
      }
      saveTitles(titles);
      render();
      alert(
        `Imported ${added} title${added === 1 ? "" : "s"}.` +
          (skipped ? ` Skipped ${skipped} (already in your library or invalid).` : "")
      );
    };
    reader.readAsText(file);
  }

  els.openAdd.addEventListener("click", () => openModal(null));
  els.closeModal.addEventListener("click", closeModal);
  els.backdrop.addEventListener("click", (e) => {
    if (e.target === els.backdrop) closeModal();
  });
  els.closeCollectionModal.addEventListener("click", closeCollectionModal);
  els.collectionBackdrop.addEventListener("click", (e) => {
    if (e.target === els.collectionBackdrop) closeCollectionModal();
  });
  els.closeFranchiseModal.addEventListener("click", closeFranchiseModal);
  els.franchiseBackdrop.addEventListener("click", (e) => {
    if (e.target === els.franchiseBackdrop) closeFranchiseModal();
  });
  els.matchTmdbBtn.addEventListener("click", runTmdbMatchBatch);
  els.tmdbMatchSkip.addEventListener("click", skipCurrentTmdbMatch);
  els.closeTmdbMatchModal.addEventListener("click", closeTmdbMatchModal);
  els.tmdbMatchBackdrop.addEventListener("click", (e) => {
    if (e.target === els.tmdbMatchBackdrop) closeTmdbMatchModal();
  });
  els.form.addEventListener("submit", handleSubmit);
  els.deleteBtn.addEventListener("click", handleDelete);
  els.fType.addEventListener("change", toggleSeasonFields);
  els.fName.addEventListener(
    "input",
    debounce((e) => searchTmdb(e.target.value), 400)
  );
  document.addEventListener("click", (e) => {
    if (!els.tmdbResults.hidden && !e.target.closest(".tmdb-field")) hideTmdbResults();
  });
  els.search.addEventListener("input", (e) => {
    state.query = e.target.value;
    els.searchClear.hidden = !e.target.value;
    renderGrid();
  });
  els.searchClear.addEventListener("click", () => {
    els.search.value = "";
    state.query = "";
    els.searchClear.hidden = true;
    els.search.focus();
    renderGrid();
  });
  els.sort.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderGrid();
  });
  els.exportBtn.addEventListener("click", exportData);
  els.importBtn.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) importData(file);
    e.target.value = "";
  });
  els.discoverRefreshBtn.addEventListener("click", () => loadDiscoverData(true));
  window.addEventListener("resize", () => {
    document.querySelectorAll(".carousel-row").forEach((row) => updateCarouselArrows(row));
  });
  els.discoverHero.addEventListener("mouseenter", () => {
    heroPaused = true;
  });
  els.discoverHero.addEventListener("mouseleave", () => {
    heroPaused = false;
  });

  render();
  loadDiscoverData(false);
})();
