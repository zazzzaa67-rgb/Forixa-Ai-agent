import supabase from "../database/supabase.js";
import { createOutreachJob } from "../outreach/outreachJobService.js";
export async function createCampaign({
    name,
    service,
    targetIndustry,
    targetCountry,
    targetCount
}) {

    const { data, error } = await supabase
        .from("campaigns")
        .insert({
            name,
            service,
            target_industry: targetIndustry || null,
            target_country: targetCountry || null,
            target_count: targetCount || 0,
            status: "draft"
        })
        .select()
        .single();

    if (error) {
        console.error("❌ Create campaign error:", error);
        throw error;
    }

    console.log("✅ Campaign created:", data.id);

    return data;
}


/**
 * Add leads to outreach jobs.
 *
 * IMPORTANT:
 * This function DOES NOT send anything.
 * It only creates outreach jobs.
 */
export async function queueLeadsForCampaign(
    campaignId,
    {
        emailLimit = 0,
        whatsappLimit = 0,
        socialLimit = 0
    } = {}
) {
    if (!campaignId) {
        throw new Error("campaignId is required");
    }

    const limits = {
        email: Math.max(Number(emailLimit) || 0, 0),
        whatsapp: Math.max(Number(whatsappLimit) || 0, 0),
        instagram: Math.max(Number(socialLimit) || 0, 0)
    };

    // --------------------------------
    // 1. Get campaign
    // --------------------------------

    const {
        data: campaign,
        error: campaignError
    } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

    if (campaignError || !campaign) {
        throw new Error("Campaign not found");
    }

    const targetJobs = Object.values(limits)
        .reduce((total, limit) => total + limit, 0);

    if (targetJobs <= 0) {
        throw new Error("At least one outreach limit is required");
    }

    // --------------------------------
    // 2. Get eligible leads
    // --------------------------------

    const {
        data: leads,
        error: leadsError
    } = await supabase
        .from("leads")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("status", "new")
        .order("created_at", {
            ascending: true
        })
        .limit(100);

    if (leadsError) {
        console.error(
            "❌ Lead query error:",
            leadsError
        );

        throw leadsError;
    }

    if (!leads?.length) {
        console.log("📭 No eligible leads found.");
        return [];
    }

    console.log(`📋 Found ${leads.length} eligible lead(s).`);

    // --------------------------------
    // 3. Create outreach jobs
    // --------------------------------

    const results = [];

    const counts = {
        email: 0,
        whatsapp: 0,
        instagram: 0
    };

    for (const lead of leads) {

        if (
            results.filter(r => r.created).length >= targetJobs
        ) {
            break;
        }

        if (lead.status === "opted_out") {
            continue;
        }

        // ================================
        // EMAIL
        // ================================

        const channel = lead.email && counts.email < limits.email
            ? "email"
            : lead.whatsapp === true && lead.phone && counts.whatsapp < limits.whatsapp
                ? "whatsapp"
                : lead.instagram && counts.instagram < limits.instagram
                    ? "instagram"
                    : null;

        if (!channel) {
            continue;
        }

        const target = channel === "email"
            ? lead.email
            : channel === "whatsapp"
                ? lead.phone
                : lead.instagram;

        {
            const result = await createOutreachJob({
                lead_id: lead.id,
                channel,
                target,
                service: campaign.service,
                message: null,
                scheduled_at: null
            });

            results.push(result);

            if (result.created) {
                counts[channel]++;
            }
        }
    }
    // --------------------------------
    // 4. Summary
    // --------------------------------
    console.log("");
    console.log("📊 Campaign queue summary");
    console.log("────────────────────────");
    console.log(`📨 Jobs: ${results.length}`);
    console.log(`📧 Email: ${counts.email}`);
    console.log(`📱 WhatsApp: ${counts.whatsapp}`);
    console.log(`📸 Instagram: ${counts.instagram}`);
    return results;
}