import { useState, type FormEvent } from 'react'
import { getSupabase } from '../lib/supabase/client'

export function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const supabase = getSupabase()
    if (!supabase || !email) return
    setBusy(true)
    setError(null)
    const redirectRoot = `${window.location.origin}${window.location.pathname}`
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectRoot },
    })
    setBusy(false)
    if (authError) setError(authError.message)
    else setSent(true)
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="section-kicker">Private travel archive</p>
        <h1>TRAVEL<br />ARCHIVE</h1>
        <p className="auth-copy">PCとスマホで同じ旅の記録を使うため、メールでログインします。</p>
        {sent ? (
          <div className="auth-sent">
            <strong>メールを送りました。</strong>
            <p>{email} に届いたリンクを、この端末で開いてください。</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label className="stacked-field">
              <span>Email</span>
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button auth-button" type="submit" disabled={busy}>{busy ? 'Sending…' : 'メールでログイン'}</button>
          </form>
        )}
      </section>
    </main>
  )
}
