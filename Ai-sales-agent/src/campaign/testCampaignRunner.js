import "dotenv/config";
import { runCampaign } from "./campaignRunner.js";

const result = await runCampaign({
    name: "FORIXA WhatsApp Pilot",
    service: "Website",
    targetIndustry: "Restaurants",
    targetCountry: "United States",

    targetCount: 1,
    emailLimit: 0,
    whatsappLimit: 1,
    socialLimit: 0
});

console.log("");

console.log("📊 FINAL RESULT");
console.log("================");

console.log({
    campaignId: result.campaign.id,
    jobsProcessed: result.jobs.length,
    createdJobs: result.jobs.filter(
        job => job.created
    ).length,
    skippedJobs: result.jobs.filter(
        job => job.duplicate
    ).length,
    sentJobs: result.campaignJobs.filter(
        job => job.status === "sent"
    ).length,
    failedJobs: result.campaignJobs.filter(
        job => job.status === "failed"
    ).length
});