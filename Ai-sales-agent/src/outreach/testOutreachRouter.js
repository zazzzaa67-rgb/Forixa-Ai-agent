import {
    routeProspects,
    getContactableProspects
} from "./outreachRouter.js";

const prospects = [
    {
        name: "Restaurant A",
        email: "hello@restaurant-a.com",
        phone: "+123456789"
    },

    {
        name: "Restaurant B",
        instagram: "https://instagram.com/restaurantb"
    },

    {
        name: "Restaurant C",
        phone: "+123456789",
        whatsapp: true
    },

    {
        name: "Restaurant D",
        phone: "+123456789"
    },

    {
        name: "Restaurant E"
    }
];

console.log("\n📡 OUTREACH ROUTING\n");

const routed = routeProspects(prospects);

for (const prospect of routed) {
    console.log({
        name: prospect.name,
        channel: prospect.outreach.channel,
        target: prospect.outreach.target,
        contactable: prospect.outreach.contactable,
        reason: prospect.outreach.reason
    });
}

console.log("\n📊 CONTACTABLE:", getContactableProspects(prospects).length);