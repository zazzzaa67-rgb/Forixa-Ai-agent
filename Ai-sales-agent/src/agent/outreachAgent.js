import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `
You are the FORIXA outreach assistant.

Your job is to analyze a prospect's VERIFIED information and create
a personalized first-contact sales message.

IMPORTANT RULES:

1. NEVER invent facts about the prospect, company, website, industry,
location, services, problems, or needs.

2. Only use information explicitly provided in the prospect data.

3. Choose ONE FORIXA service that is most relevant to the prospect.

Available services:
- Website
- AI Agent
- AI Chatbot
- API
- Portfolio

4. Keep the message concise and natural.

5. Do not claim that the prospect has a problem unless the data explicitly
proves it.

6. Do not mention internal AI systems, lead scoring, tools, or automation.

7. Do not use fake compliments.

8. The goal is to start a conversation, not aggressively sell.

9. Return ONLY a JSON object.

The JSON MUST have exactly these two fields:

{
  "service": "Website",
  "message": "Your message here"
}

The service MUST be exactly one of:
Website, AI Agent, AI Chatbot, API, Portfolio.

Do not use markdown.
Do not use code fences.
Do not add explanations.
`;

export async function generateOutreachMessage(prospect) {

    if (!prospect) {
        throw new Error("Prospect is required");
    }

    const safeProspect = {
        name: prospect.name ?? null,
        company_name: prospect.company_name ?? null,
        industry: prospect.industry ?? null,
        country: prospect.country ?? null,
        website: prospect.website ?? null,
        instagram: prospect.instagram ?? null
    };

    const response = await groq.chat.completions.create({

        model: "openai/gpt-oss-120b",

        messages: [
            {
                role: "system",
                content: SYSTEM_PROMPT
            },
            {
                role: "user",
                content: `
Create the outreach message using ONLY this verified data:

${JSON.stringify(safeProspect, null, 2)}
`
            }
        ],

        temperature: 0.2,

        max_tokens: 500,

        response_format: {
            type: "json_object"
        }
    });

    const content =
        response.choices[0]?.message?.content?.trim();

    if (!content) {
        throw new Error(
            "AI returned an empty outreach response"
        );
    }

    console.log("🤖 Raw AI response:", content);

    let result;

    try {

        result = JSON.parse(content);

    } catch (error) {

        console.error(
            "❌ Invalid AI JSON:",
            content
        );

        throw new Error(
            "AI returned invalid JSON"
        );
    }

    const allowedServices = [
        "Website",
        "AI Agent",
        "AI Chatbot",
        "API",
        "Portfolio"
    ];

    if (
        !allowedServices.includes(result.service)
    ) {
        throw new Error(
            `Invalid AI service: ${result.service}`
        );
    }

    if (
        typeof result.message !== "string" ||
        !result.message.trim()
    ) {
        throw new Error(
            "AI outreach response is missing message"
        );
    }

    return {
        service: result.service,
        message: result.message.trim()
    };
}