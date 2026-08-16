import { getContactableProspects } from "./outreachRouter.js";
import { generateOutreachMessage } from "../agent/outreachAgent.js";

/**
 * Create personalized outreach jobs from qualified prospects.
 *
 * IMPORTANT:
 * This function DOES NOT send messages.
 * It only creates jobs for the sending layer.
 */
export async function createOutreachJobs(prospects = []) {

    const contactable =
        getContactableProspects(prospects);

    const jobs = [];

    for (const prospect of contactable) {

        try {

            console.log("");
            console.log("🤖 Generating AI outreach...");
            console.log(
                `👤 ${prospect.name || "Unknown"}`
            );
            console.log(
                `🏢 ${prospect.company_name || "Unknown company"}`
            );
            const aiResult =
                await generateOutreachMessage(prospect);
            const outreach =
                prospect.outreach;
            jobs.push({
                prospectId:
                    prospect.id ?? null,
                lead_id:
                    prospect.id ?? null,
                name:
                    prospect.name,
                company:
                    prospect.company_name ??
                    prospect.name,
                service:
                    aiResult.service,
                message:
                    aiResult.message,
                channel:
                    outreach.channel,
                target:
                    outreach.target,
                status:
                    "queued",
                attempts:
                    0,
                createdAt:
                    new Date().toISOString()
            });
            console.log(
                `🎯 Service: ${aiResult.service}`
            );
            console.log(
                `💬 Message: ${aiResult.message}`
            );
        } catch (error) {
            console.error(
                `❌ Failed generating outreach for ${
                    prospect.name || prospect.id
                }:`,
                error.message
            );
        }
    }
    console.log(
        `\n📋 Created ${jobs.length} personalized outreach job(s).`
    );
    return jobs;
}