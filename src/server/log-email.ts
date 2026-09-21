import "server-only";

import { Resend } from "resend";

const LOG_EMAIL_FROM = "Cherry Tree <logs@cherrytree.website>";
const LOG_EMAIL_SUBJECT = "New log added to CherryTree";

export async function sendLogEmail(message: string): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.LOG_EMAIL_TO;
    if (!apiKey || !to) {
      console.error(
        "Failed to send log email: RESEND_API_KEY and LOG_EMAIL_TO environment variables are required.",
      );
      return;
    }

    const { error } = await new Resend(apiKey).emails.send({
      from: LOG_EMAIL_FROM,
      to,
      subject: LOG_EMAIL_SUBJECT,
      text: message,
    });
    if (error) {
      console.error("Failed to send log email through Resend.", error);
    }
  } catch (error: unknown) {
    console.error("Failed to send log email through Resend.", error);
  }
}
