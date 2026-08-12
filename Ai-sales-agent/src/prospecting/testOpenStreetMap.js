import { searchOpenStreetMap } from "./providers/openStreetMapProvider.js";

const prospects = await searchOpenStreetMap({
    city: "Miami",
    category: "restaurant",
    limit: 10
});

console.log("\n📋 PROSPECTS:\n");

for (const [index, prospect] of prospects.entries()) {
    console.log(`${index + 1}. ${prospect.name}`);
    console.log(`   📧 Email: ${prospect.email || "None"}`);
    console.log(`   🌐 Website: ${prospect.website || "None"}`);
    console.log(`   📞 Phone: ${prospect.phone || "None"}`);
    console.log(`   📱 Instagram: ${prospect.instagram || "None"}`);
    console.log(`   📍 Address: ${prospect.address || "None"}`);
    console.log(`   🔎 Source: ${prospect.source}`);
    console.log("");
}