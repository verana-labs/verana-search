import { getServerConfig } from '../lib/config'
import Header from './components/Header'
import SearchApp from './components/SearchApp'

// Read the environment at request time, never at build time ([SRCH-CFG-2]).
export const dynamic = 'force-dynamic'

export default function Page() {
  const config = getServerConfig()
  return (
    <div className="mx-auto w-full max-w-8xl px-4 sm:px-6">
      <Header networkLabel={config.networkLabel} />
      <SearchApp config={config} />
    </div>
  )
}
