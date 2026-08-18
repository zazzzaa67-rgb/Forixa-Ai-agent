import { searchOpenStreetMap } from "./providers/openStreetMapProvider.js";
async function main() {
    console.log("🧪 Testing OpenStreetMap directly...");
    console.log("────────────────────────");
    try {
        const prospects = await searchOpenStreetMap({
            city: "London",
            category: "restaurant",
            limit: 50
        });
        const withPhone = prospects.filter(
            prospect => prospect.phone
        );
        console.log(
            `📱 Businesses with phone: ${withPhone.length}`
        );
        console.log(
            JSON.stringify(
                withPhone,
                null,
                2
            )
        );
    } catch (error) {

        console.error("");
        console.error(
            "❌ OpenStreetMap test failed:"
        );

        console.error(
            error
        );
    }
}

main();

