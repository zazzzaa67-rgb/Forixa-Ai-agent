import "dotenv/config";

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

async function whatsappRequest(body) {
    if (!ACCESS_TOKEN) {
        throw new Error("WHATSAPP_ACCESS_TOKEN is missing");
    }

    if (!PHONE_NUMBER_ID) {
        throw new Error("WHATSAPP_PHONE_NUMBER_ID is missing");
    }

    const response = await fetch(
        `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
        {
            method: "POST",

            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            },

            body: JSON.stringify(body)
        }
    );

    const data = await response.json();

    console.log("📡 WhatsApp API status:", response.status);

    console.log(
        "📡 WhatsApp API response:",
        JSON.stringify(data, null, 2)
    );

    if (!response.ok) {
        throw new Error(
            data?.error?.message ||
            "WhatsApp API request failed"
        );
    }

    return data;
}


// ------------------------------------
// Send normal text message
// ------------------------------------

export async function sendWhatsAppMessage({
    to,
    message
}) {

    const data = await whatsappRequest({

        messaging_product: "whatsapp",

        recipient_type: "individual",

        to,

        type: "text",

        text: {
            preview_url: false,
            body: message
        }
    });

    return {
        success: true,
        channel: "whatsapp",
        target: to,
        messageId: data?.messages?.[0]?.id || null,
        data
    };
}


// ------------------------------------
// Send WhatsApp Template
// ------------------------------------

export async function sendWhatsAppTemplate({
    to,
    templateName,
    languageCode = "en_US",
    parameters = []
}) {

    const template = {

        name: templateName,

        language: {
            code: languageCode
        }
    };


    // Add body parameters only when needed

    if (parameters.length > 0) {

        template.components = [

            {
                type: "body",

                parameters: parameters.map(value => ({

                    type: "text",

                    text: String(value)

                }))
            }
        ];
    }


    const data = await whatsappRequest({

        messaging_product: "whatsapp",

        recipient_type: "individual",

        to,

        type: "template",

        template
    });


    return {

        success: true,

        channel: "whatsapp",

        target: to,

        messageId:
            data?.messages?.[0]?.id || null,

        data
    };
}


console.log("WhatsApp config:", {

    hasToken: Boolean(ACCESS_TOKEN),

    tokenLength: ACCESS_TOKEN?.length,

    phoneNumberId: PHONE_NUMBER_ID
});