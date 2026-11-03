import { prisma } from "@/lib/prisma";
import { Title } from "@/lib/types";
import Library from "./components/Library";

export const dynamic = "force-dynamic";

export default async function Home() {
  const titles = await prisma.title.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return <Library initialTitles={JSON.parse(JSON.stringify(titles)) as Title[]} />;
}
