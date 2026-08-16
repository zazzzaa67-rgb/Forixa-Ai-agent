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


    // --------------------------------
    // 2. Get eligible leads
    // --------------------------------

    const {
        data: leads,
        error: leadsError
    } = await supabase
    .from("leads")
    .select("*")
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
    console.log("📋 WhatsApp eligibility:");

    for (const lead of leads) {
        console.log({
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            whatsapp: lead.whatsapp,
            status: lead.status
        });
    }


    if (!leads?.length) {
        console.log(
            "📭 No eligible leads found."
        );

        return [];
    }

    if (!leads?.length) {
        console.log(
            "📭 No eligible leads found."
        );

        return [];
    }


    // --------------------------------
    // 3. Create outreach jobs
    // --------------------------------

    const results = [];

    let emailCount = 0;
    let whatsappCount = 0;
    let socialCount = 0;

    const targetJobs =
        emailLimit +
        whatsappLimit +
        socialLimit;


    for (const lead of leads) {

        // Stop when we have enough jobs
        if (
            results.filter(
                r => r.created
            ).length >= targetJobs
        ) {
            break;
        }


        if (lead.status === "opted_out") {
            continue;
        }


        // ================================
        // EMAIL
        // ================================

        if (
            lead.email &&
            emailCount < emailLimit
        ) {

            const result =
                await createOutreachJob({
                    lead_id: lead.id,
                    channel: "email",
                    target: lead.email,
                    service: campaign.service,
                    message: null,
                    scheduled_at: null
                });

            results.push(result);

            if (result.created) {
                emailCount++;
            }

            continue;
        }


        // ================================
        // WHATSAPP
        // ================================

        if (
            lead.phone &&
            lead.status === "new" &&
            whatsappCount < whatsappLimit
        ) {

            const result =
                await createOutreachJob({
                    lead_id: lead.id,
                    channel: "whatsapp",
                    target: lead.phone,
                    service: campaign.service,
                    message: null,
                    scheduled_at: null
                });

            results.push(result);

            if (result.created) {
                whatsappCount++;
            }

            continue;
        }


        // ================================
        // INSTAGRAM
        // ================================

        if (
            lead.instagram &&
            socialCount < socialLimit
        ) {

            const result =
                await createOutreachJob({
                    lead_id: lead.id,
                    channel: "instagram",
                    target: lead.instagram,
                    service: campaign.service,
                    message: null,
                    scheduled_at: null
                });

            results.push(result);

            if (result.created) {
                socialCount++;
            }
        }
    }


    // --------------------------------
    // 4. Summary
    // --------------------------------

    console.log("");

    console.log(
        `📋 Outreach jobs processed: ${results.length}`
    );

    console.log(
        `📧 Email jobs: ${emailCount}`
    );

    console.log(
        `📱 WhatsApp jobs: ${whatsappCount}`
    );

    console.log(
        `📸 Instagram jobs: ${socialCount}`
    );

    return results;
}