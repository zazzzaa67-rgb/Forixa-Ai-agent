import supabase from "../database/supabase.js";
import cron from "node-cron";
import { sendEmail } from "../Email/emailService.js";
import {
    getLead,
    getLeadConversation,
    hasMessageBeenSent
} from "../agent/tools.js";

import { generateFollowUp } from "../agent/followUpGenerator.js";
export async function processFollowUps() {
    console.log("🔍 Checking follow-ups...");
    const now = new Date().toISOString();
    const { data: followUps, error } = await supabase
        .from("follow_ups")
        .select(`
            *,
            leads (
                id,
                name,
                company_name,
                email,
                status
            )
        `)
        .eq("status", "scheduled")
        .lte("scheduled_at", now)
        .limit(50);
    if (error) {
        console.error("Follow-up Query Error:", error);
        return;
    }
    if (!followUps.length) {
        console.log("No follow-ups are due.");
        return;
    }
    console.log(`📋 ${followUps.length} follow-up(s) found.`);
    for (const followUp of followUps) {
        const lead = followUp.leads;
        // Customer opted out
        if (lead.status === "opted_out") {
            await supabase
                .from("follow_ups")
                .update({
                    status: "cancelled"
                })
                .eq("id", followUp.id);
            console.log(
                `🚫 Follow-up ${followUp.id} cancelled.`
            );
            continue;
        }
        console.log(
            `📨 Follow-up due for ${lead.email}`
        );

        await supabase
            .from("follow_ups")
            .update({
                status: "processing"
            })
            .eq("id", followUp.id);

        try {

            const conversation = await getLeadConversation(
                lead.id,
                "email"
            );

            const message = await generateFollowUp(
                lead,
                conversation
            );

            const duplicate = await hasMessageBeenSent(
                lead.id,
                message
            );

            if (duplicate) {

                console.log(
                    `⚠️ Duplicate follow-up detected for lead ${lead.id}`
                );

                await supabase
                    .from("follow_ups")
                    .update({
                        status: "failed"
                    })
                    .eq("id", followUp.id);

                continue;
            }

            await supabase
                .from("follow_ups")
                .update({
                    message
                })
                .eq("id", followUp.id);

            console.log("🤖 Generated follow-up:");
            console.log(message);
            const emailResult = await sendEmail({
            to: lead.email,
            subject: "A quick follow-up from FORIXA",
            text: message
        });

        console.log(`📧 Follow-up email sent to ${lead.email}`);
        await supabase
        .from("agent_conversations")
        .insert({
            lead_id: lead.id,
            channel: "email",
            role: "assistant",
            content: message
        });

        await supabase
            .from("follow_ups")
            .update({
                status: "sent",
                sent_at: new Date().toISOString(),
                message_id: emailResult.id
            })
    .eq("id", followUp.id);

        } catch (error) {

            console.error(
                `❌ Follow-up generation failed for ${lead.email}`,
                error
            );

            await supabase
                .from("follow_ups")
                .update({
                    status: "failed"
                })
                .eq("id", followUp.id);
        }
    }
}
cron.schedule("* * * * *", async () => {
    await processFollowUps();
});