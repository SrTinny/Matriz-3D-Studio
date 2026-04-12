import nodemailer from 'nodemailer';
import { env } from './env';

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

export async function sendActivationEmail(params: {
  to: string;
  name: string;
  token: string;
  activationUrl: string;
}) {
  const fromAddress = env.smtpFrom || env.smtpUser;
  const subject = 'Ative sua conta na Matriz 3D Studio';
  const text = [
    `Olá, ${params.name}.`,
    '',
    'Sua conta foi criada com sucesso.',
    'Use o token abaixo para ativar a conta no cadastro:',
    params.token,
    '',
    `Link de apoio: ${params.activationUrl}`,
    '',
    `Esse token expira em ${env.activationTokenHours} horas.`,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 16px;">Ative sua conta</h2>
      <p>Olá, <strong>${params.name}</strong>.</p>
      <p>Sua conta foi criada com sucesso. Use o token abaixo para validar seu cadastro:</p>
      <div style="padding: 12px 16px; margin: 16px 0; background: #f3f4f6; border-radius: 10px; font-size: 18px; font-weight: 700; letter-spacing: 1px;">
        ${params.token}
      </div>
      <p>
        Você também pode abrir o link abaixo para acessar a página de validação:
        <br />
        <a href="${params.activationUrl}">${params.activationUrl}</a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">Esse token expira em ${env.activationTokenHours} horas.</p>
    </div>
  `;

  return transporter.sendMail({
    from: `"${env.smtpFromName}" <${fromAddress}>`,
    to: params.to,
    subject,
    text,
    html,
  });
}