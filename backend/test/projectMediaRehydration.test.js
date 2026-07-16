const test = require('node:test');
const assert = require('node:assert/strict');

const {
  findProjectMediaHashes,
  rehydrateProjectMedia,
} = require('../src/utils/projectMediaRehydration');

const IMAGE_HASH = 'a'.repeat(64);
const SOUND_HASH = 'B'.repeat(64);

test('findProjectMediaHashes returns unique normalized hashes', () => {
  const xml = [
    `<costume imageRef="sha256:${IMAGE_HASH}"/>`,
    `<costume imageRef='sha256:${IMAGE_HASH}'/>`,
    `<sound soundRef="sha256:${SOUND_HASH}"/>`,
  ].join('');

  assert.deepEqual(findProjectMediaHashes(xml), [IMAGE_HASH, SOUND_HASH.toLowerCase()]);
});

test('rehydrateProjectMedia restores image and sound data URI attributes', () => {
  const xml = [
    `<costume imageRef="sha256:${IMAGE_HASH}"/>`,
    `<sound soundRef='sha256:${SOUND_HASH}'/>`,
  ].join('');
  const rows = [
    { hash: IMAGE_HASH, mime_type: 'image/png', data: Buffer.from([0, 1, 2]) },
    { hash: SOUND_HASH.toLowerCase(), mime_type: 'audio/wav', data: Buffer.from([3, 4, 5]) },
  ];

  assert.equal(
    rehydrateProjectMedia(xml, rows),
    [
      '<costume image="data:image/png;base64,AAEC"/>',
      "<sound sound='data:audio/wav;base64,AwQF'/>",
    ].join(''),
  );
});

test('rehydrateProjectMedia leaves missing or unsafe media references unchanged', () => {
  const missingReference = `<costume imageRef="sha256:${IMAGE_HASH}"/>`;
  const unsafeRow = {
    hash: IMAGE_HASH,
    mime_type: 'image/png&quot; onerror=&quot;alert(1)',
    data: Buffer.from([0]),
  };

  assert.equal(rehydrateProjectMedia(missingReference, []), missingReference);
  assert.equal(rehydrateProjectMedia(missingReference, [unsafeRow]), missingReference);
});

test('non-content-addressed project XML remains unchanged', () => {
  const xml = '<costume image="data:image/png;base64,AAEC"/>';

  assert.deepEqual(findProjectMediaHashes(xml), []);
  assert.equal(rehydrateProjectMedia(xml, []), xml);
});
