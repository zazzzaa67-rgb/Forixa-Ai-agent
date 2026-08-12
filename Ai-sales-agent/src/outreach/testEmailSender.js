import { sendOutreachEmail } from "./emailSender.js";

const result = await sendOutreachEmail({
    to: "forixa225@gmail.com",

    company: "Test Restaurant",

    service: "website",

    message: `Hi,

I noticed your business could benefit from a modern website.

We help businesses build fast, modern websites tailored to their needs.

Best regards,
FORIXA Team`
});

console.log("📧 Email sender result:");
console.log(result);