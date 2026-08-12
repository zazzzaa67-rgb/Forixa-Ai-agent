/**
 * Enrich a prospect using contact information already
 * provided by the discovery source.
 *
 * We do NOT invent contact information.
 * We do NOT scrape arbitrary websites/social platforms.
 */
export function enrichProspect(prospect) {
    if (!prospect || !prospect.name) {
        return null;
    }

    const email =
        prospect.email?.trim() || null;

    const website =
        prospect.website?.trim() || null;

    const instagram =
        prospect.instagram?.trim() || null;

    const phone =
        prospect.phone?.trim() || null;

    let contactChannel = null;

    if (email) {
        contactChannel = "email";
    } else if (instagram) {
        contactChannel = "instagram";
    } else if (phone) {
        contactChannel = "phone";
    }

    return {
        ...prospect,

        email,
        website,
        instagram,
        phone,

        hasWebsite: Boolean(website),

        hasEmail: Boolean(email),

        hasInstagram: Boolean(instagram),

        contactChannel,

        contactable: Boolean(contactChannel)
    };
}

export function enrichProspects(prospects) {
    if (!Array.isArray(prospects)) {
        throw new Error("Prospects must be an array");
    }

    const enriched = prospects
        .map(enrichProspect)
        .filter(Boolean);
    const stats = {
        total: enriched.length,
        withEmail:
            enriched.filter(p => p.hasEmail).length,
        withInstagram:
            enriched.filter(p => p.hasInstagram).length,
        withPhone:
            enriched.filter(p => p.phone).length,
        withWebsite:
            enriched.filter(p => p.hasWebsite).length,
        contactable:
            enriched.filter(p => p.contactable).length
    };
    console.log("\n📊 Contact enrichment:");
    console.log(`Total: ${stats.total}`);
    console.log(`📧 Email: ${stats.withEmail}`);
    console.log(`📱 Instagram: ${stats.withInstagram}`);
    console.log(`📞 Phone: ${stats.withPhone}`);
    console.log(`🌐 Website: ${stats.withWebsite}`);
    console.log(`✅ Contactable: ${stats.contactable}`);
    return enriched;
}