import "dotenv/config";
export async function getGooglePlaceDetails(placeId) {
    if (!placeId) {
        throw new Error("placeId is required");
    }
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_MAPS_API_KEY is missing");
    }
    const url =
        "https://maps.googleapis.com/maps/api/place/details/json?" +
        new URLSearchParams({
            place_id: placeId,
            fields: [
                "name",
                "formatted_address",
                "formatted_phone_number",
                "website",
                "business_status",
                "url"
            ].join(","),
            key: apiKey
        });
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `Google Place Details error: ${response.status}`
        );
    }
    const data = await response.json();
    if (data.status !== "OK") {
        throw new Error(
            `Google Place Details error: ${data.status}`
        );
    }
    const place = data.result;
    return {
        name: place.name || null,
        address:
            place.formatted_address || null,
        phone:
            place.formatted_phone_number || null,
        website:
            place.website || null,
        business_status:
            place.business_status || null,
        google_maps_url:
            place.url || null
    };
}