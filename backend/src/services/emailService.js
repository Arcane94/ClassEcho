// Shared SMTP configuration and transporter used by outbound ClassEcho email flows.
const nodemailer = require('nodemailer');
const config = require('../config/appConfig');

function getEmailConfig() {
  return {
    service: process.env.EMAIL_SERVICE || config.email?.service || 'gmail',
    host: process.env.SMTP_HOST || config.email?.host,
    port: Number(process.env.SMTP_PORT || config.email?.port || 587),
    secure: String(process.env.SMTP_SECURE || config.email?.secure || 'false') === 'true',
    user: process.env.EMAIL_USER || config.email?.user,
    pass: process.env.EMAIL_APP_PASSWORD || config.email?.appPassword,
    from: process.env.EMAIL_FROM || config.email?.from || process.env.EMAIL_USER || config.email?.user,
  };
}

function createEmailTransporter() {
  const emailConfig = getEmailConfig();
  if (!emailConfig.user || !emailConfig.pass) {
    throw new Error('Email credentials are missing. Set EMAIL_USER and EMAIL_APP_PASSWORD.');
  }

  if (emailConfig.host) {
    return nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });
  }

  return nodemailer.createTransport({
    service: emailConfig.service,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass,
    },
  });
}

module.exports = {
  createEmailTransporter,
  getEmailConfig,
};
