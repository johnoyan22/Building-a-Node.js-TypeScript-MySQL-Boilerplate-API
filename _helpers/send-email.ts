import nodemailer, { type Transporter } from 'nodemailer';
import { config } from './load-config';

let transporter: Transporter | null = null;

const getTransporter = () => {
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
  await t.sendMail(message);
}
