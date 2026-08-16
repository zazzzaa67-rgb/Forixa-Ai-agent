import express from "express";
import supabase from "../database/supabase.js";

const router = express.Router();


// ==========================================
// Meta Webhook verification
// ==========================================

router.get("/webhook", (req, res) => {

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
        mode === "subscribe" &&
        token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {

        console.log("✅ WhatsApp Webhook verified");

        return res.status(200).send(challenge);
    }

    console.log("❌ WhatsApp Webhook verification failed");

    return res.sendStatus(403);
});


// ==========================================
// Receive WhatsApp events
// ==========================================

router.post("/webhook", async (req, res) => {
    try {
        console.log("\n📩 WhatsApp webhook received:");
        console.log("📩 WhatsApp webhook received:");
        console.log(JSON.stringify(req.body, null, 2));

        console.log("ENTRY:");
        console.log(JSON.stringify(req.body?.entry, null, 2));

        console.log("CHANGES:");
        console.log(
            JSON.stringify(req.body?.entry?.[0]?.changes, null, 2)
        );

    console.log("VALUE:");
    console.log(
        JSON.stringify(
            req.body?.entry?.[0]?.changes?.[0]?.value,
            null,
            2
        )
    );

    console.log("MESSAGES:");
    console.log(
        JSON.stringify(
            req.body?.entry?.[0]?.changes?.[0]?.value?.messages,
            null,
            2
        )
    );
        // --------------------------------------
        // Make sure this is a WhatsApp event
        // --------------------------------------
        const entry = req.body?.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        if (!value) {
            console.log("ℹ️ No WhatsApp value found");
            return res.sendStatus(200);
        }
        const messages = value.messages;
        if (!messages || messages.length === 0) {
            console.log("ℹ️ Webhook event has no incoming messages");
            return res.sendStatus(200);
        }
        // --------------------------------------
        // Process each message
        // --------------------------------------
        for (const message of messages) {
            const whatsappNumber = message.from;
            const messageId = message.id;
            const messageType = message.type;
            console.log("📱 From:", whatsappNumber);
            console.log("🆔 Message ID:", messageId);
            console.log("📦 Type:", messageType);
            // --------------------------------------
            // Currently support text messages
            // --------------------------------------
            if (messageType !== "text") {
                console.log(
                    `ℹ️ Message type "${messageType}" is not supported yet`
                );
                continue;
            }
            const messageText = message.text?.body;
            if (!messageText) {
                console.log("⚠️ Message has no text");
                continue;
            }
            console.log("💬 Message:", messageText);
            // --------------------------------------
            // Normalize phone number
            // --------------------------------------
            const normalizedPhone =
                String(whatsappNumber).replace(/\D/g, "");
            console.log(
                "🔎 Searching lead by phone:",
                normalizedPhone
            );
            // --------------------------------------
            // Find lead
            // --------------------------------------

            const { data: leads, error: leadError } = await supabase
                .from("leads")
                .select("id, name, company_name, phone, whatsapp")
                .or(`phone.eq.${normalizedPhone},phone.eq.+${normalizedPhone}`)
                .limit(1);

            if (leadError) {
                console.error("❌ Lead lookup error:", leadError);
                continue;
            }

            let lead;

            // --------------------------------------
            // Existing lead
            // --------------------------------------

            if (leads && leads.length > 0) {

                lead = leads[0];

                console.log(
                    `✅ Lead found: #${lead.id} - ${lead.name}`
                );

            }

            // --------------------------------------
            // New lead
            // --------------------------------------

            else {

                console.log(
                    `🆕 No lead found. Creating new WhatsApp lead: ${normalizedPhone}`
                );

                const contactName =
                    value?.contacts?.[0]?.profile?.name ||
                    "WhatsApp Lead";

                const { data: newLead, error: createLeadError } =
                    await supabase
                        .from("leads")
                        .insert({
                            name: contactName,
                            company_name: null,
                            email: null,
                            website: null,
                            instagram: null,
                            industry: null,
                            country: null,
                            status: "new",
                            source: "whatsapp",
                            phone: normalizedPhone,
                            whatsapp: true,
                            last_replied_at: new Date().toISOString()
                        })
                        .select()
                        .single();

                if (createLeadError) {

                    console.error(
                        "❌ Failed to create WhatsApp lead:",
                        createLeadError
                    );

                    continue;
                }

                lead = newLead;

                console.log(
                    `✅ New lead created: #${lead.id} - ${lead.name}`
                );
            }
            const { data: conversation, error: conversationError } =
                await supabase
                    .from("agent_conversations")
                    .insert({
                        lead_id: lead.id,
                        channel: "whatsapp",
                        role: "user",
                        content: messageText
                    })
                    .select()
                    .single();
            if (conversationError) {
                console.error(
                    "❌ Failed to save WhatsApp message:",
                    conversationError
                );
                continue;
            }

            console.log(
                "💾 Conversation saved:",
                conversation.id
            );
            // --------------------------------------
            // Update lead
            // --------------------------------------
            const { error: updateError } = await supabase
                .from("leads")
                .update({
                    last_replied_at: new Date().toISOString(),
                    whatsapp: true
                })
                .eq("id", lead.id);
            if (updateError) {
                console.error(
                    "⚠️ Failed to update lead:",
                    updateError
                );
            } else {
                console.log(
                    `✅ Lead #${lead.id} updated`
                );
            }
            console.log(
                `🎯 WhatsApp message processed successfully for lead #${lead.id}`
            );
        }

        // --------------------------------------
        // Always acknowledge Meta
        // --------------------------------------
        return res.sendStatus(200);
    } catch (error) {
        console.error(
            "❌ WhatsApp webhook error:",
            error
        );
        /*
         * We still return 200 so Meta doesn't repeatedly
         * retry the same webhook while we're debugging.
         */
        return res.sendStatus(200);
    }
});
export default router;