"use client"

import { createContext, createElement, useContext, type ComponentType, type ComponentProps } from "react"

export type NavigationLinkProps = ComponentProps<"a"> & { href: string }
export const NavigationLinkContext = createContext<ComponentType<NavigationLinkProps>>(
  function PlainLink(props) { return <a {...props} /> }
)

export function NavigationLink(props: NavigationLinkProps) {
  const Link = useContext(NavigationLinkContext)
  return createElement(Link, props)
}
