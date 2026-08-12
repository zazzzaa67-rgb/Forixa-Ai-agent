import "dotenv/config";
export async function searchGoogleMaps({
    city,
    country,
    industry,
    limit = 20
}) {
    if (!city || !country || !industry) {
        throw new Error(
            "city, country and industry are required"
        );
    }
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error(
            "GOOGLE_MAPS_API_KEY is missing"
        );
    }

    const query = `${industry} in ${city}, ${country}`;

    const url =
        "https://maps.googleapis.com/maps/api/place/textsearch/json?" +
        new URLSearchParams({
            query,
            key: apiKey
        });

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Google Maps API error: ${response.status}`
        );
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(
            `Google Maps API error: ${data.status}`
        );
    }
    const places = data.results || [];
    return places
        .slice(0, limit)
        .map(place => ({
            name: place.name || null,

            company: place.name || null,

            address:
                place.formatted_address || null,

            place_id:
                place.place_id || null,

            rating:
                place.rating || null,

            source: "google_maps",

            city,
            country,
            industry,

            email: null,
            website: null
        }));
}