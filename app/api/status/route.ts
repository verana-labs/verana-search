import { getServerConfig } from '../../../lib/config'

// Live upstream status for the header network chip (playground pattern):
// green when the graph answers, red when it does not. Checked server-side
// so the chip reflects reality, never a hardcoded state.
export const dynamic = 'force-dynamic'

export async function GET() {
  let graph: 'ok' | 'down' = 'down'
  try {
    const config = getServerConfig()
    const res = await fetch(`${config.graphBaseUrl}/v4/graph/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surface: 'Did', limit: 1 }),
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    })
    if (res.ok) graph = 'ok'
  } catch {
    // graph stays "down"
  }
  return Response.json({ graph })
}
