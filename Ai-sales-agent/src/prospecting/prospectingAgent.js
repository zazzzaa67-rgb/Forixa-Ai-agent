import Groq from "groq-sdk";
import "dotenv/config";

import {
    importProspects
} from "./prospectingService.js";


const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});


/**
 * Analyze a list of real prospects.
 *
 * IMPORTANT:
 * The AI only qualifies the supplied data.
 * It does not invent businesses or contact information.
 */
export async function qualifyProspects(
    prospects,
    service
) {

    if (!Array.isArray(prospects)) {
        throw new Error("Prospects must be an array");
    }

    if (!prospects.length) {
        return [];
    }


    const prompt = `
You are a B2B sales prospect qualification assistant for FORIXA.

FORIXA offers:

- Websites
- AI Agents
- AI Chatbots
- APIs
- Professional Portfolios

Target service:
${service}

Below are REAL business prospects collected from an external source.

Your job is ONLY to evaluate whether each business appears relevant
to the requested service.

DO NOT invent:

- names
- emails
- websites
- Instagram accounts
- companies
- facts

Return ONLY valid JSON.

Use this exact structure:

{
  "prospects": [
    {
      "index": 0,
      "qualified": true,
      "reason": "short reason"
    }
  ]
}

Prospects:

${JSON.stringify(prospects)}
`;


    // Ask Groq to qualify the prospects
    const completion =
        await groq.chat.completions.create({

            model: "llama-3.3-70b-versatile",

            messages: [
                {
                    role: "system",
                    content: prompt
                }
            ],

            temperature: 0,

            max_tokens: 2000,

            response_format: {
                type: "json_object"
            }
        });


    let content =
        completion.choices[0]
            .message
            .content
            .trim();


    // Fallback in case the model returns markdown
    content = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    let result;
    try {
        result = JSON.parse(content);
    } catch (error) {
        console.error(
            "❌ Invalid qualification JSON:",
            content
        );
        throw new Error(
            "AI returned invalid qualification data"
        );
    }
    const qualified = [];
    for (const item of result.prospects || []) {
        if (
            item.qualified === true &&
            prospects[item.index]
        ) {
            qualified.push({
                ...prospects[item.index],
                qualification_reason:
                    item.reason
            });
        }
    }

    console.log(
        `🎯 Qualified ${qualified.length}/${prospects.length} prospects`
    );
    return qualified;
}

export async function processProspects(
    prospects,
    service
) {
    if (!Array.isArray(prospects)) {
        throw new Error("Prospects must be an array");
    }
    console.log(
        `🔎 Processing ${prospects.length} prospects...`
    );
    const qualified =
        await qualifyProspects(
            prospects,
            service
        );
    if (!qualified.length) {
        console.log(
            "📭 No qualified prospects."
        );
        return [];
    }
    console.log(
        `💾 Importing ${qualified.length} qualified prospects...`
    );
    const results =
        await importProspects(
            qualified
        );
    return results;
}