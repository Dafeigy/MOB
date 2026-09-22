"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type Theme = "light" | "dark" | "system"

const themes = [
  { value: "light", label: "浅色", icon: SunIcon },
  { value: "dark", label: "深色", icon: MoonIcon },
  { value: "system", label: "跟随系统", icon: MonitorIcon },
] as const

const subscribeToHydration = () => () => {}

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  document.documentElement.classList.toggle("dark", isDark)
  document.documentElement.style.colorScheme = isDark ? "dark" : "light"
}

export function ThemeToggle() {
  const mounted = useSyncExternalStore(subscribeToHydration, () => true, () => false)
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system"
    const saved = window.localStorage.getItem("theme")
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system"
  })

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemChange = () => {
      if (theme === "system") applyTheme("system")
    }

    applyTheme(theme)
    media.addEventListener("change", handleSystemChange)
    return () => media.removeEventListener("change", handleSystemChange)
  }, [theme])

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme)
    window.localStorage.setItem("theme", nextTheme)
    applyTheme(nextTheme)
  }

  const ActiveIcon = mounted
    ? (themes.find((item) => item.value === theme)?.icon ?? MonitorIcon)
    : MonitorIcon

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 cursor-pointer rounded-xl"
                  aria-label="切换界面主题"
                />
              }
            />
          }
        >
          <ActiveIcon className="size-4.5" />
        </TooltipTrigger>
        <TooltipContent side="bottom">切换主题</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>界面主题</DropdownMenuLabel>
          {themes.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => selectTheme(value)}
              className="cursor-pointer"
            >
              <Icon />
              <span>{label}</span>
              {theme === value ? <CheckIcon className="ml-auto" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
