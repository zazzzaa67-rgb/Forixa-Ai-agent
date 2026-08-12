import { sendEmail } from "../Email/emailService.js";
export async function sendOutreachEmail({
    to,
    company,
    service,
    message
}) {
    if (!to) {
        throw new Error("Email target is required");
    }

    const subject =
        service === "website"
            ? `Website for ${company || "your business"}`
            : `FORIXA ${service || "services"}`;

    const result = await sendEmail({
        to,
        subject,
        text: message
    });

    return {
        success: true,
        channel: "email",
        target: to,
        messageId: result.id
    };
}