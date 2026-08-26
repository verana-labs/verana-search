/** ISO 3166-1 alpha-2 country code as an emoji flag (e.g. "EE" -> 🇪🇪). */
export function countryFlag(code: string): string | null {
  if (!/^[A-Za-z]{2}$/.test(code)) return null;
  const base = 0x1f1e6; // regional indicator A
  const chars = code
    .toUpperCase()
    .split("")
    .map((c) => base + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...chars);
}

/** Middle-truncates a DID for display: did:webvh:QmXy...ple.com */
export function truncateDid(did: string, head = 22, tail = 14): string {
  if (did.length <= head + tail + 3) return did;
  return `${did.slice(0, head)}...${did.slice(-tail)}`;
}
