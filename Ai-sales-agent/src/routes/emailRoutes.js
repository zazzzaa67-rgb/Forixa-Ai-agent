import express from "express";
import {
    getAuthUrl,
    getTokensFromCode,
    setCredentials
} from "../Email/googleAuth.js";
import { sendEmail } from "../Email/emailService.js";
const router = express.Router();

router.get("/auth", (req, res) => {
    const url = getAuthUrl();

    res.redirect(url);
});

router.get("/oauth2callback", async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).send("Authorization code missing");
        }

        const tokens = await getTokensFromCode(code);

        console.log("✅ Google OAuth successful");
        console.log("Refresh token:", tokens.refresh_token);

        setCredentials(tokens);

        res.send("✅ Gmail authorization successful! You can close this page.");
    } catch (error) {
        console.error("OAuth Error:", error);

        res.status(500).send("❌ Gmail authorization failed");
    }
});
router.post("/test-send", async (req, res) => {

    try {

        const { to } = req.body;

        if (!to) {
            return res.status(400).json({
                error: "Recipient email is required"
            });
        }

        const result = await sendEmail({
            to,
            subject: "FORIXA AI Sales Agent Test",
            text: "Hello! This is a test email sent by the FORIXA AI Sales Agent."
        });

        res.json({
            success: true,
            message: "Email sent successfully",
            id: result.id
        });

    } catch (error) {

        console.error("Email Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
export default router;