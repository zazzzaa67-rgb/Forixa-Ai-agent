import {
    searchOpenStreetMap
} from "./providers/openStreetMapProvider.js";
import {
    enrichProspects
} from "./providers/contactEnrichmentProvider.js";

import {
    filterWebsiteProspects
} from "./prospectFilter.js";

const prospects = await searchOpenStreetMap({
    city: "Miami",
    category: "restaurant",
    limit: 10
});

const enriched = enrichProspects(prospects);

const eligible =
    filterWebsiteProspects(enriched);

console.log("\n🎯 ELIGIBLE PROSPECTS:\n");

for (const prospect of eligible) {
    console.log({
        name: prospect.name,
        email: prospect.email,
        instagram: prospect.instagram,
        phone: prospect.phone,
        channel: prospect.outreachChannel,
        reason: prospect.qualificationReason
    });
}