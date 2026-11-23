# TV Tracker

A personal watchlist for series and movies — a visual, poster-grid library
(inspired by sites like Comick) instead of a spreadsheet.

Track what you're watching, plan to watch, have finished, or dropped, with
your current season/episode, genre tags, and a link to where you watch it.

## Running it

No install, no build step. Just open `index.html` in your browser
(double-click it, or right-click → Open with → your browser).

Your data is saved in the browser's local storage, under the device/browser
you're using. It stays there across restarts, but it won't follow you to a
different browser or computer.

### Hosting it online (optional)

If you'd like it as a real URL you can open from any device (like a
GitHub Pages site), push this repo and enable Pages on it — it's pure
static files (`index.html`, `style.css`, `app.js`), so no build
configuration is needed.

## Discover

Above your library sits a Discover section, pulled live from TMDB: a
rotating hero banner of what's trending, a Trending Today top-10 (with a
Movies/Series toggle), Popular Movies, and Top Rated Series — each a
horizontally scrollable row. Click the **+** on any card (or "Add to Plan
to Watch" on the hero) to add it straight to your library with its
poster, year, and score filled in; already-added titles show a checkmark
instead.

**Latest Episodes** is different from the rest: instead of showing
whatever TMDB says is airing somewhere today, it checks the series
you're already tracking (skipping dropped ones) for their most recently
aired episode and lists them newest-first, with which one (e.g.
"S2 · E6") and how long ago it aired. Click a card there to jump
straight into updating that title's progress.

It refreshes once per day automatically and caches that day's results
locally so reopening the page doesn't refetch; the **Refresh** button
forces a new fetch anytime. If TMDB can't be reached, this section just
says so and your tracked library underneath is completely unaffected.

## Features

- Poster grid library with a status badge (plan to watch / watching / on
  hold / completed / dropped) in the corner of each card
- Season & episode progress shown on every card, with a one-click **+1
  episode** button (or **mark as watched** for movies) right on the poster
  — no need to open the edit form just to log progress
- Release year, TMDB audience score, and your own personal rating shown on
  each card
- A "watch now" link per title that opens in a new tab
- Filter by status and by genre/tag; search; sort by recently updated/added,
  name, audience score, or your own rating
- Add, edit, and delete titles from a single form
- **Match TMDB** — a one-click button that links every existing title
  without a TMDB connection (e.g. ones you added before this feature, or
  typed in by hand) by searching for it and filling in whatever's missing
  (poster, year, audience score, genres). It links automatically whenever
  the match is clear, and only stops to ask when two or more TMDB results
  share the exact same title — everything else is resolved on its own.
- **Export / Import** — download your whole library as a JSON file and
  restore it later. Since everything lives in this browser's local storage
  only (see below), export a backup occasionally so a cleared cache or a
  new device doesn't mean losing your list.
- **Collections** — tag related titles (e.g. a trilogy, or a show and its
  spin-offs) with the same Collection name and they're grouped into one
  stacked card instead of cluttering the grid, with a "2/3 done" badge
  showing how many parts you've completed. Click it to open the parts
  panel: drag to reorder them (the one on top becomes the stack's cover
  poster), or click a part to open its own edit view. Auto-filled from
  TMDB for movie franchises that have an official collection; everything
  else (most TV franchises, like a show and its sequel series) you tag by
  hand.
- **Franchises** — when several collections (or standalone movies) belong
  to one bigger universe — e.g. Iron Man, Avengers, and Captain America
  all being Marvel — tag them all with the same Franchise name. A
  "Marvel" filter chip appears that shows every related stack and single
  side by side, and its **Reorder** button opens a drag-to-order panel
  across all of them (stacks included) to set your own watch order —
  handy since release order and in-universe order often aren't the same.
  Sort by "Watch order" to see your whole library in that sequence.

## Adding a title

Click **Add title** and start typing the name — matching series and movies
from [TMDB](https://www.themoviedb.org) show up in a dropdown, with a green
checkmark on any result you've already added, and picking one auto-fills
the poster, type, genres, and (for series) total seasons and "episodes in
this season" — scoped to whichever season number you have selected, not
the show's all-time episode count, so you can actually tell what episode
you're on. Changing the Season field re-fills that count for the new
season automatically, and the **+1 episode** button on the card rolls over
into the next season once you pass the last one (when that data is
available). You can still edit any of that, or skip the search and fill
everything in by hand. Add the where-to-watch link and your current
season/episode, then save. Click any card afterwards to update your
progress or status, or to delete it.

Titles added before this existed (or added without a season breakdown)
show their old all-time total until you open them again — opening a
series' edit view quietly fetches the real per-season counts from TMDB
in the background and corrects it, no action needed.

### About the TMDB API key

`app.js` contains a TMDB "API Read Access Token," used only for searching
titles and posters. It's a read-only, rate-limited key meant for exactly
this kind of client-side use — TMDB's own docs expect it to ship in
public/static projects like this one. It can't access your account or
anything billing-related. If it's ever misused, regenerate it for free at
themoviedb.org → Settings → API and swap the `TMDB_TOKEN` value in
`app.js`.
