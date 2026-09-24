"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useEffect, useState } from "react"

// shadcn's Sonner integration; the notification UI and behavior come from Sonner.
function Toaster(props: ToasterProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const root = document.documentElement
    const syncTheme = () => setTheme(root.classList.contains("dark") ? "dark" : "light")
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return <Sonner position="bottom-right" theme={theme} closeButton richColors {...props} />
}

export { Toaster }
