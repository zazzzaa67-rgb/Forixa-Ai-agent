import "dotenv/config";

import {
    processProspects
} from "./prospecting/prospectingAgent.js";


const prospects = [

    {
        name: "Sarah Wilson",
        companyName: "Wilson Cafe",
        email: "sarah@example.com",
        website: "https://wilsoncafe.com",
        instagram: "@wilsoncafe",
        industry: "Restaurant",
        country: "USA"
    },

    {
        name: "Mike Brown",
        companyName: "Brown Fitness",
        email: "mike@example.com",
        website: "https://brownfitness.com",
        instagram: "@brownfitness",
        industry: "Fitness",
        country: "USA"
    }

];


const result = await processProspects(
    prospects,
    "website"
);


console.log(
    "🏁 Final result:",
    result
);