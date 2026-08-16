import supabase from "../database/supabase.js";
import cron from "node-cron";
import { sendEmail } from "../Email/emailService.js";

import {
    getLeadConversation,
    hasMessageBeenSent,
    cancelPendingFollowUps
} from "../agent/tools.js";

import { generateFollowUp } from "../agent/followUpGenerator.js";


const MAX_FOLLOW_UPS = 2;


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

        console.error(
            "❌ Follow-up Query Error:",
            error.message
        );

        return;
    }


    if (!followUps?.length) {

        console.log(
            "📭 No follow-ups are due."
        );

        return;
    }


    console.log(
        `📋 ${followUps.length} follow-up(s) found.`
    );


    for (const followUp of followUps) {

        const lead = followUp.leads;


        if (!lead) {

            console.error(
                `❌ Lead not found for follow-up #${followUp.id}`
            );

            await supabase
                .from("follow_ups")
                .update({
                    status: "failed"
                })
                .eq("id", followUp.id);

            continue;
        }


        // =========================================
        // STOP CONDITIONS
        // =========================================

        if (
            lead.status === "opted_out" ||
            lead.status === "not_interested"
        ) {

            await cancelPendingFollowUps(
                lead.id
            );

            console.log(
                `🚫 Follow-ups cancelled for lead #${lead.id}`
            );

            continue;
        }


        // =========================================
        // MAX FOLLOW-UP LIMIT
        // =========================================

        if (
            followUp.attempt_number >
            MAX_FOLLOW_UPS
        ) {

            await supabase
                .from("follow_ups")
                .update({
                    status: "cancelled"
                })
                .eq("id", followUp.id);

            console.log(
                `🛑 Maximum follow-ups reached for lead #${lead.id}`
            );

            continue;
        }


        console.log(
            `📨 Follow-up #${followUp.attempt_number} due for ${lead.email}`
        );


        // =========================================
        // LOCK JOB
        // =========================================

        const { error: processingError } =
            await supabase
                .from("follow_ups")
                .update({
                    status: "processing"
                })
                .eq("id", followUp.id)
                .eq("status", "scheduled");


        if (processingError) {

            console.error(
                "❌ Failed locking follow-up:",
                processingError.message
            );

            continue;
        }


        try {

            // =========================================
            // GET CONVERSATION
            // =========================================

            const conversation =
                await getLeadConversation(
                    lead.id,
                    "email"
                );


            // =========================================
            // GENERATE AI FOLLOW-UP
            // =========================================

            const message =
                await generateFollowUp(
                    lead,
                    conversation
                );


            if (!message) {

                throw new Error(
                    "AI generated an empty follow-up"
                );
            }


            // =========================================
            // DUPLICATE CHECK
            // =========================================

            const duplicate =
                await hasMessageBeenSent(
                    lead.id,
                    message
                );


            if (duplicate) {
                console.log(
                    `⚠️ Duplicate follow-up detected for lead #${lead.id}`
                );
                await supabase
                    .from("follow_ups")
                    .update({
                        status: "failed"
                    })
                    .eq("id", followUp.id);
                continue;
            }
            console.log("");
            console.log("🤖 Generated follow-up:");
            console.log(message);
            console.log("");
            // =========================================
            // SEND EMAIL
            // =========================================
            const emailResult =
                await sendEmail({
                    to: lead.email,
                    subject:
                        "A quick follow-up from FORIXA",
                    text: message
                });
            console.log(
                `📧 Follow-up #${followUp.attempt_number} sent to ${lead.email}`
            );
            // =========================================
            // SAVE CONVERSATION
            // =========================================
            const {
                error: conversationError
            } = await supabase
                .from("agent_conversations")
                .insert({
                    lead_id: lead.id,
                    channel: "email",
                    role: "assistant",
                    content: message
                });
            if (conversationError) {
                console.error(
                    "⚠️ Failed saving follow-up conversation:",
                    conversationError.message
                );
            }
            // =========================================
            // MARK CURRENT FOLLOW-UP SENT
            // =========================================
            await supabase
                .from("follow_ups")
                .update({
                    status: "sent",
                    sent_at:
                        new Date().toISOString(),
                    message_id:
                        emailResult.id
                })
                .eq(
                    "id",
                    followUp.id
                );
            // =========================================
            // SCHEDULE NEXT FOLLOW-UP
            // =========================================
            if (
                followUp.attempt_number <
                MAX_FOLLOW_UPS
            ) {
                const nextAttempt =
                    followUp.attempt_number + 1;
                // Next follow-up after 48 hours
                const nextDate =
                    new Date(
                        Date.now() +
                        48 * 60 * 60 * 1000
                    );
                await supabase
                    .from("follow_ups")
                    .insert({
                        lead_id:
                            lead.id,
                        scheduled_at:
                            nextDate.toISOString(),
                        attempt_number:
                            nextAttempt,
                        status:
                            "scheduled"
                    });
                console.log(
                    `📅 Follow-up #${nextAttempt} scheduled for lead #${lead.id}`
                );
            } else {
                console.log(
                    `🏁 Follow-up sequence completed for lead #${lead.id}`
                );
            }
        } catch (error) {
            console.error(
                `❌ Follow-up failed for ${lead.email}:`,
                error.message
            );
            await supabase
                .from("follow_ups")
                .update({
                    status: "failed"
                })
                .eq(
                    "id",
                    followUp.id
                );
        }
    }
}

// =========================================
// CRON
// =========================================
cron.schedule(
    "* * * * *",
    async () => {
        await processFollowUps();
    }
);