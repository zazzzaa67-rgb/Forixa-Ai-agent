const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/**
 * Search businesses from OpenStreetMap through Overpass.
 *
 * IMPORTANT:
 * This is intentionally limited to small batches while testing.
 */
export async function searchOpenStreetMap({
    city,
    category,
    limit = 20
}) {
    if (!city) {
        throw new Error("city is required");
    }

    if (!category) {
        throw new Error("category is required");
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

    const query = `
[out:json][timeout:25];

area
  ["name"="${escapeOverpassValue(city)}"]
  ->.searchArea;

(
  node
    ["amenity"="${escapeOverpassValue(category)}"]
    (area.searchArea);

  way
    ["amenity"="${escapeOverpassValue(category)}"]
    (area.searchArea);

  relation
    ["amenity"="${escapeOverpassValue(category)}"]
    (area.searchArea);
);

out center tags;
`;

    const response = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "FORIXA-AI-Sales-Agent/1.0"
        },
        body: new URLSearchParams({
            data: query
        })
    });

    if (!response.ok) {
        throw new Error(
            `OpenStreetMap request failed: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();

    const elements = data.elements || [];

    const prospects = elements
        .slice(0, safeLimit)
        .map(normalizePlace)
        .filter(Boolean);

    console.log(
        `🗺️ OpenStreetMap returned ${prospects.length} prospects`
    );

    return prospects;
}

/**
 * Convert OSM objects into our internal prospect format.
 */
function normalizePlace(place) {
    const tags = place.tags || {};

    const name = tags.name?.trim();

    if (!name) {
        return null;
    }

    const website =
        tags.website ||
        tags["contact:website"] ||
        null;

    const email =
        tags.email ||
        tags["contact:email"] ||
        null;

    const phone =
        tags.phone ||
        tags["contact:phone"] ||
        null;

    const latitude =
        place.lat ??
        place.center?.lat ??
        null;

    const longitude =
        place.lon ??
        place.center?.lon ??
        null;

    return {
        name,

        email,

        phone,

        website,

        instagram:
            tags["contact:instagram"] ||
            tags.instagram ||
            null,

        facebook:
            tags["contact:facebook"] ||
            tags.facebook ||
            null,

        address:
            tags["addr:street"]
                ? `${tags["addr:housenumber"] || ""} ${tags["addr:street"]}`.trim()
                : null,

        city:
            tags["addr:city"] ||
            null,

        country:
            tags["addr:country"] ||
            null,

        latitude,

        longitude,

        industry:
            tags.amenity ||
            null,

        source: "openstreetmap"
    };
}

function escapeOverpassValue(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}