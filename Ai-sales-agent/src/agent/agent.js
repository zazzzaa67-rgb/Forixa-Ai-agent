import "dotenv/config";
import Groq from "groq-sdk";

import {
    getPricing,
    getServiceInfo,
    updateLeadStatus,
    scheduleFollowUp,
    notifyOwner
} from "./tools.js";

if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `
You can perform the following actions when appropriate:

- Update a lead's status.
- Schedule a follow-up.
- Notify the owner when a lead is hot or requires human attention.

Rules for actions:

- If the lead clearly shows interest in a service, update the status to "interested".
- If the lead discusses specific project requirements, update the status to "qualified".
- If the lead clearly wants to start a project, requests a quote, asks how to start, or is ready to purchase, update the status to "hot" and notify the owner.
- If the lead explicitly says they are not interested, update the status to "not_interested".
- If the lead asks not to be contacted again, update the status to "opted_out".
- Never mark a lead as hot without clear evidence.
- Never schedule a follow-up for an opted-out lead.
- When a lead becomes hot, notify the owner.
- Do not tell the customer about internal actions or tools.
`;

const tools = [
    {
        type: "function",
        function: {
            name: "getPricing",
            description: "Get the current prices and information for all active FORIXA services.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
    type: "function",
    function: {
        name: "getServiceInfo",
        description:
            "Use this function ONLY when the customer asks about one specific FORIXA service or its price. The serviceName must be exactly one of: Website, AI Agent, AI Chatbot, API, Portfolio.",
        parameters: {
            type: "object",
            properties: {
                serviceName: {
                    type: "string",
                    enum: [
                        "Website",
                        "AI Agent",
                        "AI Chatbot",
                        "API",
                        "Portfolio"
                    ],
                    description: "The exact FORIXA service name."
                }
            },
            required: ["serviceName"],
            additionalProperties: false
        }
    }
},
    {
    type: "function",
    function: {
        name: "updateLeadStatus",
        description: "Update the current lead's status.",
        parameters: {
            type: "object",
            properties: {
                leadId: {
                    type: "integer"
                },
                status: {
                    type: "string",
                    enum: [
                        "new",
                        "contacted",
                        "replied",
                        "interested",
                        "qualified",
                        "hot",
                        "not_interested",
                        "opted_out"
                    ]
                }
            },
            required: ["leadId", "status"]
        }
    }
    },
    {
    type: "function",
    function: {
        name: "scheduleFollowUp",
        description: "Schedule a future follow-up message for a lead.",
        parameters: {
            type: "object",
            properties: {
                leadId: {
                    type: "integer"
                },
                scheduledAt: {
                    type: "string",
                    description: "ISO 8601 date and time."
                },
                attemptNumber: {
                    type: "integer"
                }
            },
            required: ["leadId", "scheduledAt"]
        }
    }
    },
    {
    type: "function",
    function: {
        name: "notifyOwner",
        description: "Notify the FORIXA owner when a lead becomes a hot lead or requires human attention.",
        parameters: {
            type: "object",
            properties: {
                leadId: {
                    type: "integer"
                },
                reason: {
                    type: "string"
                }
            },
            required: ["leadId", "reason"]
        }
    }
    }
];

async function executeTool(name, argumentsString) {

    const args = JSON.parse(argumentsString || "{}");

    switch (name) {

        case "getPricing":
            return await getPricing();

        case "getServiceInfo":
            return await getServiceInfo(args.serviceName);

        case "updateLeadStatus":
            return await updateLeadStatus(
                args.leadId,
                args.status
            );

        case "scheduleFollowUp":
            return await scheduleFollowUp(
                args.leadId,
                args.scheduledAt,
                args.attemptNumber || 1
            );

        case "notifyOwner":
            return await notifyOwner(
                args.leadId,
                args.reason
            );

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

export async function generateResponse(messages , leadId) {
    try {
        const conversation = [
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            {
                role: "system",
                content: `The current lead ID is ${leadId}. When using lead-related tools, always use this exact leadId. Never guess or use another lead ID.`
            },
            ...messages.map(message => ({
                role: message.role,
                content: message.content
            }))
        ];
        let iterations = 0;
        const MAX_ITERATIONS = 5;
        while (iterations < MAX_ITERATIONS) {
            iterations++;
            const response = await groq.chat.completions.create({
                model: "openai/gpt-oss-120b",
                messages: conversation,
                tools,
                tool_choice: "auto",
                temperature: 0.2,
                max_tokens: 500
            });

            const assistantMessage = response.choices[0].message;

            // Add AI response to conversation
            conversation.push(assistantMessage);

            // AI has finished and doesn't need any tool
            if (!assistantMessage.tool_calls?.length) {

                return assistantMessage.content;
            }

            // Execute all requested tools
            for (const toolCall of assistantMessage.tool_calls) {

                console.log(
                    "🔧 Tool:",
                    toolCall.function.name
                );

                console.log(
                    "📦 Arguments:",
                    toolCall.function.arguments
                );

                try {

                    const toolResult = await executeTool(
                        toolCall.function.name,
                        toolCall.function.arguments
                    );

                    console.log(
                        "✅ Tool Result:",
                        toolResult
                    );

                    conversation.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult)
                    });

                } catch (toolError) {

                    console.error(
                        "❌ Tool Error:",
                        toolError
                    );

                    conversation.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({
                            success: false,
                            error: toolError.message
                        })
                    });
                }
            }
        }

        throw new Error(
            "Maximum agent iterations reached"
        );

    } catch (error) {

        console.error("Agent Error:", error);

        throw new Error(
            "Failed to generate agent response"
        );
    }
}