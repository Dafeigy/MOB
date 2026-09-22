"use client"

import Link, { useLinkStatus } from "next/link"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  useTransition,
  type ComponentProps,
  type ReactNode,
  type TransitionStartFunction,
} from "react"

const NavigationContext = createContext<{
  setLinkPending: (id: string, pending: boolean) => void
  startNavigation: TransitionStartFunction
} | null>(null)

function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) throw new Error("NavigationProgressProvider is required")
  return context
}

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const [pendingLinks, setPendingLinks] = useState<Set<string>>(() => new Set())
  const [isPending, startNavigation] = useTransition()
  const setLinkPending = useCallback((id: string, pending: boolean) => {
    setPendingLinks((previous) => {
      if (previous.has(id) === pending) return previous
      const next = new Set(previous)
      if (pending) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])
  const context = useMemo(
    () => ({ setLinkPending, startNavigation }),
    [setLinkPending, startNavigation]
  )
  const pending = isPending || pendingLinks.size > 0

  return (
    <NavigationContext.Provider value={context}>
      {children}
      <div
        className="navigation-progress pointer-events-none fixed inset-x-0 bottom-0 z-[100] h-0.5 bg-primary/10"
        data-pending={pending}
        role="progressbar"
        aria-label="页面加载中"
        aria-hidden={!pending}
      >
        <div className="navigation-progress-bar h-full origin-left bg-primary" />
      </div>
    </NavigationContext.Provider>
  )
}

function LinkPendingIndicator() {
  const { pending } = useLinkStatus()
  const { setLinkPending } = useNavigation()
  const id = useId()

  useEffect(() => {
    if (!pending) return
    setLinkPending(id, true)
    return () => setLinkPending(id, false)
  }, [id, pending, setLinkPending])

  return null
}

export function ProgressLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <LinkPendingIndicator />
    </Link>
  )
}

export function useNavigationTransition() {
  return useNavigation().startNavigation
}
