import { searchGoogleMaps } from "./googleMapsProvider.js";
import { getGooglePlaceDetails } from "./googleMapsDetailsProvider.js";

export async function prospectFromGoogleMaps({
    city,
    country,
    industry,
    limit = 20
}) {
    console.log(
        `🔎 Searching Google Maps: ${industry} in ${city}, ${country}`
    );

    const places = await searchGoogleMaps({
        city,
        country,
        industry,
        limit
    });

    console.log(
        `📍 Found ${places.length} businesses`
    );
    const prospects = [];
    for (const place of places) {
        try {
            if (!place.place_id) {
                continue;
            }
            const details =
                await getGooglePlaceDetails(
                    place.place_id
                );
            prospects.push({
                name: details.name || place.name,
                company:
                    details.name || place.company,
                email: null,
                phone: details.phone,
                website: details.website,
                address: details.address || place.address,
                google_maps_url:
                    details.google_maps_url,
                source: "google_maps",
                city,
                country,
                industry,
                has_website:
                    Boolean(details.website)
            });
        } catch (error) {
            console.error(
                `❌ Failed details for ${place.name}:`,
                error.message
            );
        }
    }
    const withoutWebsite =
        prospects.filter(
            p => !p.has_website
        );
    const withWebsite =
        prospects.filter(
            p => p.has_website
        );
    console.log(
        `🌐 Without website: ${withoutWebsite.length}`
    );
    console.log(
        `🌐 With website: ${withWebsite.length}`
    );
    return prospects;
}