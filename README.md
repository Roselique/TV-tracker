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

## Adding a title

Click **Add title** and start typing the name — matching series and movies
from [TMDB](https://www.themoviedb.org) show up in a dropdown, and picking
one auto-fills the poster, type, genres, and (for series) total seasons and
episodes. You can still edit any of that, or skip the search and fill
everything in by hand. Add the where-to-watch link and your current
season/episode, then save. Click any card afterwards to update your
progress or status, or to delete it.

### About the TMDB API key

`app.js` contains a TMDB "API Read Access Token," used only for searching
titles and posters. It's a read-only, rate-limited key meant for exactly
this kind of client-side use — TMDB's own docs expect it to ship in
public/static projects like this one. It can't access your account or
anything billing-related. If it's ever misused, regenerate it for free at
themoviedb.org → Settings → API and swap the `TMDB_TOKEN` value in
`app.js`.
