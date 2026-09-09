import { AppHeader } from './components/AppHeader'
import { MapExperience } from './components/MapExperience'
import { NewTripPage } from './components/NewTripPage'
import { SignIn } from './components/SignIn'
import { TimelinePage } from './components/TimelinePage'
import { useHashRoute } from './hooks/useHashRoute'
import { useTravelArchive } from './hooks/useTravelArchive'

export function App() {
  const route = useHashRoute()
  const archive = useTravelArchive()

  if (archive.authRequired) return <SignIn />

  return (
    <main className={route === '/' ? 'shell' : 'shell shell--content'}>
      <AppHeader route={route} user={archive.user} isDemo={archive.isDemo} onSignOut={() => void archive.signOut()} />
      {archive.error && <div className="global-error">{archive.error}</div>}
      {archive.isDemo && <div className="demo-notice">DEMO DATA — Supabaseを設定するとPC・スマホで同期します。</div>}

      {route === '/timeline' ? (
        <TimelinePage categories={archive.categories} trips={archive.trips} />
      ) : route === '/trip/new' ? (
        <NewTripPage categories={archive.categories} onAddTrip={archive.addTrip} isDemo={archive.isDemo} />
      ) : (
        <MapExperience categories={archive.categories} trips={archive.trips} loading={archive.loading} />
      )}
    </main>
  )
}
