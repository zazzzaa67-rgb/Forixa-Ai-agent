import supabase from "../database/supabase.js";
export async function createOutreachJob(job) {
    const {
        lead_id,
        channel,
        target,
        service,
        message = null,
        scheduled_at = null
    } = job;


    // --------------------------------
    // Validate required data
    // --------------------------------
    if (!lead_id) {
        throw new Error(
            "lead_id is required"
        );
    }
    if (!channel || !target || !service) {
        throw new Error(
            "channel, target and service are required"
        );
    }


        // --------------------------------
        // Prevent contacting same lead again
        // --------------------------------

    const {
        data: previousJobs,
        error: previousJobError
    } = await supabase
        .from("outreach_jobs")
        .select("id, status, channel, target")
        .eq("lead_id", lead_id)
        .in("status", [
            "queued",
            "processing",
            "sent"
        ])
        .limit(1);

    if (previousJobError) {
        throw new Error(
            `Failed checking previous outreach: ${previousJobError.message}`
        );
    }

    const previousJob = previousJobs?.[0];

    if (previousJob) {
        console.log(
            `⏭️ Lead #${lead_id} was already contacted. Skipping.`
        );

        return {
            created: false,
            duplicate: true,
            reason: "Lead already contacted",
            job: previousJob
        };
    }
        // --------------------------------
        // Prevent duplicate target/channel
        // --------------------------------
        const {
            data: existing,
            error: lookupError
        } = await supabase
            .from("outreach_jobs")
            .select(
                "id, status"
            )
            .eq(
                "target",
                target
            )
            .eq(
                "channel",
                channel
            )
            .in(
                "status",
                [
                    "queued",
                    "processing"
                ]
            )
            .maybeSingle();
    if (lookupError) {
        throw new Error(
            `Failed checking existing job: ${lookupError.message}`
        );
    }

    if (existing) {
        console.log(
            `⏭️ Duplicate outreach job skipped: ${target}`
        );
        return {
            created: false,
            duplicate: true,
            job: existing
        };
    }
    // --------------------------------
    // Create job
    // --------------------------------
    const {
        data,
        error
    } = await supabase
        .from("outreach_jobs")
        .insert({
            lead_id,
            channel,
            target,
            service,
            message,
            scheduled_at,
            status: "queued",
            attempts: 0
        })
        .select()
        .single();
    if (error) {
        throw new Error(
            `Failed creating outreach job: ${error.message}`
        );
    }
    console.log(
        `📋 Outreach job created: #${data.id} → ${channel} → ${target}`
    );

    return {
        created: true,
        duplicate: false,
        job: data
    };
}
export async function createOutreachJobs(
    jobs = []
) {
    const results = [];
    for (const job of jobs) {
        try {
            const result =
                await createOutreachJob(job);
            results.push(result);
        }
        catch (error) {
            console.error(
                `❌ Failed creating outreach job for ${job.target}:`,
                error.message
            );
            results.push({
                created: false,
                duplicate: false,
                error:
                    error.message
            });
        }
    }

    console.log(
        `\n📊 Outreach jobs processed: ${results.length}`
    );
    return results;
}

