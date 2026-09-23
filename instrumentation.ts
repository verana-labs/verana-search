import { getServerConfig } from './lib/config'

export function register(): void {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  try {
    console.log(`Resolved configuration: ${JSON.stringify(getServerConfig())}`)
  } catch (e) {
    console.error(`Invalid configuration: ${(e as Error).message}`)
    process.exit(1)
  }
}
