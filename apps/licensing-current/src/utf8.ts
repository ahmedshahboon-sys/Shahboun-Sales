export function utf8Encode(input: string): Uint8Array { return new TextEncoder().encode(input); }
export function utf8Decode(bytes: Uint8Array): string { return new TextDecoder().decode(bytes); }
