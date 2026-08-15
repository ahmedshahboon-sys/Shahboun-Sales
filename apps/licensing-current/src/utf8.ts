export function utf8Encode(input: string): Uint8Array {
  const escaped = unescape(encodeURIComponent(input));
  const out = new Uint8Array(escaped.length);
  for (let i = 0; i < escaped.length; i += 1) out[i] = escaped.charCodeAt(i);
  return out;
}

export function utf8Decode(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return decodeURIComponent(escape(binary));
}
