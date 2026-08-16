import "dotenv/config";

const token = process.env.WHATSAPP_ACCESS_TOKEN;

const response = await fetch(
    "https://graph.facebook.com/v23.0/2209455876285449?fields=id,name",
    {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
);

console.log("Status:", response.status);
console.log(await response.text());