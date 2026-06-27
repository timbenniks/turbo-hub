"use client"

import * as React from "react"

export type Theme = "light" | "dark" | "system"
type Resolved = "light" | "dark"

const STORAGE_KEY = "theme"

/**
 * Inline, render-blocking script that sets the `dark` class before first paint
 * to prevent a flash. Rendered once in the server `<head>` (see app/layout.tsx),
 * never on the client — which keeps React 19 from warning about client-rendered
 * <script> tags (the reason we don't use next-themes' in-component script).
 */
export const themeScript = `(function(){try{var e=localStorage.getItem('${STORAGE_KEY}')||'light';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',e==='dark'||(e==='system'&&m));}catch(e){}})();`

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: Resolved
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === "dark" || stored === "light" || stored === "system"
    ? stored
    : "light"
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initial theme is already applied to <html> by the head script; reading it
  // here keeps React in sync without re-applying (so no flash).
  const [theme, setThemeState] = React.useState<Theme>(readStoredTheme)
  const [systemDark, setSystemDark] = React.useState<boolean>(systemPrefersDark)

  const resolvedTheme: Resolved =
    theme === "system" ? (systemDark ? "dark" : "light") : theme

  // Track OS preference changes (setState only happens in the change handler).
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // Reflect the resolved theme on <html>.
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark")
  }, [resolvedTheme])

  const setTheme = React.useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Ignore storage failures (private mode, etc.).
    }
    setThemeState(next)
  }, [])

  // `d` toggles light/dark (skips when typing in a field).
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "d") return
      if (isTypingTarget(event.target)) return
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [resolvedTheme, setTheme])

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
