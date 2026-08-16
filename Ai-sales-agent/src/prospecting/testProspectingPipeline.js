import "dotenv/config";

import {
    searchOpenStreetMap
} from "./providers/openStreetMapProvider.js";

import {
    processProspects
} from "./prospectingAgent.js";

const prospects =
    await searchOpenStreetMap({
        city: "Miami",
        category: "restaurant",
        limit: 20
    });

console.log(
    `\n🔎 Found ${prospects.length} prospects`
);

const results =
    await processProspects(
        prospects,
        "Website"
    );

console.log("\n📊 FINAL PROSPECTING RESULT");
console.log("============================");

console.log({
    total: prospects.length,
    created: results.filter(
        result => result.created
    ).length,
    duplicates: results.filter(
        result => result.duplicate
    ).length,
    failed: results.filter(
        result => result.error
    ).length
});