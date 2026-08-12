import supabase from "../database/supabase.js";

/**
 * Normalize email for reliable duplicate detection
 */
function normalizeEmail(email) {
    return email?.trim().toLowerCase() || null;
}


/**
 * Add a prospect to leads.
 *
 * This function does NOT send anything.
 */
export async function addProspect(prospect) {

    const email = normalizeEmail(prospect.email);

    if (!email) {
        throw new Error("Prospect email is required");
    }


    // Check if lead already exists
    const { data: existingLead, error: lookupError } =
        await supabase
            .from("leads")
            .select("id, email, status")
            .eq("email", email)
            .maybeSingle();


    if (lookupError) {
        throw lookupError;
    }


    if (existingLead) {

        console.log(
            `⏭️ Duplicate lead skipped: ${email}`
        );

        return {
            created: false,
            duplicate: true,
            lead: existingLead
        };
    }


    // Insert new lead
    const { data: lead, error } =
        await supabase
            .from("leads")
            .insert({
                name: prospect.name || "Unknown",
                company_name:
                    prospect.companyName || null,
                email,
                website:
                    prospect.website || null,
                instagram:
                    prospect.instagram || null,
                industry:
                    prospect.industry || null,
                country:
                    prospect.country || null,
                status: "new",
                source:
                    prospect.source || "prospecting"
            })
            .select()
            .single();


    if (error) {
        console.error(
            "❌ Failed to create prospect:",
            error
        );

        throw error;
    }


    console.log(
        `✅ New lead created: ${email}`
    );


    return {
        created: true,
        duplicate: false,
        lead
    };
}


/**
 * Import multiple prospects.
 */
export async function importProspects(prospects) {

    if (!Array.isArray(prospects)) {
        throw new Error(
            "Prospects must be an array"
        );
    }


    const results = [];

    for (const prospect of prospects) {

        try {

            const result =
                await addProspect(prospect);

            results.push(result);

        } catch (error) {

            console.error(
                "❌ Prospect import failed:",
                error.message
            );

            results.push({
                created: false,
                error: error.message
            });
        }
    }
    const created =
        results.filter(r => r.created).length;
    const duplicates =
        results.filter(r => r.duplicate).length;
    const failed =
        results.filter(r => r.error).length;
    console.log("📊 Prospect import finished:");
    console.log(`✅ Created: ${created}`);
    console.log(`♻️ Duplicates: ${duplicates}`);
    console.log(`❌ Failed: ${failed}`);
    return results;
}