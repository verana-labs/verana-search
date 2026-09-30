'use client'

import { useState } from 'react'

/** Square logo with a letter fallback, shared by the result rows. */
export default function Logo({
  uri,
  alt,
  size,
  fallback,
}: {
  uri: string | null
  alt: string
  size: string
  fallback: string
}) {
  const [broken, setBroken] = useState(false)
  if (!uri || broken) {
    return (
      <span
        aria-hidden
        className={`${size} shrink-0 rounded-lg bg-surface-2 border border-rule flex items-center justify-center display text-muted`}
      >
        {fallback}
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={uri}
      alt={alt}
      className={`${size} shrink-0 rounded-lg object-cover bg-surface-2`}
      onError={() => setBroken(true)}
    />
  )
}
