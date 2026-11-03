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
- Season & episode progress shown on every card
- A "watch now" link per title that opens in a new tab
- Filter by status and by genre/tag, plus search and sorting
- Add, edit, and delete titles from a single form

## Adding a title

Click **Add title** and fill in the name, poster image URL, where-to-watch
link, genres/tags (comma separated), and your current season/episode. Click
any card afterwards to update your progress or status, or to delete it.
