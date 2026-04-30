"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const load_config_1 = require("./load-config");
let transporter = null;
const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            host: load_config_1.config.smtp.host,
            port: load_config_1.config.smtp.port,
            auth: { user: load_config_1.config.smtp.user, pass: load_config_1.config.smtp.pass },
        });
    }
    return transporter;
};
async function sendEmail({ to, subject, html, from = load_config_1.config.emailFrom }) {
    const message = { from, to, subject, html };
    const t = getTransporter();
    await t.sendMail(message);
}
