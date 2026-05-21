"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sendEmail;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
async function sendEmail({ to, subject, html, from = process.env.EMAIL_FROM }) {
    // Since you don't have a verified domain, Resend only allows sending to your verified email.
    // We route all emails to EMAIL_TO and add the intended recipient to the subject line.
    const actualTo = process.env.EMAIL_TO || 'johnoyan231@gmail.com';
    const modifiedSubject = `[${to}] -> ${subject}`;
    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: actualTo,
        subject: modifiedSubject,
        html
    });
    if (error) {
        return console.error({ error });
    }
    console.log({ data });
}
