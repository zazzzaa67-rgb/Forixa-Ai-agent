import "dotenv/config";
import supabase from "../database/supabase.js";
import { sendOutreachEmail } from "./emailSender.js";

const DAILY_LIMIT = 20;

// TEST MODE:
// true  = يسمح بالإرسال فقط إلى TEST_OUTREACH_EMAIL
// false = يسمح بالهدف الموجود في الـjob
const TEST_MODE = process.env.OUTREACH_TEST_MODE === "true";

const TEST_EMAIL = process.env.TEST_OUTREACH_EMAIL;

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
        const sentToday = await getTodaySentCount();

        console.log(
            `📊 Sent today: ${sentToday}/${DAILY_LIMIT}`
        );

        if (sentToday >= DAILY_LIMIT) {
            console.log("🛑 Daily limit reached.");
            return;
        }

        const remaining = DAILY_LIMIT - sentToday;

        const { data: jobs, error } = await supabase
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
            console.log("📭 No queued outreach jobs.");
            return;
        }

        console.log(
            `📋 Found ${jobs.length} queued job(s).`
        );

        for (const job of jobs) {
            try {
                console.log("");
                console.log("────────────────────────");
                console.log(`📨 Job #${job.id}`);
                console.log(`👤 Lead ID: ${job.lead_id}`);
                console.log(`📡 Channel: ${job.channel}`);
                console.log(`🎯 Target: ${job.target}`);
                console.log(`💬 Message: ${job.message}`);

                // --------------------------------
                // TEST MODE
                // --------------------------------

                let target = job.target;

                if (TEST_MODE) {
                    if (!TEST_EMAIL) {
                        throw new Error(
                            "TEST_OUTREACH_EMAIL is missing"
                        );
                    }

                    target = TEST_EMAIL;

                    console.log(
                        `🧪 TEST MODE → sending only to ${target}`
                    );
                }

                // --------------------------------
                // CHANNEL
                // --------------------------------

                if (job.channel === "email") {
                    const result =
                        await sendOutreachEmail({
                            to: target,
                            company: job.company || "your business",
                            service: job.service,
                            message: job.message
                        });

                    console.log(
                        `📧 Email sent to ${target}`
                    );

                    console.log(
                        `🆔 Message ID: ${result.messageId}`
                    );

                } else {
                    throw new Error(
                        `Channel "${job.channel}" is not implemented yet`
                    );
                }

                // --------------------------------
                // MARK AS SENT
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
                            updated_at:
                                new Date().toISOString()
                        })
                        .eq("id", job.id);

                if (updateError) {
                    throw new Error(
                        `Failed to update job: ${updateError.message}`
                    );
                }

                console.log(
                    `✅ Job #${job.id} marked as SENT.`
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
        console.log("🏁 Outreach Worker finished.");

    } catch (error) {
        console.error(
            "❌ Outreach Worker error:",
            error.message
        );
    }
}
