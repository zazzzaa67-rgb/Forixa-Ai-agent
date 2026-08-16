import supabase from "../database/supabase.js";

import { generateOutreachMessage } from "../agent/outreachAgent.js";
import { sendOutreachEmail } from "../outreach/emailSender.js";
import { sendWhatsAppTemplate } from "../outreach/whatsappSender.js";
import {
    validateOutreachMessage
} from "../agent/outreachValidator.js";
import { scheduleFollowUp } from "../agent/tools.js";
/**
 * Dispatch ONE outreach job.
 *
 * Responsibilities:
 * - Load the lead
 * - Generate personalized message
 * - Send through the selected channel
 *
 * This function does NOT manage queues.
 * The worker is responsible for queue management.
 */
export async function dispatchOutreachJob(job) {

    if (!job) {
        throw new Error("Outreach job is required");
    }

    if (!job.lead_id) {
        throw new Error("Job lead_id is required");
    }

    if (!job.channel) {
        throw new Error("Job channel is required");
    }


    // --------------------------------
    // 1. Load verified lead
    // --------------------------------

    const { data: lead, error: leadError } =
        await supabase
            .from("leads")
            .select("*")
            .eq("id", job.lead_id)
            .single();

    if (leadError || !lead) {

        throw new Error(
            `Lead not found: ${job.lead_id}`
        );

    }


    console.log(
        `👤 Loaded lead #${lead.id}:`,
        lead.company_name || lead.name
    );


    // --------------------------------
    // 2. Generate AI outreach message
    // --------------------------------

    const outreach =
        await generateOutreachMessage(lead);
    const validation =
    validateOutreachMessage({
        prospect: lead,
        outreach
    });
    if (!validation.valid) {
        throw new Error(
            `Outreach validation failed: ${validation.reason}`
        );
    }

    console.log(
        `🤖 AI selected service: ${outreach.service}`
    );

    console.log(
        `💬 AI message: ${outreach.message}`
    );


    // --------------------------------
    // 3. Send through channel
    // --------------------------------

    let result;


    // ================================
    // EMAIL
    // ================================

    if (job.channel === "email") {

        if (!job.target && !lead.email) {

            throw new Error(
                "Email target is missing"
            );

        }

        const target =
            job.target || lead.email;


        result = await sendOutreachEmail({

            to: target,

            company:
                lead.company_name ||
                lead.name ||
                "your business",

            service:
                outreach.service,

            message:
                outreach.message

        });
        // Schedule first follow-up after successful initial outreach
        await scheduleFollowUp(
            lead.id,
            new Date(Date.now() + 24 * 60 * 60 * 1000),
            1
        );

        console.log(
            `📅 Follow-up #1 scheduled for lead #${lead.id}`
        );


    }


    // ================================
    // WHATSAPP
    // ================================

    else if (job.channel === "whatsapp") {

        if (!job.target && !lead.phone) {

            throw new Error(
                "WhatsApp target is missing"
            );

        }

        const target =
            job.target || lead.phone;


    result = await sendWhatsAppTemplate({
        to: target,

        templateName: "3p_direct_integration_test_template",

        languageCode: "en_US",

        parameters: [
            lead.name || "there",
            lead.company_name || "your business"
        ]
    });

    }


    // ================================
    // INSTAGRAM
    // ================================

    else if (job.channel === "instagram") {

        throw new Error(
            "Instagram outreach is not implemented yet"
        );

    }


    // ================================
    // PHONE
    // ================================

    else if (job.channel === "phone") {

        throw new Error(
            "Phone outreach is not implemented yet"
        );

    }


    // ================================
    // UNKNOWN CHANNEL
    // ================================

    else {
        throw new Error(
            `Unsupported outreach channel: ${job.channel}`
        );
    }


    // --------------------------------
    // 4. Return unified result
    // --------------------------------

    return {
        success: true,
        jobId: job.id,
        leadId: lead.id,
        channel: job.channel,
        target:
            job.target ||
            lead.email ||
            lead.phone ||
            null,
        service:
            outreach.service,
        message:
            outreach.message,
        messageId:
            result?.messageId || null
    };
}