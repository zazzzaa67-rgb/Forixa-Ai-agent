import { createOutreachJobs } from "./outreachQueue.js";

const prospects = [
    {
        id: 1,
        name: "Restaurant A",
        email: "hello@restaurant-a.com",
        phone: "+123456789"
    },

    {
        id: 2,
        name: "Restaurant B",
        instagram: "https://instagram.com/restaurantb"
    },

    {
        id: 3,
        name: "Restaurant C",
        phone: "+123456789",
        whatsapp: true
    },

    {
        id: 4,
        name: "Restaurant D",
        phone: "+123456789"
    },

    {
        id: 5,
        name: "Restaurant E"
    }
];

const jobs = createOutreachJobs(
    prospects,
    "website"
);

console.log("\n📨 OUTREACH JOBS:\n");

console.dir(jobs, {
    depth: null
});