import "dotenv/config";

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

const to = process.env.TEST_WHATSAPP_TO;

if (!token) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is missing");
}

if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is missing");
}

if (!to) {
    throw new Error(
        "TEST_WHATSAPP_TO is missing; use an international number without +"
    );
}

const response = await fetch(
    `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
    {
        method: "POST",

        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: {
                preview_url: false,
                body: "FORIXA WhatsApp API test 🚀"
            }
        })
    }
);
console.log("Token exists:", !!token);
console.log("Phone Number ID:", phoneNumberId);
console.log("Status:", response.status);
console.log(await response.text());