import supabase from "../database/supabase.js";

const ALLOWED_STATUSES = [
    "new",
    "contacted",
    "replied",
    "interested",
    "qualified",
    "hot",
    "not_interested",
    "opted_out"
];

export async function updateLeadStatus(leadId, status) {

    if (!ALLOWED_STATUSES.includes(status)) {
        throw new Error(`Invalid lead status: ${status}`);
    }

    const { data, error } = await supabase
        .from("leads")
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq("id", leadId)
        .select()
        .single();

    if (error) {
        console.error("Update Lead Error:", error);
        throw new Error("Failed to update lead status");
    }

    return data;
}


export async function getLead(leadId) {

    const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

    if (error) {
        console.error("Get Lead Error:", error);
        throw new Error("Failed to get lead");
    }

    return data;
}


export async function getPricing() {

    const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true);

    if (error) {
        console.error("Pricing Error:", error);
        throw new Error("Failed to get pricing");
    }

    return data;
}


export async function getServiceInfo(serviceName) {

    const { data, error } = await supabase
        .from("services")
        .select("*")
        .ilike("name", serviceName)
        .eq("active", true)
        .maybeSingle();

    if (error) {
        console.error("Service Info Error:", error);
        throw new Error("Failed to get service information");
    }

    return data;
}


// Schedule a follow-up
export async function scheduleFollowUp(
    leadId,
    scheduledAt,
    attemptNumber = 1
) {

    const scheduledDate = new Date(scheduledAt);

    if (Number.isNaN(scheduledDate.getTime())) {
        throw new Error("Invalid scheduled date");
    }

    const lead = await getLead(leadId);

    if (lead.status === "opted_out") {
        return {
            success: false,
            message: "Lead has opted out. Follow-up was not scheduled."
        };
    }

    const { data, error } = await supabase
        .from("follow_ups")
        .insert({
            lead_id: leadId,
            scheduled_at: scheduledDate.toISOString(),
            attempt_number: attemptNumber,
            status: "scheduled"
        })
        .select()
        .single();

    if (error) {
        console.error("Schedule Follow-up Error:", error);

        throw new Error("Failed to schedule follow-up");
    }

    return {
        success: true,
        followUp: data
    };
}

// For now, this records that the owner should be notified.
// Later we'll connect it to an actual notification channel.
export async function notifyOwner(leadId, reason) {

    const lead = await getLead(leadId);

    console.log("🔥 HOT LEAD / OWNER NOTIFICATION");
    console.log({
        leadId,
        name: lead.name,
        company: lead.company_name,
        email: lead.email,
        reason
    });

    return {
        success: true,
        message: "Owner notification recorded",
        leadId,
        reason
    };
}
export async function cancelPendingFollowUps(leadId) {

    const { data, error } = await supabase
        .from("follow_ups")
        .update({
            status: "cancelled"
        })
        .eq("lead_id", leadId)
        .eq("status", "scheduled")
        .select();
    if (error) {
        console.error("Cancel Follow-ups Error:", error);
        throw new Error("Failed to cancel follow-ups");
    }
    return {
        success: true,
        cancelled: data.length
    };
}
export async function recordLeadReply(leadId) {
    const { data, error } = await supabase
        .from("leads")
        .update({
            last_replied_at: new Date().toISOString()
        })
        .eq("id", leadId)
        .select()
        .single();
    if (error) {
        console.error("Record Reply Error:", error);
        throw new Error("Failed to record lead reply");
    }
    return data;
}
export async function getLeadConversation(leadId, channel = "email") {
    const { data, error } = await supabase
        .from("agent_conversations")
        .select("role, content, created_at")
        .eq("lead_id", leadId)
        .eq("channel", channel)
        .order("created_at", {
            ascending: true
        });
    if (error) {
        console.error("Conversation Error:", error);
        throw new Error("Failed to get lead conversation");
    }
    return data;
}
export async function hasMessageBeenSent(
    leadId,
    message
) {

    const { data, error } = await supabase
        .from("agent_conversations")
        .select("id")
        .eq("lead_id", leadId)
        .eq("role", "assistant")
        .eq("content", message)
        .limit(1);
    if (error) {
        console.error("Duplicate Check Error:", error);
        throw new Error("Failed to check duplicate message");
    }
    return data.length > 0;
}