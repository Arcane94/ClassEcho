// Sends public contact-form messages without exposing recipient email addresses to the browser.
const config = require('../config/appConfig');
const { createEmailTransporter, getEmailConfig } = require('../services/emailService');
const { validateContactMessage } = require('../utils/contactMessageValidation');

const CONTACT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const CONTACT_RATE_LIMIT_MAX = 5;
const contactRequestCounts = new Map();

const RECIPIENT_LABELS = {
  lab: 'Game2Learn Lab',
  ally_limke: 'Dr. Ally Limke',
  yasitha_rajapaksha: 'Yasitha Rajapaksha',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function consumeContactRateLimit(clientKey) {
  const now = Date.now();
  const current = contactRequestCounts.get(clientKey);

  if (!current || current.resetAt <= now) {
    contactRequestCounts.set(clientKey, { count: 1, resetAt: now + CONTACT_RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= CONTACT_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function getConfiguredRecipients() {
  const configuredRecipients = config.contact?.recipients ?? {};
  return {
    lab: configuredRecipients.lab,
    ally_limke: configuredRecipients.allyLimke,
    yasitha_rajapaksha: configuredRecipients.yasithaRajapaksha,
  };
}

exports.sendContactMessage = async (req, res) => {
  const clientKey = req.ip || req.socket?.remoteAddress || 'unknown';
  const rateLimit = consumeContactRateLimit(clientKey);
  if (!rateLimit.allowed) {
    res.set('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'Too many contact requests. Please try again later.' });
  }

  const validation = validateContactMessage(req.body);
  if (validation.isBot) {
    return res.json({ message: 'Your message has been sent.' });
  }

  if (validation.error || !validation.value) {
    return res.status(400).json({ error: validation.error || 'Invalid contact message.' });
  }

  const configuredRecipients = getConfiguredRecipients();
  const recipientAddresses = validation.value.recipients.map(
    (recipientKey) => configuredRecipients[recipientKey],
  );

  if (recipientAddresses.some((address) => !address || !String(address).trim())) {
    console.error('Contact form recipient configuration is incomplete.');
    return res.status(503).json({ error: 'The contact form is temporarily unavailable.' });
  }

  const selectedLabels = validation.value.recipients.map(
    (recipientKey) => RECIPIENT_LABELS[recipientKey],
  );

  try {
    const transporter = createEmailTransporter();
    const emailConfig = getEmailConfig();
    const plainText = [
      'A new message was submitted through the ClassEcho contact form.',
      '',
      `From: ${validation.value.senderEmail}`,
      `Selected recipients: ${selectedLabels.join(', ')}`,
      '',
      validation.value.message,
    ].join('\n');

    await transporter.sendMail({
      from: emailConfig.from,
      to: recipientAddresses.map((address) => String(address).trim()),
      replyTo: validation.value.senderEmail,
      subject: 'ClassEcho contact form message',
      text: plainText,
      html: [
        '<p>A new message was submitted through the ClassEcho contact form.</p>',
        `<p><strong>From:</strong> ${escapeHtml(validation.value.senderEmail)}</p>`,
        `<p><strong>Selected recipients:</strong> ${escapeHtml(selectedLabels.join(', '))}</p>`,
        `<p>${escapeHtml(validation.value.message).replaceAll('\n', '<br>')}</p>`,
      ].join(''),
    });

    return res.json({ message: 'Your message has been sent.' });
  } catch (error) {
    console.error('Error sending contact form message:', error);
    return res.status(500).json({ error: 'Failed to send your message. Please try again later.' });
  }
};
