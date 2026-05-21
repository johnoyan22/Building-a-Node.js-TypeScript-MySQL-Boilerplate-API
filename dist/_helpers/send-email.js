"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sendEmail;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
async function sendEmail({ to, subject, html, from = process.env.EMAIL_FROM }) {
    const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html
    });
    if (error) {
        return console.error({ error });
    }
    console.log({ data });
}
