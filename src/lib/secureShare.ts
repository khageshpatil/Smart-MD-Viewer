import { Document } from "@/lib/indexedDB";

const SHARE_FORMAT = "smart-md-share";
const SHARE_VERSION = 1;
// OWASP guidance for PBKDF2-SHA256; may be tuned if UX indicates unacceptable latency.
const PBKDF2_ITERATIONS = 600_000;

export interface SharedDocumentPayload {
  version: number;
  kind: "document";
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EncryptedShareEnvelope {
  format: typeof SHARE_FORMAT;
  version: number;
  alg: "AES-GCM";
  kdf: "PBKDF2";
  hash: "SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  compressed: boolean;
  data: string;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array) => {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary);
};

const fromBase64 = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const toBase64Url = (bytes: Uint8Array) =>
  toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const fromBase64Url = (base64Url: string) => {
  const padded = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return fromBase64(`${padded}${"=".repeat(padLength)}`);
};

const arrayBufferFromStream = async (stream: ReadableStream<Uint8Array>) => {
  const response = new Response(stream);
  return new Uint8Array(await response.arrayBuffer());
};

const tryCompress = async (bytes: Uint8Array): Promise<{ bytes: Uint8Array; compressed: boolean }> => {
  if (typeof CompressionStream === "undefined") {
    return { bytes, compressed: false };
  }

  const compressedStream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
  const compressed = await arrayBufferFromStream(compressedStream);
  if (compressed.length >= bytes.length) {
    return { bytes, compressed: false };
  }

  return { bytes: compressed, compressed: true };
};

const tryDecompress = async (bytes: Uint8Array): Promise<Uint8Array> => {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser does not support decompression for shared links.");
  }

  const decompressedStream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return arrayBufferFromStream(decompressedStream);
};

const deriveAesKey = async (passphrase: string, salt: Uint8Array, iterations: number) => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

export const serializeDocumentForShare = (doc: Document): SharedDocumentPayload => ({
  version: SHARE_VERSION,
  kind: "document",
  title: doc.title,
  content: doc.content,
  tags: doc.tags,
  isPinned: doc.isPinned,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const isSharedDocumentPayload = (value: unknown): value is SharedDocumentPayload => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<SharedDocumentPayload>;
  return (
    payload.version === SHARE_VERSION &&
    payload.kind === "document" &&
    typeof payload.title === "string" &&
    typeof payload.content === "string" &&
    Array.isArray(payload.tags) &&
    payload.tags.every((tag) => typeof tag === "string") &&
    typeof payload.isPinned === "boolean" &&
    typeof payload.createdAt === "number" &&
    typeof payload.updatedAt === "number"
  );
};

export const isEncryptedShareEnvelope = (value: unknown): value is EncryptedShareEnvelope => {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Partial<EncryptedShareEnvelope>;
  return (
    envelope.format === SHARE_FORMAT &&
    envelope.version === SHARE_VERSION &&
    envelope.alg === "AES-GCM" &&
    envelope.kdf === "PBKDF2" &&
    envelope.hash === "SHA-256" &&
    typeof envelope.iterations === "number" &&
    typeof envelope.salt === "string" &&
    typeof envelope.iv === "string" &&
    typeof envelope.compressed === "boolean" &&
    typeof envelope.data === "string"
  );
};

export const createEncryptedShareEnvelope = async (
  doc: Document,
  passphrase: string,
): Promise<EncryptedShareEnvelope> => {
  const normalizedPassphrase = passphrase.trim();
  if (!normalizedPassphrase) {
    throw new Error("Passphrase is required.");
  }

  const payloadBytes = textEncoder.encode(JSON.stringify(serializeDocumentForShare(doc)));
  const { bytes: processedBytes, compressed } = await tryCompress(payloadBytes);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(normalizedPassphrase, salt, PBKDF2_ITERATIONS);
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, processedBytes);

  return {
    format: SHARE_FORMAT,
    version: SHARE_VERSION,
    alg: "AES-GCM",
    kdf: "PBKDF2",
    hash: "SHA-256",
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    compressed,
    data: toBase64(new Uint8Array(cipherBuffer)),
  };
};

export const decryptEncryptedShareEnvelope = async (
  envelope: EncryptedShareEnvelope,
  passphrase: string,
): Promise<SharedDocumentPayload> => {
  if (!isEncryptedShareEnvelope(envelope)) {
    throw new Error("Invalid or unsupported share payload.");
  }

  const normalizedPassphrase = passphrase.trim();
  if (!normalizedPassphrase) {
    throw new Error("Passphrase is required.");
  }

  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const encryptedData = fromBase64(envelope.data);
  const key = await deriveAesKey(normalizedPassphrase, salt, envelope.iterations);

  let decryptedBytes: Uint8Array;
  try {
    const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedData);
    decryptedBytes = new Uint8Array(decryptedBuffer);
  } catch {
    throw new Error("Decryption failed. Verify the passphrase and ensure the shared content is not corrupted.");
  }

  const dataBytes = envelope.compressed ? await tryDecompress(decryptedBytes) : decryptedBytes;
  const parsed = JSON.parse(textDecoder.decode(dataBytes));
  if (!isSharedDocumentPayload(parsed)) {
    throw new Error("Invalid shared document format.");
  }

  return parsed;
};

export const encodeEnvelopeForShareLink = (envelope: EncryptedShareEnvelope): string =>
  toBase64Url(textEncoder.encode(JSON.stringify(envelope)));

export const decodeEnvelopeFromShareLink = (payload: string): EncryptedShareEnvelope => {
  try {
    const parsed = JSON.parse(textDecoder.decode(fromBase64Url(payload)));
    if (!isEncryptedShareEnvelope(parsed)) {
      throw new Error("Invalid payload.");
    }
    return parsed;
  } catch {
    throw new Error("Malformed shared link payload.");
  }
};

export const buildSecureShareLink = (payload: string): string => {
  const baseUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  return `${baseUrl}#payload=${encodeURIComponent(payload)}`;
};

export const parsePayloadFromLocationHash = (hash: string): string | null => {
  if (!hash || !hash.startsWith("#")) return null;
  const content = hash.slice(1);
  const params = new URLSearchParams(content);
  return params.get("payload");
};

export const createEncryptedShareFileBlob = (envelope: EncryptedShareEnvelope) =>
  new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });

export const readEncryptedShareEnvelopeFromFile = async (file: File): Promise<EncryptedShareEnvelope> => {
  const content = await file.text();
  const parsed = JSON.parse(content);
  if (!isEncryptedShareEnvelope(parsed)) {
    throw new Error("Invalid .smdshare file.");
  }
  return parsed;
};
