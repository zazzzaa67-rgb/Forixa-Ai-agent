import "dotenv/config";
import supabase from "../database/supabase.js";

import {
    createCampaign,
    queueLeadsForCampaign
} from "./campaignService.js";

import { processOutreachJobs } from "../outreach/outreachWorker.js";


export async function runCampaign({
    name,
    service,
    targetIndustry,
    targetCountry,
    targetCount = 5,
    emailLimit = 0,
    whatsappLimit = 0,
    socialLimit = 0
}) {

    console.log("");
    console.log("🚀 Starting campaign...");
    console.log("────────────────────────");


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
    // 2. Create outreach jobs
    // --------------------------------

    const jobs = await queueLeadsForCampaign(
        campaign.id,
        {
            emailLimit,
            whatsappLimit,
            socialLimit
            
        }
    );

    console.log(
        `📨 ${jobs.length} outreach job(s) processed.`
    );


    // --------------------------------
    // 3. Run outreach worker
    // --------------------------------

    console.log("");
    console.log("⚙️ Starting outreach worker...");

    await processOutreachJobs();


    // --------------------------------
    // 4. Get campaign jobs
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
    // 5. Finish
    // --------------------------------

    console.log("");
    console.log("🏁 Campaign finished.");
    console.log("────────────────────────");


    return {
        campaign,
        jobs,
        campaignJobs
    };
}