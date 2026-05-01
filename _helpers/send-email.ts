import nodemailer, { type Transporter } from 'nodemailer';
import { config } from './load-config';

let transporter: Transporter | null = null;

const smtpConfigured = () =>
  typeof config.smtp.user === 'string' &&
  config.smtp.user.length > 0 &&
  typeof config.smtp.pass === 'string' &&
  config.smtp.pass.length > 0;

const getTransporter = () => {
  if (!smtpConfigured()) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
};

type SendOptions = { to: string; subject: string; html: string; from?: string };

export async function sendEmail({ to, subject, html, from = config.emailFrom }: SendOptions): Promise<void> {
  const message = { from, to, subject, html };
  const t = getTransporter();
  if (!t) {
    console.warn('SMTP skipped: set smtp.user and smtp.pass in config.json to send mail.');
    return;
  }
  try {
    await t.sendMail(message);
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    console.warn('SMTP send failed (non-production: request continues without email):', err);
  }
}
