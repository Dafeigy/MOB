"use client"

import { createContext, useContext } from "react"

export type InventoryForm = Record<string, unknown>
export type InventoryActions = {
  createComponent: (data: InventoryForm) => Promise<void>
  updateComponent: (id: string, data: InventoryForm) => Promise<void>
  deleteComponent: (id: string) => Promise<void>
  createMovement: (data: InventoryForm) => Promise<void>
  setStockQuantity: (id: string, quantity: number, note: string) => Promise<void>
  createStorageBox: (id: string, label: string, subtitle: string) => Promise<void>
  updateStorageBox: (id: string, label: string, subtitle: string) => Promise<void>
  deleteStorageBox: (id: string) => Promise<void>
}

export const InventoryActionsContext = createContext<InventoryActions | null>(null)

export function useInventoryActions() {
  const actions = useContext(InventoryActionsContext)
  if (!actions) throw new Error("Inventory actions provider is missing")
  return actions
}

export function actionError(error: unknown) {
  return error instanceof Error ? error.message : typeof error === "string" ? error : "操作失败，请重试。"
}
