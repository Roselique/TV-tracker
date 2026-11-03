# TV Tracker

A personal watchlist for series and movies — a visual, poster-grid library
(inspired by sites like Comick) instead of a spreadsheet.

Track what you're watching, plan to watch, have finished, or dropped, with
your current season/episode, genre tags, and a link to where you watch it.

## Features

- Poster grid library with a status badge (plan to watch / watching / on
  hold / completed / dropped) in the corner of each card
- Season & episode progress shown on every card
- A "watch now" link per title that opens in a new tab
- Filter by status and by genre/tag, plus search and sorting
- Add, edit, and delete titles from a single form

## Getting started

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Data is stored in a
local SQLite file at `prisma/dev.db`.

Optionally load a few sample titles:

```bash
npm run db:seed
```

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + SQLite for storage
- [lucide-react](https://lucide.dev) for icons

## Adding a title

Click **Add title** and fill in the name, poster image URL, where-to-watch
link, genres/tags (comma separated), and your current season/episode. Click
any card afterwards to update your progress or status, or to delete it.
