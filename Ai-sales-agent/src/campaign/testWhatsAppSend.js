import "dotenv/config";

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

// ضع رقمك الشخصي هنا بصيغة دولية
const to = "201115424579";

const response = await fetch(
    `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
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