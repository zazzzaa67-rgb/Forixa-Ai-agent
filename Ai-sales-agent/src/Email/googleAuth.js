import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send"
];

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:5000/api/email/oauth2callback"
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
}

export function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent"
    });
}

export async function getTokensFromCode(code) {
    const { tokens } = await oauth2Client.getToken(code);

    return tokens;
}

export function setCredentials(tokens) {
    oauth2Client.setCredentials(tokens);
}

export function getGmailClient() {
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
        throw new Error("GOOGLE_REFRESH_TOKEN is missing");
    }

    return google.gmail({
        version: "v1",
        auth: oauth2Client
    });
}