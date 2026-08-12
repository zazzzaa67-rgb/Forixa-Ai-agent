import cron from "node-cron";
import { getGmailClient } from "../Email/googleAuth.js";
import { sendEmail } from "../Email/emailService.js";
import supabase from "../database/supabase.js";
import {cancelPendingFollowUps} from '../agent/tools.js'

import { generateResponse } from "../agent/agent.js";
import {
    getLeadConversation,
    updateLeadStatus,
    notifyOwner,
    recordLeadReply
} from "../agent/tools.js";

import { classifyConversation } from "../agent/classifier.js";


function decodeBase64Url(data) {
    return Buffer.from(
        data.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
    ).toString("utf-8");
}


function extractEmailBody(payload) {

    if (!payload) return "";

    if (
        payload.mimeType === "text/plain" &&
        payload.body?.data
    ) {
        return decodeBase64Url(payload.body.data);
    }

    if (payload.parts?.length) {

        for (const part of payload.parts) {

            const body = extractEmailBody(part);

            if (body) {
                return body;
            }
        }
    }

    return "";
}


export async function checkIncomingEmails() {

    console.log("📥 Checking Gmail replies...");

    try {

        const gmail = getGmailClient();

        const response = await gmail.users.messages.list({
            userId: "me",
            q: "in:inbox is:unread",
            maxResults: 20
        });

        const messages = response.data.messages || [];

        if (!messages.length) {
            console.log("📭 No new emails.");
            return;
        }

        console.log(`📨 Found ${messages.length} unread email(s).`);


        for (const message of messages) {

            try {

                const email = await gmail.users.messages.get({
                    userId: "me",
                    id: message.id,
                    format: "full"
                });


                const headers =
                    email.data.payload?.headers || [];


                const from =
                    headers.find(
                        h => h.name.toLowerCase() === "from"
                    )?.value || "";


                const subject =
                    headers.find(
                        h => h.name.toLowerCase() === "subject"
                    )?.value || "";


                const messageId =
                    headers.find(
                        h => h.name.toLowerCase() === "message-id"
                    )?.value || "";


                const emailMatch =
                    from.match(/<(.+?)>/);


                const senderEmail =
                    emailMatch
                        ? emailMatch[1]
                        : from.trim();
                const { data: lead, error: leadError } =
                    await supabase
                        .from("leads")
                        .select("*")
                        .eq("email", senderEmail)
                        .maybeSingle();


                if (leadError) {

                    console.error(
                        "❌ Lead lookup failed:",
                        leadError.message
                    );

                    continue;
                }


                if (!lead) {

                    console.log(
                        `⏭️ No matching lead for ${senderEmail}`
                    );

                    // Mark unknown email as read
                    await gmail.users.messages.modify({
                        userId: "me",
                        id: message.id,
                        requestBody: {
                            removeLabelIds: ["UNREAD"]
                        }
                    });

                    continue;
                }


                console.log(
                    `🎯 Lead found: ${lead.name} (#${lead.id})`
                );


                const body =
                    extractEmailBody(
                        email.data.payload
                    );
                console.log("💬 Email body:");
                console.log(body);
                const {
                    error: conversationError
                } = await supabase
                    .from("agent_conversations")
                    .insert({
                        lead_id: lead.id,
                        channel: "email",
                        role: "user",
                        content: body
                    });
                if (conversationError) {

                    console.error(
                        "❌ Failed to save email conversation:",
                        conversationError.message
                    );
                    continue;
                }
                console.log(
                    "💾 Lead reply saved to conversation."
                );
                await recordLeadReply(lead.id);
                const conversation =
                    await getLeadConversation(
                        lead.id,
                        "email"
                    );
                console.log("🧠 Classifying lead...");
                const classification =
                    await classifyConversation(
                        conversation
                    );
                console.log(
                    "📊 Classification:",
                    classification
                );
                if (classification.lead_status) {
                    await updateLeadStatus(
                        lead.id,
                        classification.lead_status
                    );
                    console.log(
                        `📊 Lead status → ${classification.lead_status}`
                    );
                }
            if (classification.lead_status === "hot") {
                await notifyOwner(
                    lead.id,
                    classification.reason
                );

                console.log("🔥 Owner notification triggered.");
            }
                if (
                    classification.lead_status ===
                    "opted_out"
                ) {
                    console.log(
                        "🚫 Lead opted out. No reply sent."
                    );
                    await cancelPendingFollowUps(lead.id);
                } else {
                    console.log(
                        "🤖 Generating AI response..."
                    );
                const aiResponse =
                    await generateResponse(
                        conversation,
                        lead.id
                    );
                    if (!aiResponse) {
                        throw new Error(
                            "AI returned an empty response"
                        );
                    }
                    console.log(
                        "🤖 AI response:"
                    );
                    console.log(aiResponse);
                    const emailResult =
                        await sendEmail({
                            to: senderEmail,
                            subject: subject.startsWith("Re:")
                                ? subject
                                : `Re: ${subject}`,
                            text: aiResponse,
                            threadId: email.data.threadId,
                            inReplyTo: messageId
                        });
                    console.log(
                        `📧 AI reply sent to ${senderEmail}`
                    );
                    const {
                        error: aiConversationError
                    } = await supabase
                        .from("agent_conversations")
                        .insert({
                            lead_id: lead.id,
                            channel: "email",
                            role: "assistant",
                            content: aiResponse
                        });
                    if (aiConversationError) {
                        console.error(
                            "❌ Failed to save AI response:",
                            aiConversationError.message
                        );
                    } else {
                        console.log(
                            "💾 AI response saved to conversation."
                        );
                    }
                }
                await gmail.users.messages.modify({
                    userId: "me",
                    id: message.id,
                    requestBody: {
                        removeLabelIds: ["UNREAD"]
                    }
                });
                console.log(
                    `✅ Email ${message.id} processed.`
                );
                console.log("────────────────────────");
            } catch (emailError) {

                console.error(
                    `❌ Failed processing email ${message.id}:`,
                    emailError.message
                );
            }
        }
    } catch (error) {

        console.error(
            "❌ Gmail reply checker failed:",
            error.message
        );
    }
}
cron.schedule("* * * * *", async () => {
    await checkIncomingEmails();
});