import Groq from "groq-sdk";
import "dotenv/config";

if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export async function generateFollowUp(lead, conversation) {

        const recentConversation = conversation.slice(-6);

        const formattedConversation = recentConversation
            .map(message => {
                return `${message.role}: ${message.content}`;
            })
            .join("\n");

    const prompt = `
You are the follow-up sales assistant for FORIXA.

FORIXA offers:
- Websites
- AI Agents
- AI Chatbots
- APIs
- Professional Portfolios

Your task is to write ONE professional follow-up email
for a business lead who has not replied yet.

Lead:
Name: ${lead.name}
Company: ${lead.company_name}
Industry: ${lead.industry}
Website: ${lead.website}

Previous conversation:
${formattedConversation}

Rules:

- Write a NEW message.
- Do NOT copy the previous outreach message.
- Do NOT sound desperate or pushy.
- Do NOT use manipulative or deceptive psychological tactics.
- Focus on the business problem FORIXA can solve.
- Mention a relevant benefit.
- Keep it concise.
- Use a natural professional tone.
- Include a simple call to action.
- Do not invent facts about the company.
- Do not mention that you are an AI.
- Return ONLY the email body.
IMPORTANT EMAIL RULES:
- Never use placeholders such as [Your Name], [Company Name], [Name], etc.
- Never invent a person's name or company information.
- Sign every email exactly as:
Best regards,
FORIXA Team
`;

    const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7,
        max_tokens: 250
    });
    return response.choices[0].message.content.trim();
}