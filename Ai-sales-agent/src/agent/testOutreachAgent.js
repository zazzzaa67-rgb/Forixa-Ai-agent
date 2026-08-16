import "dotenv/config";
import { generateOutreachMessage } from "./outreachAgent.js";
const prospect = {
    id: 1,
    name: "John Smith",
    company_name: "ABC Restaurant",
    industry: "Restaurant",
    country: "USA",
    website: "https://abc-restaurant.com",
    instagram: "@abcrestaurant"
};
const result = await generateOutreachMessage(prospect);
console.log("");
console.log("🤖 AI OUTREACH RESULT");
console.log("====================");
console.log(result);