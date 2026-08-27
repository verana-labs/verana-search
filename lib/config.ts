/**
 * Runtime configuration, per [SRCH-CFG-1] / [SRCH-CFG-2] of the Verana Search spec (verana-spec/v4/verana-search).
 *
 * Read server-side from the environment at request time (the page is
 * force-dynamic), never baked at build time, so the same container image
 * serves any network by changing only its environment.
 */

export type AppConfig = {
  graphBaseUrl: string
  resolverBaseUrl: string
  networkLabel: string
}

const DEFAULTS = {
  GRAPH_BASE_URL: 'https://graph.devnet.verana.network',
  RESOLVER_BASE_URL: 'https://idx.devnet.verana.network',
  NETWORK_LABEL: 'Devnet',
}

function requireUrl(name: string, value: string): string {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${name} is not a valid URL: "${value}"`)
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${name} must be http(s): "${value}"`)
  }
  // Normalize: no trailing slash.
  return value.replace(/\/+$/, '')
}

/** Reads and validates the configuration. Throws on invalid values. */
export function getServerConfig(): AppConfig {
  return {
    graphBaseUrl: requireUrl('GRAPH_BASE_URL', process.env.GRAPH_BASE_URL ?? DEFAULTS.GRAPH_BASE_URL),
    resolverBaseUrl: requireUrl('RESOLVER_BASE_URL', process.env.RESOLVER_BASE_URL ?? DEFAULTS.RESOLVER_BASE_URL),
    networkLabel: process.env.NETWORK_LABEL ?? DEFAULTS.NETWORK_LABEL,
  }
}
