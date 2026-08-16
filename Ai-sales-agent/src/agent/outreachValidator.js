const ALLOWED_SERVICES = [
    "Website",
    "AI Agent",
    "AI Chatbot",
    "API",
    "Portfolio"
];

export function validateOutreachMessage({
    prospect,
    outreach
}) {

    if (!prospect) {
        return {
            valid: false,
            reason: "Prospect is missing"
        };
    }

    if (!outreach) {
        return {
            valid: false,
            reason: "Outreach result is missing"
        };
    }

    if (
        !ALLOWED_SERVICES.includes(
            outreach.service
        )
    ) {
        return {
            valid: false,
            reason: "Invalid service"
        };
    }

    if (
        typeof outreach.message !== "string" ||
        !outreach.message.trim()
    ) {
        return {
            valid: false,
            reason: "Message is empty"
        };
    }

    const message =
        outreach.message.toLowerCase();

    // --------------------------------
    // Block obvious fake compliments
    // --------------------------------

    const forbiddenCompliments = [
        "i love the vibe",
        "love the vibe",
        "amazing business",
        "wonderful business",
        "great business",
        "fantastic business",
        "beautiful website",
        "impressive website",
        "love what you're doing"
    ];

    for (
        const phrase of forbiddenCompliments
    ) {

        if (message.includes(phrase)) {

            return {
                valid: false,
                reason:
                    `Potential unsupported compliment: "${phrase}"`
            };
        }
    }

    // --------------------------------
    // Basic prospect identity check
    // --------------------------------

    if (
        prospect.name &&
        !message.includes(
            prospect.name.toLowerCase()
        )
    ) {

        console.warn(
            "⚠️ Prospect name not mentioned."
        );
    }

    // --------------------------------
    // Final result
    // --------------------------------

    return {
        valid: true,
        reason: "Outreach message passed validation"
    };
}
