import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTags } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.type !== undefined) data.type = body.type;
  if (body.status !== undefined) data.status = body.status;
  if (body.posterUrl !== undefined) data.posterUrl = body.posterUrl || null;
  if (body.watchUrl !== undefined) data.watchUrl = body.watchUrl || null;
  if (body.tags !== undefined)
    data.tags = Array.isArray(body.tags) ? serializeTags(body.tags) : body.tags;
  if (body.currentSeason !== undefined)
    data.currentSeason = Number(body.currentSeason) || 1;
  if (body.currentEpisode !== undefined)
    data.currentEpisode = Number(body.currentEpisode) || 0;
  if (body.totalSeasons !== undefined)
    data.totalSeasons = body.totalSeasons ? Number(body.totalSeasons) : null;
  if (body.totalEpisodes !== undefined)
    data.totalEpisodes = body.totalEpisodes ? Number(body.totalEpisodes) : null;
  if (body.rating !== undefined)
    data.rating = body.rating ? Number(body.rating) : null;
  if (body.notes !== undefined) data.notes = body.notes || null;

  try {
    const title = await prisma.title.update({ where: { id }, data });
    return NextResponse.json(title);
  } catch {
    return NextResponse.json({ error: "Title not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.title.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Title not found" }, { status: 404 });
  }
}
