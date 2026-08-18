import "dotenv/config";

import { runCampaign } from "./campaignRunner.js";

async function main() {

    console.log("");
    console.log("🧪 TEST CAMPAIGN");
    console.log("========================");

    try {

        const result = await runCampaign({

            name: "Test WhatsApp Campaign",

            service: "Website",

            targetIndustry: "restaurant",

            targetCity: "Alexandria",

            targetCountry: "Egypt",

            targetCount: 5,

            emailLimit: 0,

            whatsappLimit: 1,

            socialLimit: 0

        });

        console.log("");
        console.log("🎉 TEST FINISHED");
        console.log("========================");

        console.log("");
        console.log("📋 Campaign:");
        console.log(result.campaign);

        console.log("");
        console.log("🗺️ Prospects:");
        console.log(result.prospects);

        console.log("");
        console.log("💾 Imported Prospects:");
        console.log(result.importedProspects);

        console.log("");
        console.log("📨 Jobs:");
        console.log(result.jobs);

        console.log("");
        console.log("📊 Campaign Jobs:");
        console.log(result.campaignJobs);

    } catch (error) {

        console.error("");
        console.error("❌ TEST CAMPAIGN FAILED:");
        console.error(error);

        process.exit(1);
    }
}
main();