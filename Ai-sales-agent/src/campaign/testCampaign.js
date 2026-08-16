import "dotenv/config";

import {
    createCampaign,
    queueLeadsForCampaign
} from "./campaignService.js";

const campaign = await createCampaign({
    name: "Real Website Outreach Test",
    service: "Website",
    targetIndustry: "Restaurants",
    targetCountry: "United States",
    targetCount: 5
});

console.log("Campaign:", campaign);

const jobs = await queueLeadsForCampaign(
    campaign.id,
    {
        emailLimit: 5,
        socialLimit: 0
    }
);

console.log("\nCreated jobs:");
console.dir(jobs, { depth: null });