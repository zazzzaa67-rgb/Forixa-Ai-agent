/**
 * Decide which outreach channel should be used.
 *
 * IMPORTANT:
 * - This file does NOT send messages.
 * - It only routes a qualified prospect to a channel.
 * - Never invent contact information.
 */

export function getOutreachChannel(prospect) {
    if (!prospect) {
        return {
            channel: null,
            contactable: false,
            reason: "Prospect is missing"
        };
    }

    // 1. Email — preferred channel
    if (prospect.email) {
        return {
            channel: "email",
            contactable: true,
            target: prospect.email,
            reason: "Public email available"
        };
    }

    // 2. Instagram
    if (prospect.instagram) {
        return {
            channel: "instagram",
            contactable: true,
            target: prospect.instagram,
            reason: "Instagram account available"
        };
    }

    // 3. WhatsApp
    //
    // IMPORTANT:
    // A phone number alone does NOT prove that WhatsApp
    // messaging is available.
    //
    // We only route to WhatsApp if another part of the
    // enrichment pipeline explicitly confirms it.
    if (
        prospect.whatsapp === true &&
        prospect.phone
    ) {
        return {
            channel: "whatsapp",
            contactable: true,
            target: prospect.phone,
            reason: "WhatsApp availability confirmed"
        };
    }

    // 4. Phone
    if (prospect.phone) {
        return {
            channel: "phone",
            contactable: true,
            target: prospect.phone,
            reason: "Public phone number available"
        };
    }

    // No usable contact channel
    return {
        channel: null,
        contactable: false,
        target: null,
        reason: "No usable contact channel found"
    };
}


/**
 * Route multiple prospects.
 */
export function routeProspects(prospects = []) {
    return prospects.map((prospect) => {
        const route = getOutreachChannel(prospect);

        return {
            ...prospect,
            outreach: route
        };
    });
}


/**
 * Return only prospects that can actually be contacted.
 */
export function getContactableProspects(prospects = []) {
    return routeProspects(prospects)
        .filter((prospect) => prospect.outreach.contactable);
}