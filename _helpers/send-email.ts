import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);



export default async function sendEmail({ to, subject, html, from = process.env.EMAIL_FROM }: any) {

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