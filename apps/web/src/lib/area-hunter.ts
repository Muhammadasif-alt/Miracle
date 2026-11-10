import "server-only";

/**
 * Developer Area Hunter: every business of one niche inside a radius around a place, from two sources —
 *  • OpenStreetMap (free, no key): finds businesses whether or not they're on Google.
 *  • Google Places (GOOGLE_PLACES_API_KEY): the businesses that have a Google listing.
 * A business found on OpenStreetMap with no matching Google listing counts as "not on Google".
 * Without the Google key, Google status is reported as "not checked" — never guessed.
 */

export interface AreaBusiness {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lon: number;
  distanceKm: number;
  /** true = has a Google listing, false = not found on Google, null = Google not checked. */
  onGoogle: boolean | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  rating: number | null;
  reviews: number | null;
  mapsUrl: string | null;
  sources: ("Google" | "OpenStreetMap")[];
}

export interface AreaHuntResult {
  query: { area: string; country: string; niche: string; radiusKm: number };
  center: { lat: number; lon: number; label: string };
  googleChecked: boolean;
  googleNote: string | null;
  osmNote: string | null;
  businesses: AreaBusiness[];
  counts: { total: number; onGoogle: number; notOnGoogle: number; withWebsite: number; withoutWebsite: number };
}

export class AreaHuntError extends Error {}

const UA = "MiracleAreaHunter/1.0 (internal lead research; https://github.com/Muhammadasif-alt/Miracle)";

/** OpenStreetMap tags per niche; anything else falls back to a name search. */
const OSM_TAGS: Record<string, { tags: [string, string][]; names: string }> = {
  landscaper: { tags: [["craft", "gardener"], ["shop", "garden_centre"]], names: "landscap|lawn care|lawn service|lawn|tree service|tree care|arborist|hardscap|irrigation|sod|yard care|yard service|mowing|gardening" },
  dentist: { tags: [["amenity", "dentist"], ["healthcare", "dentist"]], names: "dental|dentist|orthodont" },
  plumber: { tags: [["craft", "plumber"]], names: "plumb" },
  electrician: { tags: [["craft", "electrician"]], names: "electric" },
  roofer: { tags: [["craft", "roofer"]], names: "roof" },
  restaurant: { tags: [["amenity", "restaurant"]], names: "restaurant|grill|kitchen|bistro" },
  cafe: { tags: [["amenity", "cafe"]], names: "cafe|coffee" },
  bakery: { tags: [["shop", "bakery"]], names: "bakery|bake|pastry" },
  salon: { tags: [["shop", "hairdresser"], ["shop", "beauty"]], names: "salon|hair|beauty|barber|nail" },
  gym: { tags: [["leisure", "fitness_centre"]], names: "gym|fitness|crossfit|yoga|pilates" },
  "real estate": { tags: [["office", "estate_agent"]], names: "realty|real estate|realtor|properties" },
  "auto repair": { tags: [["shop", "car_repair"]], names: "auto|automotive|car repair|mechanic|tire" },
  lawyer: { tags: [["office", "lawyer"]], names: "law|attorney|legal" },
  contractor: { tags: [["craft", "builder"], ["office", "construction_company"]], names: "construction|builder|contractor|remodel" },
  cleaning: { tags: [["shop", "dry_cleaning"]], names: "clean|maid|janitor" },
  "pest control": { tags: [["craft", "pest_control"]], names: "pest|termite|exterminat" },
  hvac: { tags: [["craft", "hvac"]], names: "hvac|heating|cooling|air condition" },
};

function nicheKey(niche: string): string {
  const n = niche.toLowerCase().trim();
  if (/landscap|lawn|garden/.test(n)) return "landscaper";
  return Object.keys(OSM_TAGS).find((k) => n.includes(k) || k.includes(n)) ?? n;
}

