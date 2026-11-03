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
    if (state.query.trim()) {
      const q = state.query.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    if (state.sort === "updated") list.sort((a, b) => b.updatedAt - a.updatedAt);
    else if (state.sort === "added") list.sort((a, b) => b.createdAt - a.createdAt);
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

  function progressLabel(t) {
    if (t.type === "SERIES") {
      const total = t.totalEpisodes ? ` / ${t.totalEpisodes}` : "";
      return `S${t.currentSeason} · E${t.currentEpisode}${total}`;
    }
    return t.status === "COMPLETED" ? "Watched" : "Movie";
  }

  function renderGrid() {
    const list = visibleTitles();
    els.empty.hidden = list.length !== 0;
    els.empty.querySelector("p").textContent =
      titles.length === 0
        ? "Your library is empty. Add the first title you're watching."
        : "No titles match these filters.";

    els.grid.innerHTML = list
      .map((t) => {
        const icon = STATUS_ICONS[t.status];
        const poster = t.posterUrl
          ? `<img src="${escapeHtml(t.posterUrl)}" alt="${escapeHtml(t.name)}" loading="lazy" />`
          : `<div class="poster-placeholder"><svg viewBox="0 0 24 24" width="32" height="32"><path d="M4 5h16v14H4z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M4 15l4-4 4 4 4-6 4 4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></div>`;
        const watchLink = t.watchUrl
          ? `<a class="watch-link" href="${escapeHtml(t.watchUrl)}" target="_blank" rel="noopener noreferrer" title="Watch now" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M14 4h6v6M20 4l-9 9M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`
          : "";
        const tag0 = (t.tags && t.tags[0]) || (t.type === "MOVIE" ? "Movie" : "Series");

        return `
        <div class="card">
          <button class="poster-btn" data-open="${t.id}">
            ${poster}
            <span class="status-badge" style="background:${icon.color}"><svg viewBox="0 0 24 24" width="13" height="13">${icon.svg}</svg></span>
            ${watchLink}
            <span class="progress-overlay">${escapeHtml(progressLabel(t))}</span>
          </button>
          <button class="card-title-btn" data-open="${t.id}">
            <div class="name">${escapeHtml(t.name)}</div>
            <div class="card-meta"><span>${escapeHtml(tag0)}</span><span>${timeAgo(t.updatedAt)}</span></div>
          </button>
        </div>`;
      })
      .join("");

    els.grid.querySelectorAll("[data-open]").forEach((el) => {
      el.addEventListener("click", () => openModal(el.dataset.open));
    });
  }

  function render() {
    renderStats();
    renderStatusTabs();
    renderTagChips();
    renderGrid();
  }

  function toggleSeasonFields() {
    els.seasonFields.style.display = els.fType.value === "MOVIE" ? "none" : "grid";
  }

  function openModal(id) {
    state.modalTitleId = id || null;
    state.isAdding = !id;
    const t = id ? titles.find((x) => x.id === id) : null;

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

  els.openAdd.addEventListener("click", () => openModal(null));
  els.closeModal.addEventListener("click", closeModal);
  els.backdrop.addEventListener("click", (e) => {
    if (e.target === els.backdrop) closeModal();
  });
  els.form.addEventListener("submit", handleSubmit);
  els.deleteBtn.addEventListener("click", handleDelete);
  els.fType.addEventListener("change", toggleSeasonFields);
  els.search.addEventListener("input", (e) => {
    state.query = e.target.value;
    renderGrid();
  });
  els.sort.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderGrid();
  });

  render();
})();
