import { useEffect, useState } from 'react'

function currentRoute() {
  const raw = window.location.hash.replace(/^#/, '')
  return raw.startsWith('/') ? raw : '/'
}

export function useHashRoute() {
  const [route, setRoute] = useState(currentRoute)

  useEffect(() => {
    const listener = () => setRoute(currentRoute())
    window.addEventListener('hashchange', listener)
    return () => window.removeEventListener('hashchange', listener)
  }, [])

  return route
}

export function hrefFor(path: string) {
  return `#${path}`
}

export function navigate(path: string) {
  window.location.hash = path
}
