import {
    searchOpenStreetMap
} from "./providers/openStreetMapProvider.js";
import {
    enrichProspects
} from "./providers/contactEnrichmentProvider.js";

const prospects = await searchOpenStreetMap({
    city: "Miami",
    category: "restaurant",
    limit: 10
});

const enriched = enrichProspects(prospects);
console.log("\n📋 ENRICHED PROSPECTS:\n");
for (const prospect of enriched) {
    console.log({
        name: prospect.name,
        email: prospect.email,
        instagram: prospect.instagram,
        phone: prospect.phone,
        website: prospect.website,
        contactChannel: prospect.contactChannel,
        contactable: prospect.contactable
    });
}