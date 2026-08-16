import "dotenv/config";

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

const response = await fetch(
    `https://graph.facebook.com/v23.0/${phoneNumberId}?fields=id,display_phone_number,verified_name`,
    {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
);

console.log("Status:", response.status);
console.log(await response.text());