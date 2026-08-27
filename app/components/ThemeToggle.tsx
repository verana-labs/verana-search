'use client'

import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null)

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') ?? 'dark')
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('verana-theme', next)
    } catch {
      // storage unavailable: theme still applies for this page view
    }
    setTheme(next)
  }

  return (
    <button type="button" onClick={toggle} className="btn btn-ghost !p-2.5" aria-label="Toggle color theme">
      <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} className="h-4 w-4" />
    </button>
  )
}