function km(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(llc|inc|co|company|corp|ltd|the|services?|and)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function sameBusiness(a: { name: string; lat: number; lon: number }, b: { name: string; lat: number; lon: number }): boolean {
  const d = km(a.lat, a.lon, b.lat, b.lon);
  const na = norm(a.name);
  const nb = norm(b.name);
  if (!na || !nb) return false;
  if (na === nb && d < 1.5) return true;
  if ((na.includes(nb) || nb.includes(na)) && Math.min(na.length, nb.length) >= 5 && d < 0.6) return true;
  const ta = new Set(na.split(" "));
  const common = nb.split(" ").filter((t) => t.length > 2 && ta.has(t)).length;
  return d < 0.15 && common >= 1;
}

async function geocode(area: string, country: string): Promise<{ lat: number; lon: number; label: string }> {
  const qs = new URLSearchParams({ q: [area, country].filter(Boolean).join(", "), format: "jsonv2", limit: "1" });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${qs}`, {
    headers: { "user-agent": UA, "accept-language": "en" },
    signal: AbortSignal.timeout(12_000),
  }).catch(() => null);
  if (!res?.ok) throw new AreaHuntError("Couldn't look up that place right now. Try again in a moment.");
  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  const hit = data[0];
  if (!hit) throw new AreaHuntError(`Couldn't find "${area}". Try "Austin, TX" or a ZIP code.`);
  return { lat: Number(hit.lat), lon: Number(hit.lon), label: hit.display_name };
}

type Raw = Omit<AreaBusiness, "distanceKm" | "onGoogle" | "sources"> & { source: "Google" | "OpenStreetMap" };

async function fromOsm(niche: string, lat: number, lon: number, radiusM: number): Promise<{ list: Raw[]; note: string | null }> {
  const key = nicheKey(niche);
  const def = OSM_TAGS[key];
  const names = (def?.names ?? niche.replace(/[^a-z0-9 ]/gi, "").trim()).replace(/"/g, "");
  const around = `(around:${Math.round(radiusM)},${lat},${lon})`;
  // Name search only among things tagged as a business (shop / craft / office / company) — much lighter.
  const parts = [
    ...(def?.tags ?? []).map(([k, v]) => `nwr["${k}"="${v}"]${around};`),
    ...(names ? ["shop", "craft", "office", "company"].map((k) => `nwr["${k}"]["name"~"${names}",i]${around};`) : []),
  ].join("\n");
  const q = `[out:json][timeout:40];(
${parts}
);out center tags 400;`;
  // Public Overpass servers are often busy: ask three at once and use the first good answer.
  const endpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
  const res = await Promise.any(
    endpoints.map(async (endpoint) => {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "user-agent": UA, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: q }),
        signal: AbortSignal.timeout(35_000),
      });
      if (!r.ok) throw new Error(String(r.status));
      return r;
    }),
  ).catch(() => null);
  if (!res) return fromPhoton(niche, names, lat, lon, radiusM);
  const data = (await res.json()) as {
    elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[];
  };
  const list: Raw[] = [];
  // Name matches must be a whole word ("Courtyard" is not a yard) and look like a business, not a park or hotel.
  const nameRe = names ? new RegExp("\\b(" + names + ")", "i") : null;
  const NOT_BUSINESS = ["leisure", "landuse", "natural", "tourism", "highway", "boundary", "place", "waterway", "historic", "building:part", "public_transport", "railway"];
  for (const e of data.elements ?? []) {
    const t = e.tags ?? {};
    const name = t.name?.trim();
    const la = e.lat ?? e.center?.lat;
    const lo = e.lon ?? e.center?.lon;
    if (!name || la == null || lo == null) continue;
    const tagMatch = (def?.tags ?? []).some(([k, v]) => t[k] === v);
    if (!tagMatch) {
      if (!nameRe?.test(name)) continue;
      if (NOT_BUSINESS.some((k) => t[k]) || t.amenity) continue;
      const looksLikeBusiness = t.shop || t.craft || t.office || t.company || t.phone || t["contact:phone"] || t.website || t["contact:website"];
      if (!looksLikeBusiness) continue;
    }
    const addr = [t["addr:housenumber"], t["addr:street"], t["addr:city"], t["addr:state"]].filter(Boolean).join(" ") || null;
    list.push({
      id: `osm-${e.type}-${e.id}`,
      name,
      address: addr,
      lat: la,
      lon: lo,
      website: t.website ?? t["contact:website"] ?? t.url ?? null,
      phone: t.phone ?? t["contact:phone"] ?? null,
      email: t.email ?? t["contact:email"] ?? null,
      facebook: t["contact:facebook"] ?? t.facebook ?? null,
      instagram: t["contact:instagram"] ?? t.instagram ?? null,
      linkedin: t["contact:linkedin"] ?? null,
      rating: null,
      reviews: null,
      mapsUrl: null,
      source: "OpenStreetMap",
    });
  }
  return { list, note: null };
}

/** Fallback when Overpass is down: Photon (OpenStreetMap search) inside the area's bounding box. Names + addresses only. */
async function fromPhoton(niche: string, names: string, lat: number, lon: number, radiusM: number): Promise<{ list: Raw[]; note: string | null }> {
  const dLat = radiusM / 110_570;
  const dLon = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  const bbox = [lon - dLon, lat - dLat, lon + dLon, lat + dLat].map((v) => v.toFixed(5)).join(",");
  const words = [...new Set([niche, ...names.split("|").filter((w) => w.length > 3).slice(0, 5)])];
  const nameRe = new RegExp("\\b(" + names + ")", "i");
  const seen = new Set<string>();
  const list: Raw[] = [];
  await Promise.all(
    words.map(async (w) => {
      const qs = new URLSearchParams({ q: w, bbox, limit: "50", lang: "en" });
      const r = await fetch(`https://photon.komoot.io/api/?${qs}`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15_000) }).catch(() => null);
      if (!r?.ok) return;
      const data = (await r.json()) as {
        features?: { geometry: { coordinates: [number, number] }; properties: Record<string, string | undefined> }[];
      };
      for (const ft of data.features ?? []) {
        const p = ft.properties;
        const id = `osm-${p.osm_type}-${p.osm_id}`;
        if (!p.name || seen.has(id)) continue;
        if (["leisure", "landuse", "natural", "tourism", "highway", "boundary", "place", "amenity", "building"].includes(p.osm_key ?? "")) continue;
        if (!nameRe.test(p.name) && !(p.osm_key === "craft" || p.osm_value === "garden_centre")) continue;
        seen.add(id);
        list.push({
          id,
          name: p.name,
          address: [p.housenumber, p.street, p.city, p.state].filter(Boolean).join(" ") || null,
          lat: ft.geometry.coordinates[1],
          lon: ft.geometry.coordinates[0],
          website: null,
          phone: null,
          email: null,
          facebook: null,
          instagram: null,
          linkedin: null,
          rating: null,
          reviews: null,
          mapsUrl: null,
          source: "OpenStreetMap",
        });
      }
    }),
  );
  return {
    list,
    note: "OpenStreetMap's main search was busy, so a quicker search was used — websites and phone numbers may be missing for some businesses.",
  };
}

