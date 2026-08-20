import "dotenv/config";
import supabase from "../database/supabase.js";

import {
    searchOpenStreetMap
} from "../prospecting/providers/openStreetMapProvider.js";

import {
    processProspects
} from "../prospecting/prospectingAgent.js";

import {
    createCampaign,
    queueLeadsForCampaign
} from "./campaignService.js";

import {
    processOutreachJobs
} from "../outreach/outreachWorker.js";


export async function runCampaign({
    name,
    service,
    targetIndustry,
    targetCity,
    targetCountry,
    targetCount = 5,
    emailLimit = 0,
    whatsappLimit = 0,
    socialLimit = 0
}) {

    console.log("");
    console.log("🚀 Starting campaign...");
    console.log("────────────────────────");

    if (!name) {
        throw new Error("Campaign name is required");
    }

    if (!service) {
        throw new Error("Campaign service is required");
    }

    if (!targetCity) {
        throw new Error("Campaign targetCity is required");
    }


    // --------------------------------
    // 1. Create campaign
    // --------------------------------

    const campaign = await createCampaign({
        name,
        service,
        targetIndustry,
        targetCountry,
        targetCount
    });

    console.log(
        `📋 Campaign #${campaign.id} created.`
    );


    // --------------------------------
    // 2. Prospecting
    // --------------------------------

    console.log("");
    console.log("🔎 Starting prospecting...");
    console.log("────────────────────────");

    const prospects = await searchOpenStreetMap({
        city: targetCity,
        category: targetIndustry,
        limit: targetCount
    });

    console.log(
        `🗺️ Discovered ${prospects.length} prospects.`
    );


    // --------------------------------
    // 3. AI qualification + import
    // --------------------------------

    console.log("");
    console.log("🧠 Starting AI qualification...");
    console.log("────────────────────────");

    const importedProspects = await processProspects(
        prospects,
        service,
        campaign.id
    );

    const createdLeads = importedProspects.filter(
        result => result.created
    );

    console.log(
        `💾 ${createdLeads.length} new lead(s) created.`
    );


    // --------------------------------
    // 4. Create outreach jobs
    // --------------------------------

    console.log("");
    console.log("📨 Creating outreach jobs...");
    console.log("────────────────────────");

    const jobs = await queueLeadsForCampaign(
        campaign.id,
        {
            emailLimit,
            whatsappLimit,
            socialLimit
        }
    );

    console.log(
        `📨 ${jobs.length} outreach job(s) created.`
    );


    // --------------------------------
    // 5. Run outreach worker
    // --------------------------------

    console.log("");
    console.log("⚙️ Starting outreach worker...");
    console.log("────────────────────────");

    await processOutreachJobs();


    // --------------------------------
    // 6. Get campaign jobs
    // --------------------------------

    const jobIds = jobs
        .filter(result => result.job?.id)
        .map(result => result.job.id);

    let campaignJobs = [];

    if (jobIds.length > 0) {

        const {
            data,
            error
        } = await supabase
            .from("outreach_jobs")
            .select("*")
            .in("id", jobIds);

        if (error) {

            console.error(
                "❌ Failed loading campaign jobs:",
                error.message
            );

        } else {

            campaignJobs = data || [];

        }
    }


    // --------------------------------
    // 7. Finish
    // --------------------------------

    console.log("");
    console.log("🏁 Campaign finished.");
    console.log("────────────────────────");


    return {
        campaign,
        prospects,
        importedProspects,
        jobs,
        campaignJobs
    };
}

