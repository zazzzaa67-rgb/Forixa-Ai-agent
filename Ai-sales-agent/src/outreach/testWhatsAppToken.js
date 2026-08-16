import "dotenv/config";

const token = process.env.WHATSAPP_ACCESS_TOKEN;

const response = await fetch(
    `https://graph.facebook.com/v25.0/me?access_token=${token}`
);

const data = await response.json();

console.log("Status:", response.status);
console.log(
    JSON.stringify(data, null, 2)
);