import type { User } from '@supabase/supabase-js'
import { hrefFor } from '../hooks/useHashRoute'

export function AppHeader({ route, user, isDemo, onSignOut }: { route: string; user: User | null; isDemo: boolean; onSignOut: () => void }) {
  return (
    <header className="topbar">
      <a href={hrefFor('/')} className="brand">TRAVEL ARCHIVE</a>
      <nav className="navlinks" aria-label="Main navigation">
        <a className={route === '/' ? 'is-current' : ''} href={hrefFor('/')}>Map</a>
        <a className={route === '/timeline' ? 'is-current' : ''} href={hrefFor('/timeline')}>Timeline</a>
        <a className={route === '/trip/new' ? 'is-current' : ''} href={hrefFor('/trip/new')}>Add trip</a>
      </nav>
      <div className="account-area">
        {isDemo ? <span className="demo-badge">DEMO</span> : user ? (
          <button className="account-button" type="button" onClick={onSignOut} title="Sign out">
            {(user.email?.[0] ?? 'K').toUpperCase()}
          </button>
        ) : <span className="avatar">K</span>}
      </div>
    </header>
  )
}
