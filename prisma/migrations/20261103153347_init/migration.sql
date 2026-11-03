-- CreateTable
CREATE TABLE "Title" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SERIES',
    "status" TEXT NOT NULL DEFAULT 'PLAN_TO_WATCH',
    "posterUrl" TEXT,
    "watchUrl" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "currentSeason" INTEGER NOT NULL DEFAULT 1,
    "currentEpisode" INTEGER NOT NULL DEFAULT 0,
    "totalSeasons" INTEGER,
    "totalEpisodes" INTEGER,
    "rating" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
