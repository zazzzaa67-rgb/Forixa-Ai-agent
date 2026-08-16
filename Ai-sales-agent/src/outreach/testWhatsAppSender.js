import "dotenv/config";

import {
    sendWhatsAppTemplate
} from "./whatsappSender.js";

const result = await sendWhatsAppTemplate({
    to: "201115424579",
    templateName: "hello_world",
    languageCode: "en_US"
});

console.log("📱 Template result:");
console.log(result);