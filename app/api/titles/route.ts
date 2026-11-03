import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTags } from "@/lib/types";

export async function GET() {
  const titles = await prisma.title.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(titles);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const title = await prisma.title.create({
    data: {
      name: body.name.trim(),
      type: body.type ?? "SERIES",
      status: body.status ?? "PLAN_TO_WATCH",
      posterUrl: body.posterUrl || null,
      watchUrl: body.watchUrl || null,
      tags: Array.isArray(body.tags) ? serializeTags(body.tags) : body.tags ?? "",
      currentSeason: Number(body.currentSeason) || 1,
      currentEpisode: Number(body.currentEpisode) || 0,
      totalSeasons: body.totalSeasons ? Number(body.totalSeasons) : null,
      totalEpisodes: body.totalEpisodes ? Number(body.totalEpisodes) : null,
      rating: body.rating ? Number(body.rating) : null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(title, { status: 201 });
}
