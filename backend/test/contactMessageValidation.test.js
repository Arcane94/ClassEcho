const test = require('node:test');
const assert = require('node:assert/strict');

const {
  MAX_CONTACT_MESSAGE_LENGTH,
  validateContactMessage,
} = require('../src/utils/contactMessageValidation');

test('accepts and deduplicates valid contact recipient combinations', () => {
  const result = validateContactMessage({
    recipients: ['lab', 'ally_limke', 'lab'],
    senderEmail: 'sender@example.com',
    message: 'Please contact me about ClassEcho.',
    website: '',
  });

  assert.equal(result.error, null);
  assert.equal(result.isBot, false);
  assert.deepEqual(result.value, {
    recipients: ['lab', 'ally_limke'],
    senderEmail: 'sender@example.com',
    message: 'Please contact me about ClassEcho.',
  });
});

test('rejects missing and unknown recipients', () => {
  const basePayload = { senderEmail: 'sender@example.com', message: 'Hello' };

  assert.equal(validateContactMessage({ ...basePayload, recipients: [] }).error, 'Select at least one recipient.');
  assert.equal(
    validateContactMessage({ ...basePayload, recipients: ['unknown'] }).error,
    'Invalid contact recipient selection.',
  );
});

test('rejects invalid sender emails and oversized messages', () => {
  assert.equal(
    validateContactMessage({ recipients: ['lab'], senderEmail: 'invalid', message: 'Hello' }).error,
    'Enter a valid email address.',
  );
  assert.match(
    validateContactMessage({
      recipients: ['lab'],
      senderEmail: 'sender@example.com',
      message: 'x'.repeat(MAX_CONTACT_MESSAGE_LENGTH + 1),
    }).error,
    /characters or fewer/,
  );
});

test('silently identifies honeypot submissions', () => {
  const result = validateContactMessage({ website: 'https://spam.example' });

  assert.equal(result.isBot, true);
  assert.equal(result.error, null);
  assert.equal(result.value, null);
});
