import { NextResponse } from "next/server";
import { getCities, getTopCitiesByVenueCount } from "@/lib/data/public";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort");
  const limit = searchParams.get("limit");

  if (sort === "venues") {
    const cities = await getTopCitiesByVenueCount(limit ? parseInt(limit) : 5);
    return NextResponse.json(cities);
  }

  const cities = await getCities();
  return NextResponse.json(cities);
}
