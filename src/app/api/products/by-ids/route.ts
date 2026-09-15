import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 100);

  if (ids.length === 0) return NextResponse.json({ products: [] });

  const products = await db.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, price: true, imageUrl: true, sourceSite: true, sourceUrl: true },
  });

  return NextResponse.json({ products });
}
