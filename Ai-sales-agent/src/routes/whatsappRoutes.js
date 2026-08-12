import express from "express";

const router = express.Router();

// Meta Webhook verification
router.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
        mode === "subscribe" &&
        token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
        console.log("✅ WhatsApp Webhook verified");
        return res.status(200).send(challenge);
    }

    console.log("❌ WhatsApp Webhook verification failed");
    return res.sendStatus(403);
});

// Receive WhatsApp events
router.post("/webhook", (req, res) => {
    console.log("📩 WhatsApp webhook received:");
    console.log(JSON.stringify(req.body, null, 2));

    // هنضيف هنا معالجة رسائل العملاء بعد ما نتأكد إن الـWebhook شغال

    res.sendStatus(200);
});

export default router;