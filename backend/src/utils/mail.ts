import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { logger } from './logger';

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@trigonlinks.com';
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';

let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;
if (EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  transporter.verify((error) => {
    if (error) {
      logger.error('Email transporter verification failed:', error);
      transporter = null;
    } else {
      logger.info('Email transporter configured successfully.');
    }
  });
} else {
  logger.warn('Email service is not fully configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS.');
}

export const isEmailConfigured = (): boolean => Boolean(transporter);

export const sendEmail = async (options: nodemailer.SendMailOptions) => {
  if (!transporter) {
    throw new Error('Email service is not configured');
  }

  return transporter.sendMail({
    from: EMAIL_FROM,
    ...options,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  if (!transporter) {
    throw new Error('Email service is not configured');
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

  const html = `
    <p>Hello,</p>
    <p>We received a request to reset your TRIGONLINKS account password. Click the link below to reset it:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>If you did not request this, you can safely ignore this email.</p>
    <p>Thanks,<br/>TRIGONLINKS Support</p>
  `;

  await sendEmail({
    to: email,
    subject: 'TRIGONLINKS Password Reset Request',
    html,
    text: `Use this link to reset your password: ${resetLink}`,
  });
};
