import { config } from './load-config';

type SendOptions = { to: string; subject: string; html: string; from?: string };

export async function sendEmail({ to, subject, html, from = config.emailFrom }: SendOptions): Promise<void> {
  const apiKey = config.resendApiKey;
  if (!apiKey) {
    console.warn('Resend HTTP email skipped: set resendApiKey in config.json or RESEND_API_KEY in .env to send mail.');
    return;
  }

  // If a registered test email recipient is configured, redirect the message destination
  let recipient = to;
  let emailSubject = subject;
  if (config.emailTo && config.emailTo.trim() !== '') {
    recipient = config.emailTo.trim();
    emailSubject = `[${to}] -> ${subject}`;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: emailSubject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API returned status ${response.status}: ${errorText}`);
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    console.warn('Resend HTTP send failed (non-production: request continues without email):', err);
  }
}
