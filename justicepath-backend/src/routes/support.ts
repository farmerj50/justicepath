import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'justicepath.dev.mail@gmail.com',
    pass: process.env.SMTP_PASS!, // ← create an App Password in Gmail or set your SMTP password
  },
});

router.post('/', async (req: Request, res: Response) => {
  const { name = '', email = '', subject = '', message = '', userId = '' } = req.body || {};

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required.' });
  }

  try {
    const info = await transporter.sendMail({
      from: `"JusticePath Support Bot" <${process.env.SMTP_USER || 'justicepath.dev.mail@gmail.com'}>`,
      to: 'justicepath.dev.mail@gmail.com',
      replyTo: email || undefined,
      subject: `[Support] ${subject}`,
      text:
`From: ${name || '(no name)'}
Email: ${email || '(no email)'}
User ID: ${userId || '(unknown)'}
--------------------------------------------------
${message}`,
    });

    return res.json({ ok: true, id: info.messageId });
  } catch (e: any) {
    console.error('❌ support mail error:', e);
    return res.status(500).json({ error: 'Failed to send support message.' });
  }
});

export default router;
