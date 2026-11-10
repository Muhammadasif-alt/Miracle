import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/session";

/**
 * GET ?type=city|area&q=…&country=PK[&lat=&lon=]
 * Place suggestions for the Lead Finder from Photon (OpenStreetMap data, free, no key).
 * Cities are limited to the chosen country; areas to ~40 km around the chosen city.
 */
export async function GET(req: NextRequest) {
  if (!(await getMe())) return NextResponse.json({ ok: false, places: [] }, { status: 401 });
  const p = req.nextUrl.searchParams;
  const type = p.get("type") === "area" ? "area" : "city";
  const q = (p.get("q") ?? "").trim().slice(0, 80);
  const country = (p.get("country") ?? "").toUpperCase().slice(0, 2);
  const lat = Number(p.get("lat"));
  const lon = Number(p.get("lon"));
  if (q.length < 2) return NextResponse.json({ ok: true, places: [] });

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "25");
  url.searchParams.set("lang", "en");
  const layers = type === "city" ? ["city"] : ["district", "locality", "city"];
  for (const l of layers) url.searchParams.append("layer", l);
  if (type === "area" && Number.isFinite(lat) && Number.isFinite(lon)) {
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Miracle-LeadFinder/1.0" } });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { features?: { geometry: { coordinates: [number, number] }; properties: Record<string, string> }[] };
    const seen = new Set<string>();
    const places = (data.features ?? [])
      .filter((f) => !country || f.properties.countrycode === country)
      .map((f) => {
        const pr = f.properties;
        const [flon, flat] = f.geometry.coordinates;
        const detail = [type === "area" ? pr.city || pr.county : null, pr.state].filter(Boolean).join(", ");
        return { name: pr.name ?? "", detail, lat: flat, lon: flon };
      })
      .filter((pl) => pl.name && (type === "city" || !Number.isFinite(lat) || km(lat, lon, pl.lat, pl.lon) <= 40))
      .filter((pl) => {
        const k = `${pl.name}|${pl.detail}`.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 8);
    return NextResponse.json({ ok: true, places });
  } catch {
    return NextResponse.json({ ok: false, places: [] });
  }
}

function km(a: number, b: number, c: number, d: number) {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
