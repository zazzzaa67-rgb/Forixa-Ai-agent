import { prospectFromGoogleMaps } from "./prospecting/googleMapsProspector.js";

const prospects =
    await prospectFromGoogleMaps({
        city: "Miami",
        country: "USA",
        industry: "restaurants",
        limit: 10
    });

console.log("\n📊 RESULTS:\n");

console.dir(
    prospects,
    {
        depth: null
    }
);