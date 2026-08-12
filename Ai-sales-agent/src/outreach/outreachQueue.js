import { getContactableProspects } from "./outreachRouter.js";

/**
 * Create outreach jobs from qualified prospects.
 *
 * IMPORTANT:
 * This function DOES NOT send messages.
 * It only creates jobs for the sending layer.
 */

export function createOutreachJobs(prospects = [], service) {
    const contactable = getContactableProspects(prospects);
    const jobs = [];
    for (const prospect of contactable) {
        const outreach = prospect.outreach;
        jobs.push({
            prospectId: prospect.id ?? null,
            name: prospect.name,
            company: prospect.company_name ?? prospect.name,
            service,
            channel: outreach.channel,
            target: outreach.target,
            status: "queued",
            attempts: 0,
            createdAt: new Date().toISOString()
        });
    }
    console.log(
        `📋 Created ${jobs.length} outreach job(s).`
    );
    return jobs;
}