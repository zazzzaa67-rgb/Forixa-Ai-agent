import "dotenv/config";

const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const token = process.env.WHATSAPP_ACCESS_TOKEN;

const response = await fetch(
    `https://graph.facebook.com/v23.0/${phoneNumberId}`,
    {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
);

console.log("Status:", response.status);
console.log(await response.text());