import { getGmailClient } from "./googleAuth.js";
export async function sendEmail({
    to,
    subject,
    text,
    threadId,
    inReplyTo
}) {

    const gmail = getGmailClient();

    const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        inReplyTo
            ? `In-Reply-To: ${inReplyTo}`
            : "",
        inReplyTo
            ? `References: ${inReplyTo}`
            : "",
        "Content-Type: text/plain; charset=utf-8",
        "",
        text
    ]
        .filter(Boolean)
        .join("\r\n");
    const encodedMessage =
        Buffer
            .from(email)
            .toString("base64url");
    const requestBody = {
        raw: encodedMessage
    };
    if (threadId) {
        requestBody.threadId = threadId;
    }
    const response =
        await gmail.users.messages.send({
            userId: "me",
            requestBody
        });
    console.log(
        `📧 Email sent to ${to}`
    );
    return response.data;
}
