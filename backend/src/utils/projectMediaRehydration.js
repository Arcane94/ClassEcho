// Reconstructs Snap media attributes that were content-addressed in trace XML.
const MEDIA_REFERENCE_PATTERN = /\b(image|sound)Ref\s*=\s*(["'])sha256:([a-fA-F0-9]{64})\2/g;
const SAFE_MIME_TYPE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9!#$^_.+-]*\/[a-zA-Z0-9][a-zA-Z0-9!#$^_.+-]*$/;

function findProjectMediaHashes(codeXml) {
  const hashes = new Set();
  const xml = String(codeXml ?? '');

  for (const match of xml.matchAll(MEDIA_REFERENCE_PATTERN)) {
    hashes.add(match[3].toLowerCase());
  }

  return [...hashes];
}

function toBase64(data) {
  if (Buffer.isBuffer(data)) {
    return data.toString('base64');
  }

  if (data instanceof Uint8Array) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('base64');
  }

  return null;
}

function rehydrateProjectMedia(codeXml, mediaRows) {
  const xml = String(codeXml ?? '');
  if (!Array.isArray(mediaRows) || mediaRows.length === 0) {
    return xml;
  }

  const mediaByHash = new Map();
  mediaRows.forEach((row) => {
    const hash = String(row?.hash ?? '').trim().toLowerCase();
    const mimeType = String(row?.mime_type ?? '').trim();
    const base64Data = toBase64(row?.data);

    if (/^[a-f0-9]{64}$/.test(hash) && SAFE_MIME_TYPE_PATTERN.test(mimeType) && base64Data !== null) {
      mediaByHash.set(hash, `data:${mimeType};base64,${base64Data}`);
    }
  });

  return xml.replace(
    MEDIA_REFERENCE_PATTERN,
    (reference, mediaType, quote, hash) => {
      const dataUri = mediaByHash.get(hash.toLowerCase());
      return dataUri ? `${mediaType}=${quote}${dataUri}${quote}` : reference;
    },
  );
}

module.exports = {
  findProjectMediaHashes,
  rehydrateProjectMedia,
};
