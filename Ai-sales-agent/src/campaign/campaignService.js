import supabase from "../database/supabase.js";

/**
 * Create a new outreach campaign
 */
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
 * Add leads to the outreach queue
 *
 * This function DOES NOT send anything.
 * It only prepares the queue.
 */
export async function queueLeadsForCampaign(
    campaignId,
    {
        emailLimit = 0,
        socialLimit = 0
    } = {}
) {

    // Get campaign
    const { data: campaign, error: campaignError } =
        await supabase
            .from("campaigns")
            .select("*")
            .eq("id", campaignId)
            .single();

    if (campaignError || !campaign) {
        throw new Error("Campaign not found");
    }


    // Get eligible leads
    const { data: leads, error: leadsError } =
        await supabase
            .from("leads")
            .select("*")
            .not("status", "eq", "opted_out")
            .limit(campaign.target_count);
    if (leadsError) {
        console.error("❌ Lead query error:", leadsError);
        throw leadsError;
    }
    if (!leads?.length) {
        console.log("📭 No eligible leads found.");
        return [];
    }
    const queue = [];
    let emailCount = 0;
    let socialCount = 0;
    for (const lead of leads) {
        if (lead.status === "opted_out") {
            continue;
        }
        if (
            lead.email &&
            emailCount < emailLimit
        ) {
            queue.push({
                campaign_id: campaignId,
                lead_id: lead.id,
                channel: "email",
                status: "pending"
            });
            emailCount++;
            continue;
        }
        // Then social
        if (
            socialCount < socialLimit
        ) {
            queue.push({
                campaign_id: campaignId,
                lead_id: lead.id,
                channel: "social",
                status: "pending"
            });
            socialCount++;
        }
    }
    if (!queue.length) {
        console.log("📭 Nothing to queue.");
        return [];
    }
    const { data, error } = await supabase
        .from("outreach_queue")
        .insert(queue)
        .select();
    if (error) {
        console.error("❌ Queue insertion error:", error);
        throw error;
    }
    console.log(
        `📋 ${data.length} outreach jobs queued.`
    );
    console.log(
        `📧 Email: ${emailCount}`
    );
    console.log(
        `📱 Social: ${socialCount}`
    );
    return data;
}