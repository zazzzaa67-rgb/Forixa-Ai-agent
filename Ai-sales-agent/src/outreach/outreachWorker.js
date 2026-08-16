import "dotenv/config";
import supabase from "../database/supabase.js";
import { dispatchOutreachJob } from "../campaign/outreachDispatcher.js";

const DAILY_LIMIT = 20;

// TEST MODE
const TEST_MODE =
    process.env.OUTREACH_TEST_MODE === "true";

async function getTodaySentCount() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
        .from("outreach_jobs")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("status", "sent")
        .gte("sent_at", startOfDay.toISOString());

    if (error) {
        throw new Error(
            `Failed to count today's messages: ${error.message}`
        );
    }

    return count || 0;
}


export async function processOutreachJobs() {

    console.log("🚀 Outreach Worker started...");

    try {

        const sentToday =
            await getTodaySentCount();

        console.log(
            `📊 Sent today: ${sentToday}/${DAILY_LIMIT}`
        );

        if (sentToday >= DAILY_LIMIT) {
            console.log(
                "🛑 Daily limit reached."
            );
            return;
        }

        const remaining =
            DAILY_LIMIT - sentToday;


        // --------------------------------
        // Get queued jobs
        // --------------------------------

        const { data: jobs, error } =
            await supabase
                .from("outreach_jobs")
                .select("*")
                .eq("status", "queued")
                .order("created_at", {
                    ascending: true
                })
                .limit(remaining);

        if (error) {
            throw new Error(
                `Failed to load outreach jobs: ${error.message}`
            );
        }


        if (!jobs?.length) {
            console.log(
                "📭 No queued outreach jobs."
            );
            return;
        }


        console.log(
            `📋 Found ${jobs.length} queued job(s).`
        );


        // --------------------------------
        // Process jobs
        // --------------------------------

        for (const job of jobs) {

            try {

                console.log("");
                console.log(
                    "────────────────────────"
                );

                console.log(
                    `📨 Job #${job.id}`
                );

                console.log(
                    `👤 Lead ID: ${job.lead_id}`
                );

                console.log(
                    `📡 Channel: ${job.channel}`
                );

                console.log(
                    `🎯 Target: ${job.target}`
                );


                // --------------------------------
                // Mark processing
                // --------------------------------

                const { error: processingError } =
                    await supabase
                        .from("outreach_jobs")
                        .update({
                            status: "processing",
                            updated_at:
                                new Date().toISOString()
                        })
                        .eq("id", job.id)
                        .eq("status", "queued");


                if (processingError) {
                    throw new Error(
                        `Failed to mark job processing: ${processingError.message}`
                    );
                }


                // --------------------------------
                // TEST MODE
                // --------------------------------

                let jobToProcess = {
                    ...job
                };


                if (TEST_MODE) {

                    if (
                        job.channel === "email" &&
                        process.env.TEST_OUTREACH_EMAIL
                    ) {

                        jobToProcess.target =
                            process.env.TEST_OUTREACH_EMAIL;

                    }

                    if (
                        job.channel === "whatsapp" &&
                        process.env.TEST_OUTREACH_WHATSAPP
                    ) {

                        jobToProcess.target =
                            process.env.TEST_OUTREACH_WHATSAPP;

                    }

                    console.log(
                        `🧪 TEST MODE → ${jobToProcess.target}`
                    );
                }


                // --------------------------------
                // Dispatcher
                // --------------------------------

                const result =
                    await dispatchOutreachJob(
                        jobToProcess
                    );


                console.log(
                    `✅ Dispatch successful`
                );

                console.log(
                    `🆔 Message ID: ${result.messageId}`
                );


                // --------------------------------
                // Mark SENT
                // --------------------------------

                const { error: updateError } =
                    await supabase
                        .from("outreach_jobs")
                        .update({
                            status: "sent",

                            attempts:
                                (job.attempts || 0) + 1,

                            sent_at:
                                new Date().toISOString(),

                            last_error: null,

                            message:
                                result.message ||
                                job.message ||
                                null,

                            updated_at:
                                new Date().toISOString()
                        })
                        .eq("id", job.id);


                if (updateError) {
                    throw new Error(
                        `Failed to update job: ${updateError.message}`
                    );
                }


                // --------------------------------
                // Update lead status
                // --------------------------------

                const { error: leadUpdateError } =
                    await supabase
                        .from("leads")
                        .update({
                            status: "contacted"
                        })
                        .eq("id", job.lead_id);


                if (leadUpdateError) {

                    console.error(
                        `⚠️ Lead status update failed: ${leadUpdateError.message}`
                    );

                }


                console.log(
                    `✅ Job #${job.id} marked as SENT`
                );

            } catch (jobError) {

                console.error(
                    `❌ Job #${job.id} failed:`,
                    jobError.message
                );


                await supabase
                    .from("outreach_jobs")
                    .update({

                        status: "failed",

                        attempts:
                            (job.attempts || 0) + 1,

                        last_error:
                            jobError.message,

                        updated_at:
                            new Date().toISOString()

                    })
                    .eq("id", job.id);

            }
        }


        console.log("");
        console.log(
            "🏁 Outreach Worker finished."
        );

    } catch (error) {

        console.error(
            "❌ Outreach Worker error:",
            error.message
        );

    }
}



