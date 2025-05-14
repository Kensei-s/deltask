import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Valeur initiale : lecture du localStorage ou fallback “false”
    return localStorage.theme === 'dark'
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.theme = 'dark'
    } else {
      root.classList.remove('dark')
      localStorage.theme = 'light'
    }
  }, [isDark])

  return (
    <button
      onClick={() => setIsDark(prev => !prev)}
      className="p-2 rounded-full focus:outline-none focus:ring"
      aria-label="Toggle dark mode"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
