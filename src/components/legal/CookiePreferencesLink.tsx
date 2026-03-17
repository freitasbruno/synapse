'use client'

export function CookiePreferencesLink() {
  function reset() {
    localStorage.removeItem('synapse_cookie_consent')
    window.location.reload()
  }

  return (
    <button
      onClick={reset}
      className="transition-opacity hover:opacity-70"
      style={{ color: 'inherit', font: 'inherit' }}
    >
      Cookie Preferences
    </button>
  )
}
