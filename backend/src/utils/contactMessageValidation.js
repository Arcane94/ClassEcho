const CONTACT_RECIPIENT_KEYS = new Set(['lab', 'ally_limke', 'yasitha_rajapaksha']);
const MAX_CONTACT_MESSAGE_LENGTH = 5000;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactMessage(payload) {
  const body = payload && typeof payload === 'object' ? payload : {};
  const honeypot = String(body.website ?? '').trim();
  if (honeypot) {
    return { isBot: true, error: null, value: null };
  }

  if (!Array.isArray(body.recipients)) {
    return { isBot: false, error: 'Select at least one recipient.', value: null };
  }

  const recipients = [...new Set(
    body.recipients.map((recipient) => String(recipient ?? '').trim()).filter(Boolean),
  )];

  if (recipients.length === 0) {
    return { isBot: false, error: 'Select at least one recipient.', value: null };
  }

  if (recipients.some((recipient) => !CONTACT_RECIPIENT_KEYS.has(recipient))) {
    return { isBot: false, error: 'Invalid contact recipient selection.', value: null };
  }

  const senderEmail = String(body.senderEmail ?? '').trim();
  if (!senderEmail || senderEmail.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(senderEmail)) {
    return { isBot: false, error: 'Enter a valid email address.', value: null };
  }

  const message = String(body.message ?? '').trim();
  if (!message) {
    return { isBot: false, error: 'Enter a message.', value: null };
  }

  if (message.length > MAX_CONTACT_MESSAGE_LENGTH) {
    return {
      isBot: false,
      error: `Message must be ${MAX_CONTACT_MESSAGE_LENGTH.toLocaleString('en-US')} characters or fewer.`,
      value: null,
    };
  }

  return {
    isBot: false,
    error: null,
    value: { recipients, senderEmail, message },
  };
}

module.exports = {
  CONTACT_RECIPIENT_KEYS,
  MAX_CONTACT_MESSAGE_LENGTH,
  validateContactMessage,
};
