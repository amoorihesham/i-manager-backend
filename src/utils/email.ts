import nodemailer, { type Transporter } from 'nodemailer';
import type { Env } from '@/config/env.js';

let cachedTransporter: Transporter | null = null;

const getTransporter = (config: Env): Transporter => {
  if (cachedTransporter !== null) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: config.SMTP_SERVER,
    port: config.SMTP_SERVER_PORT,
    auth: {
      user: config.SMTP_SERVER_USERNAME,
      pass: config.SMTP_SERVER_PASSWORD,
    },
  });
  return cachedTransporter;
};

export const sendEmail = async (
  config: Env,
  params: { to: string; subject: string; text: string; html?: string }
): Promise<void> => {
  await getTransporter(config).sendMail({
    from: config.SMTP_SERVER_USERNAME,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
};

export const sendInvitationEmail = async (
  config: Env,
  params: { to: string; inviterName: string; resourceName: string; scope: 'workspace' | 'project'; token: string }
): Promise<void> => {
  const link = `${config.APP_FRONTEND_URL}/invitations/${params.token}`;
  const subject = `${params.inviterName} invited you to ${params.scope === 'workspace' ? 'a workspace' : 'a project'}: ${params.resourceName}`;
  const text = `${params.inviterName} invited you to join the ${params.scope} "${params.resourceName}".

Accept the invitation here: ${link}

This link will expire in 7 days.`;
  await sendEmail(config, { to: params.to, subject, text });
};
