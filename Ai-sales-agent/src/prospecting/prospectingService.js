import supabase from "../database/supabase.js";


/**
 * Normalize email for reliable duplicate detection
 */
function normalizeEmail(email) {
    return email?.trim().toLowerCase() || null;
}


/**
 * Normalize phone number
 */
function normalizePhone(phone) {
    if (!phone) {
        return null;
    }

    return String(phone)
        .trim()
        .replace(/[^\d+]/g, "");
}


/**
 * Add a prospect to leads.
 *
 * A prospect must have at least:
 * - Email
 * OR
 * - Phone
 *
 * This function does NOT send anything.
 */
export async function addProspect(prospect ,campaignId ) {

    if (!prospect || !prospect.name) {
        throw new Error("Prospect name is required");
    }


    // --------------------------------
    // Normalize contact information
    // --------------------------------

    const email =
        normalizeEmail(prospect.email);

    const phone =
        normalizePhone(prospect.phone);


    // Prospect must have at least one
    // usable contact method.

    if (!email && !phone) {
        throw new Error(
            "Prospect must have an email or phone"
        );
    }


    // --------------------------------
    // Check duplicate by email
    // --------------------------------

    let existingLead = null;


    if (email) {

        const {
            data,
            error
        } = await supabase
            .from("leads")
            .select(
                "id, email, phone, status"
            )
            .eq("email", email)
            .maybeSingle();


        if (error) {
            throw error;
        }


        existingLead = data;
    }


    // --------------------------------
    // Check duplicate by phone
    // --------------------------------

    if (!existingLead && phone) {

        const {
            data,
            error
        } = await supabase
            .from("leads")
            .select(
                "id, email, phone, status"
            )
            .eq("phone", phone)
            .maybeSingle();


        if (error) {
            throw error;
        }


        existingLead = data;
    }


    // --------------------------------
    // Duplicate
    // --------------------------------

    if (existingLead) {

        console.log(
            `⏭️ Duplicate lead skipped: ${
                email || phone
            }`
        );


        return {
            created: false,
            duplicate: true,
            lead: existingLead
        };
    }


    // --------------------------------
    // Insert new lead
    // --------------------------------

    const {
        data: lead,
        error
    } = await supabase
        .from("leads")
        .insert({

            name:
                prospect.name ||
                "Unknown",

            company_name:
                prospect.companyName ||
                prospect.company ||
                null,

            email,

            phone,

            whatsapp:
                prospect.whatsapp === true,

            website:
                prospect.website ||
                null,

            instagram:
                prospect.instagram ||
                null,

            industry:
                prospect.industry ||
                null,

            country:
                prospect.country ||
                null,
            campaign_id: campaignId,
            status:
                "new",

            source:
                prospect.source ||
                "prospecting"
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
        `✅ New lead created: ${
            email || phone
        }`
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
export async function importProspects(
    prospects,
    campaignId
) {

    if (!Array.isArray(prospects)) {
        throw new Error(
            "Prospects must be an array"
        );
    }


    const results = [];


    for (const prospect of prospects) {

        try {

            const result =
                await addProspect(
                    prospect,
                    campaignId
                );

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


    // --------------------------------
    // Summary
    // --------------------------------

    const created =
        results.filter(
            r => r.created
        ).length;


    const duplicates =
        results.filter(
            r => r.duplicate
        ).length;


    const failed =
        results.filter(
            r => r.error
        ).length;


    console.log(
        "📊 Prospect import finished:"
    );

    console.log(
        `✅ Created: ${created}`
    );

    console.log(
        `♻️ Duplicates: ${duplicates}`
    );

    console.log(
        `❌ Failed: ${failed}`
    );


    return results;
}