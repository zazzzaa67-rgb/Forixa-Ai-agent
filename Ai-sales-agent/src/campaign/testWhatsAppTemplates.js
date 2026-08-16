import "dotenv/config";

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

console.log("🔑 Token:", token ? "FOUND" : "MISSING");
console.log("🏢 WABA ID:", wabaId || "MISSING");

if (!token) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is missing");
}

if (!wabaId) {
    throw new Error("WHATSAPP_BUSINESS_ACCOUNT_ID is missing");
}

const url =
    `https://graph.facebook.com/v23.0/${wabaId}/message_templates`;

console.log("🌐 Request:", url);

try {

    const response = await fetch(url, {
        method: "GET",

        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const text = await response.text();

    console.log("\n📡 Status:", response.status);

    console.log("\n📦 Response:");
    console.log(text);

} catch (error) {
    console.error("\n❌ Request failed:");
    console.error(error);
}