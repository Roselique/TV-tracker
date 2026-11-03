import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sample = [
  {
    name: "Arcane",
    type: "SERIES",
    status: "WATCHING",
    posterUrl: "/posters/arcane.svg",
    watchUrl: "https://www.netflix.com/title/81435684",
    tags: "Fantasy,Action,Animation",
    currentSeason: 2,
    currentEpisode: 4,
    totalSeasons: 2,
    totalEpisodes: 18,
  },
  {
    name: "The Bear",
    type: "SERIES",
    status: "COMPLETED",
    posterUrl: "/posters/thebear.svg",
    watchUrl: "https://www.hulu.com/series/the-bear",
    tags: "Drama,Comedy",
    currentSeason: 3,
    currentEpisode: 10,
    totalSeasons: 3,
    totalEpisodes: 28,
  },
  {
    name: "Dune: Part Two",
    type: "MOVIE",
    status: "PLAN_TO_WATCH",
    posterUrl: "/posters/dune2.svg",
    watchUrl: "https://www.max.com/movies/dune-part-two",
    tags: "Sci-Fi,Fantasy",
  },
  {
    name: "Severance",
    type: "SERIES",
    status: "WATCHING",
    posterUrl: "/posters/severance.svg",
    watchUrl: "https://tv.apple.com/show/severance",
    tags: "Sci-Fi,Mystery,Drama",
    currentSeason: 2,
    currentEpisode: 1,
    totalSeasons: 2,
    totalEpisodes: 19,
  },
  {
    name: "Attack on Titan",
    type: "SERIES",
    status: "ON_HOLD",
    posterUrl: "/posters/aot.svg",
    watchUrl: "https://crunchyroll.com/attack-on-titan",
    tags: "Anime,Action,Fantasy",
    currentSeason: 4,
    currentEpisode: 12,
    totalSeasons: 4,
    totalEpisodes: 94,
  },
  {
    name: "Cowboy Bebop",
    type: "SERIES",
    status: "DROPPED",
    posterUrl: "/posters/bebop.svg",
    watchUrl: "https://www.crunchyroll.com/cowboy-bebop",
    tags: "Anime,Sci-Fi",
    currentSeason: 1,
    currentEpisode: 5,
    totalSeasons: 1,
    totalEpisodes: 26,
  },
];

async function main() {
  for (const title of sample) {
    await prisma.title.create({ data: title });
  }
  console.log(`Seeded ${sample.length} titles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
