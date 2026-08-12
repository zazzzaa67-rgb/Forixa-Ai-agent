/**
 * Filter prospects for a website-outreach campaign.
 *
 * Rules:
 * 1. Prospect must have a contact method.
 * 2. Prefer prospects without a website.
 * 3. Never invent missing contact information.
 * 4. Do not send anything here.
 */
export function filterWebsiteProspects(prospects) {
    if (!Array.isArray(prospects)) {
        throw new Error("Prospects must be an array");
    }
    const eligible = [];
    for (const prospect of prospects) {
        if (!prospect?.name) {
            continue;
        }
        // We only want businesses without a known website.
        if (prospect.hasWebsite) {
            continue;
        }
        // Email is preferred.
        if (prospect.hasEmail) {
            eligible.push({
                ...prospect,
                eligible: true,
                outreachChannel: "email",
                qualificationReason:
                    "No website listed and public email available"
            });
            continue;
        }
        // Social candidate.
        if (prospect.hasInstagram) {
            eligible.push({
                ...prospect,
                eligible: true,
                outreachChannel: "instagram",
                qualificationReason:
                    "No website listed and public Instagram available"
            });
            continue;
        }
        // Phone is kept as a candidate, but we don't automatically
        // send anything through it.
        if (prospect.phone) {
            eligible.push({
                ...prospect,
                eligible: true,
                outreachChannel: "phone",
                qualificationReason:
                    "No website listed and public phone number available"
            });
            continue;
        }
    }
    console.log(
        `🎯 Website prospects eligible: ${eligible.length}/${prospects.length}`
    );
    return eligible;
}