async function fromGoogle(niche: string, lat: number, lon: number, radiusM: number): Promise<{ list: Raw[]; checked: boolean; note: string | null }> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { list: [], checked: false, note: "Add GOOGLE_PLACES_API_KEY to see which businesses are on Google." };
  const list: Raw[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 3; page++) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.googleMapsUri,nextPageToken",
      },
      body: JSON.stringify({
        textQuery: niche,
        pageSize: 20,
        locationBias: { circle: { center: { latitude: lat, longitude: lon }, radius: Math.min(radiusM, 50_000) } },
        ...(pageToken ? { pageToken } : {}),
      }),
    }).catch(() => null);
    if (!res?.ok) {
      return { list, checked: list.length > 0, note: `Google Places returned ${res?.status ?? "no answer"}${list.length ? " — showing what loaded" : ""}.` };
    }
    const data = (await res.json()) as {
      places?: {
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude: number; longitude: number };
        websiteUri?: string;
        nationalPhoneNumber?: string;
        rating?: number;
        userRatingCount?: number;
        googleMapsUri?: string;
      }[];
      nextPageToken?: string;
    };
    for (const p of data.places ?? []) {
      if (!p.location || !p.displayName?.text) continue;
      list.push({
        id: `g-${p.id}`,
        name: p.displayName.text,
        address: p.formattedAddress ?? null,
        lat: p.location.latitude,
        lon: p.location.longitude,
        website: p.websiteUri ?? null,
        phone: p.nationalPhoneNumber ?? null,
        email: null,
        facebook: null,
        instagram: null,
        linkedin: null,
        rating: p.rating ?? null,
        reviews: p.userRatingCount ?? null,
        mapsUrl: p.googleMapsUri ?? null,
        source: "Google",
      });
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return { list, checked: true, note: null };
}

export async function runAreaHunt(input: { area?: string; country?: string; niche?: string; radiusKm?: number }): Promise<AreaHuntResult> {
  const area = input.area?.trim() ?? "";
  const country = input.country?.trim() || "United States";
  const niche = input.niche?.trim() ?? "";
  const radiusKm = Math.min(50, Math.max(1, Number(input.radiusKm) || 5));
  if (!area) throw new AreaHuntError("Enter a city, area or ZIP code.");
  if (!niche) throw new AreaHuntError("Enter the kind of business, e.g. landscaper.");

  const center = await geocode(area, country);
  const radiusM = radiusKm * 1000;
  const [osm, google] = await Promise.all([fromOsm(niche, center.lat, center.lon, radiusM), fromGoogle(niche, center.lat, center.lon, radiusM)]);

  const merged: AreaBusiness[] = [];
  const add = (r: Raw, onGoogle: boolean | null) => {
    const d = km(center.lat, center.lon, r.lat, r.lon);
    if (d > radiusKm) return;
    const { source, ...rest } = r;
    merged.push({ ...rest, distanceKm: Math.round(d * 10) / 10, onGoogle, sources: [source] });
  };
  for (const g of google.list) {
    if (!merged.some((m) => m.id === g.id)) add(g, true);
  }
  for (const o of osm.list) {
    const match = merged.find((m) => m.sources.includes("Google") && sameBusiness(m, o));
    if (match) {
      if (!match.sources.includes("OpenStreetMap")) match.sources.push("OpenStreetMap");
      match.website ??= o.website;
      match.phone ??= o.phone;
      match.email ??= o.email;
      match.facebook ??= o.facebook;
      match.instagram ??= o.instagram;
      match.linkedin ??= o.linkedin;
      continue;
    }
    if (merged.some((m) => m.sources.includes("OpenStreetMap") && sameBusiness(m, o))) continue;
    add(o, google.checked ? false : null);
  }
  merged.sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    query: { area, country, niche, radiusKm },
    center,
    googleChecked: google.checked,
    googleNote: google.note,
    osmNote: osm.note,
    businesses: merged,
    counts: {
      total: merged.length,
      onGoogle: merged.filter((b) => b.onGoogle === true).length,
      notOnGoogle: merged.filter((b) => b.onGoogle === false).length,
      withWebsite: merged.filter((b) => b.website).length,
      withoutWebsite: merged.filter((b) => !b.website).length,
    },
  };
}
