import "dotenv/config";
import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
const CLASSIFIER_PROMPT = `
You are a sales lead classifier for FORIXA.

FORIXA offers:
- Websites
- AI Agents
- AI Chatbots
- APIs
- Professional Portfolios

Analyze the conversation and return ONLY valid JSON.

Use this exact structure:

{
  "intent": "general_question | service_question | pricing_question | project_inquiry | ready_to_buy | support | other",
  "service": "website | ai_agent | ai_chatbot | api | portfolio | unknown",
  "interest": "low | medium | high | very_high",
  "lead_status": "new | contacted | replied | interested | qualified | hot | not_interested | opted_out",
  "needs_human": true,
  "reason": "short explanation"
}

Rules:

- If the person is only asking general questions, interest is usually low or medium.
- If they show clear interest in a FORIXA service, use interested.
- If they discuss their actual project requirements, use qualified.
- If they clearly want to start a project, request a quote, ask how to get started, or are ready to purchase, use hot.
- Set needs_human to true when the person appears ready to start a project, requests a custom quote, wants to negotiate, or requires information the AI does not have.
- If the person explicitly says they are not interested, use not_interested.
- If the person asks not to be contacted again, use opted_out.
- Never assume someone is a hot lead without evidence from the conversation.
- Return JSON only. No markdown. No additional text.
`;
export async function classifyConversation(messages) {
    try {
        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                {
                    role: "system",
                    content: CLASSIFIER_PROMPT
                },
                {
                    role: "user",
                    content: JSON.stringify(messages)
                }
            ],
            temperature: 0,
            max_tokens: 300
        });
        const result = completion.choices[0].message.content;
        return JSON.parse(result);
    } catch (error) {
        console.error("Classifier Error:", error);
        throw new Error("Failed to classify conversation");
    }
}