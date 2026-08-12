import "dotenv/config";
import {
    importProspects
} from "./prospecting/prospectingService.js";
const prospects = [

    {
        name: "John Smith",
        companyName: "ABC Restaurant",
        email: "john@example.com",
        website: "https://abc-restaurant.com",
        instagram: "@abcrestaurant",
        industry: "Restaurant",
        country: "USA",
        source: "manual_test"
    },
    {
        name: "Sarah Wilson",
        companyName: "Wilson Cafe",
        email: "sarah@example.com",
        website: "https://wilsoncafe.com",
        instagram: "@wilsoncafe",
        industry: "Restaurant",
        country: "USA",
        source: "manual_test"
    },
    {
        name: "Mike Brown",
        companyName: "Brown Fitness",
        email: "mike@example.com",
        website: "https://brownfitness.com",
        instagram: "@brownfitness",
        industry: "Fitness",
        country: "USA",
        source: "manual_test"
    }
];
await importProspects(prospects);