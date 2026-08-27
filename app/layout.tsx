import { config } from '@fortawesome/fontawesome-svg-core'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Inter, Space_Grotesk } from 'next/font/google'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './globals.css'

// Font Awesome: CSS is imported above, stop the runtime from re-injecting it.
config.autoAddCss = false

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VeranaGraph',
  description: 'Search the Verana trust graph: verifiable services, ecosystems, corporations, credential schemas.',
  applicationName: 'VeranaGraph',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b12' },
  ],
}

// Set the theme before paint: stored choice, else follow the OS, falling back
// to dark (same mechanism as verana.io-website, per [SRCH-DS-1]).
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('verana-theme');
    var theme = stored
      || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-bg text-ink min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
