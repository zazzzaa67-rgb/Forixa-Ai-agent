import {
    createOutreachJobs
} from "./outreachJobService.js";

const jobs = [
    {
        lead_id: 1,
        channel: "email",
        target: "test-owner@example.com",
        service: "website",
        message:
            "Hi, I noticed your business could benefit from a modern website."
    },

    {
        lead_id: 2,
        channel: "instagram",
        target:
            "https://instagram.com/testrestaurant",
        service: "website",
        message:
            "Hi! We help businesses build modern websites."
    }
];

const results =
    await createOutreachJobs(jobs);

console.log("\n🏁 RESULTS:");
console.dir(results, {
    depth: null
});