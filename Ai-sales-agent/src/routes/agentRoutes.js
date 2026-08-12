import express from "express";
import supabase from "../database/supabase.js";
import { generateResponse } from "../agent/agent.js";
import { classifyConversation } from "../agent/classifier.js";
import {
    scheduleFollowUp,
    recordLeadReply,
    cancelPendingFollowUps
} from "../agent/tools.js";
const router = express.Router();
router.post("/test-followup", async (req, res) => {

    try {

        const { leadId } = req.body;

        const scheduledAt = new Date(
            Date.now() + 2 * 60 * 1000
        ).toISOString();

        const result = await scheduleFollowUp(
            leadId,
            scheduledAt,
            1
        );

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});
router.post("/chat", async (req, res) => {

    try {
        const { leadId, message, channel = "email" } = req.body;
        if (!leadId || !message) {
            return res.status(400).json({
                error: "leadId and message are required"
            });
        }
        // Customer replied
        await recordLeadReply(leadId);
        // Cancel any pending follow-ups
        await cancelPendingFollowUps(leadId);
            // 1. Get previous conversation
        const { data: history, error: historyError } = await supabase
            .from("agent_conversations")
            .select("role, content")
            .eq("lead_id", leadId)
            .eq("channel", channel)
            .order("created_at", {
                ascending: true
            });
        if (historyError) {
            console.error(historyError);
            return res.status(500).json({
                error: "Failed to load conversation"
            });
        }
        // 2. Save user's message
        const { error: saveUserError } = await supabase
            .from("agent_conversations")
            .insert({
                lead_id: leadId,
                channel,
                role: "user",
                content: message
            });
        if (saveUserError) {
            console.error(saveUserError);
            return res.status(500).json({
                error: "Failed to save user message"
            });
        }
        // 3. Send history + new message to AI
        const messages = [
            ...history,
            {
                role: "user",
                content: message
            }
        ];
        const response = await generateResponse(messages);
        // 4. Save AI response
        const { error: saveAssistantError } = await supabase
            .from("agent_conversations")
            .insert({
                lead_id: leadId,
                channel,
                role: "assistant",
                content: response
            });
        if (saveAssistantError) {
            console.error(saveAssistantError);
            return res.status(500).json({
                error: "Failed to save AI response"
            });
        }
        const updatedConversation = [
            ...history,
            {
                role: "user",
                content: message
            },
            {
                role: "assistant",
                content: response
            }
        ];

        const classification = await classifyConversation(updatedConversation);
        // 5. Return response
        res.json({
            success: true,
            response,
            classification
        });
    } catch (error) {
        console.error("Agent Error:", error);
        res.status(500).json({
            error: "AI Agent failed"
        });
    }
});
export default router;