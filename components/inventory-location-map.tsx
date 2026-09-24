"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { BoxIcon, ChevronLeftIcon, ChevronRightIcon, MapPinIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddComponentDialog } from "@/components/add-component-dialog"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useInventoryActions } from "@/components/inventory-actions"
import { cn } from "@/lib/utils"
import type { ComponentItem, StorageBox } from "@/lib/inventory-types"

type BoxDefinition = StorageBox
type ParsedLocation = { boxId: string; x: number; y: number }
type Cell = { x: number; y: number }

const DEFAULT_BOXES: BoxDefinition[] = [
  { id: "A", label: "盒 01", subtitle: "电阻 / 电容", created_at: "", updated_at: "" },
  { id: "B", label: "盒 02", subtitle: "二极管 / 连接器", created_at: "", updated_at: "" },
  { id: "C", label: "盒 03", subtitle: "芯片 / 模块", created_at: "", updated_at: "" },
]

function parseLocation(location: string): ParsedLocation | null {
  const match = location.trim().match(/^([^,\s-]+)[,\s-]+(\d+)[,\s-]+(\d+)$/)
  if (!match) return null
  const x = Number(match[2])
  const y = Number(match[3])
  if (x < 1 || x > 8 || y < 1 || y > 7) return null
  return { boxId: match[1].toUpperCase(), x, y }
}

function getThemeColors() {
  const dark = document.documentElement.classList.contains("dark")
  return dark
    ? { background: 0x1c2025, top: 0x424a54, side: 0x303740, border: 0x7a838d, slot: 0x3c444e, occupied: 0x86b83d, accent: 0x858d96, edge: 0x9aa2aa, floor: 0x11151a }
    : { background: 0xfafafa, top: 0xe1e5e8, side: 0xc5cbd1, border: 0x68727d, slot: 0xf3f4f5, occupied: 0xb7e36a, accent: 0x858d96, edge: 0x5f6974, floor: 0xdfe3e6 }
}

function setMaterialColor(mesh: THREE.Mesh, color: number) {
  const material = mesh.material as THREE.MeshBasicMaterial
  material.color.setHex(color)
}

function ThreeStorageScene({ box, locations, selectedCell, onSelect, onHover }: { box: BoxDefinition; locations: Map<string, ComponentItem[]>; selectedCell: Cell | null; onSelect: (cell: Cell | null) => void; onHover: (cell: Cell | null) => void }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef(selectedCell)
  const onSelectRef = useRef(onSelect)
  const onHoverRef = useRef(onHover)

  useEffect(() => {
    selectedRef.current = selectedCell
    onSelectRef.current = onSelect
    onHoverRef.current = onHover
  }, [onHover, onSelect, selectedCell])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return
    let colors = getThemeColors()
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(colors.background)
    // An orthographic camera keeps parallel edges parallel, which is the key
    // visual characteristic of an isometric storage layout.
    const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 100)
    camera.position.set(10, 10, 10)
    camera.zoom = 1.05
    camera.lookAt(0, 0, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(colors.background, 1)
    container.appendChild(renderer.domElement)
    renderer.domElement.className = "size-full cursor-grab active:cursor-grabbing"

    const group = new THREE.Group()
    group.rotation.x = 0
    group.rotation.y = -0.08
    group.position.y = 2.2
    scene.add(group)

    const baseGeometry = new THREE.BoxGeometry(9.3, 0.5, 8.3)
    const base = new THREE.Mesh(baseGeometry, [
      new THREE.MeshBasicMaterial({ color: colors.side }),
      new THREE.MeshBasicMaterial({ color: colors.side }),
      new THREE.MeshBasicMaterial({ color: colors.top }),
      new THREE.MeshBasicMaterial({ color: colors.side }),
      new THREE.MeshBasicMaterial({ color: colors.side }),
      new THREE.MeshBasicMaterial({ color: colors.side }),
    ])
    base.userData.themeRole = "base"
    base.position.y = -0.28
    group.add(base)

    const top = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.14, 8.0), new THREE.MeshBasicMaterial({ color: colors.top }))
    top.userData.themeRole = "top"
    top.position.y = 0.03
    group.add(top)

    const rimMaterial = new THREE.MeshBasicMaterial({ color: colors.border })
    const rims = [[0, 0.23, -4.02, 9.2, 0.4, 0.18], [0, 0.23, 4.02, 9.2, 0.4, 0.18], [-4.52, 0.23, 0, 0.18, 0.4, 8.1], [4.52, 0.23, 0, 0.18, 0.4, 8.1]] as const
    for (const [x, y, z, sx, sy, sz] of rims) {
      const rim = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), rimMaterial)
      rim.userData.themeRole = "rim"
      rim.position.set(x, y, z)
      group.add(rim)
    }

    const edgeMaterial = new THREE.LineBasicMaterial({ color: colors.edge, transparent: true, opacity: 0.7 })
    const baseEdges = new THREE.LineSegments(new THREE.EdgesGeometry(baseGeometry), edgeMaterial)
    baseEdges.userData.themeRole = "edge"
    baseEdges.position.copy(base.position)
    group.add(baseEdges)

    const slotMeshes = new Map<string, THREE.Mesh>()
    for (let index = 0; index < 56; index += 1) {
      const x = (index % 8) + 1
      const y = Math.floor(index / 8) + 1
      const key = `${x}-${y}`
      const cellItems = locations.get(key) ?? []
      const slotGeometry = new THREE.BoxGeometry(0.94, 0.18, 0.86)
      const slot = new THREE.Mesh(slotGeometry, new THREE.MeshBasicMaterial({ color: cellItems.length ? colors.occupied : colors.slot }))
      slot.position.set((x - 4.5) * 1.08, 0.24, (y - 4) * 1.03)
      slot.userData.themeRole = "slot"
      slot.userData.occupied = cellItems.length > 0
      const slotEdges = new THREE.LineSegments(new THREE.EdgesGeometry(slotGeometry), edgeMaterial)
      slotEdges.userData.themeRole = "edge"
      slotEdges.position.copy(slot.position)
      group.add(slotEdges)
      slot.userData.cell = { x, y }
      group.add(slot)
      slotMeshes.set(key, slot)
    }

    let frame = 0
    let targetZoom = 1.05
    let dragging = false
    let moved = false
    let lastX = 0
    let lastY = 0
    let hoveredKey: string | null = null
    const startTime = performance.now()
    const transitionDuration = 900

    function resize() {
      const width = mountRef.current?.clientWidth ?? 0
      const height = mountRef.current?.clientHeight ?? 0
      const aspect = width / Math.max(height, 1)
      const frustumHeight = 11
      camera.left = -(frustumHeight * aspect) / 2
      camera.right = (frustumHeight * aspect) / 2
      camera.top = frustumHeight / 2
      camera.bottom = -frustumHeight / 2
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    function setHover(key: string | null) {
      if (hoveredKey === key) return
      if (hoveredKey) {
        const old = slotMeshes.get(hoveredKey)
        if (old) setMaterialColor(old, locations.has(hoveredKey) ? colors.occupied : colors.slot)
      }
      hoveredKey = key
      if (hoveredKey) {
        const next = slotMeshes.get(hoveredKey)
        if (next && hoveredKey !== `${selectedRef.current?.x}-${selectedRef.current?.y}`) setMaterialColor(next, colors.accent)
      }
    }
    function pointerCell(event: PointerEvent | MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects([...slotMeshes.values()])[0]
      return hit?.object.userData.cell as Cell | undefined
    }
    function handlePointerDown(event: PointerEvent) {
      dragging = true
      moved = false
      lastX = event.clientX
      lastY = event.clientY
      renderer.domElement.setPointerCapture(event.pointerId)
    }
    function handlePointerMove(event: PointerEvent) {
      const cell = pointerCell(event)
      setHover(cell ? `${cell.x}-${cell.y}` : null)
      onHoverRef.current(cell ?? null)
      if (!dragging) return
      const deltaX = event.clientX - lastX
      const deltaY = event.clientY - lastY
      if (Math.abs(deltaX) + Math.abs(deltaY) > 2) moved = true
      // Keep the isometric elevation fixed. Horizontal drag rotates the box
      // around its vertical axis without introducing a skewed perspective.
      group.rotation.y += deltaX * 0.004
      lastX = event.clientX
      lastY = event.clientY
    }
    function handlePointerUp(event: PointerEvent) {
      dragging = false
      renderer.domElement.releasePointerCapture(event.pointerId)
    }
    function handleClick(event: MouseEvent) {
      if (moved) return
      const cell = pointerCell(event)
      onSelectRef.current(cell ?? null)
    }
    function handleWheel(event: WheelEvent) {
      event.preventDefault()
      targetZoom = THREE.MathUtils.clamp(targetZoom - event.deltaY * 0.001, 0.72, 1.75)
    }

    renderer.domElement.addEventListener("pointerdown", handlePointerDown)
    renderer.domElement.addEventListener("pointermove", handlePointerMove)
    renderer.domElement.addEventListener("pointerup", handlePointerUp)
    renderer.domElement.addEventListener("click", handleClick)
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false })
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    function animate(now: number) {
      const elapsed = Math.min((now - startTime) / transitionDuration, 1)
      const eased = elapsed * elapsed * (3 - 2 * elapsed)
      if (elapsed < 1) {
        group.position.y = THREE.MathUtils.lerp(2.2, 0, eased)
      }
      camera.zoom = THREE.MathUtils.lerp(camera.zoom, targetZoom, 0.12)
      camera.updateProjectionMatrix()
      const selectedKey = selectedRef.current ? `${selectedRef.current.x}-${selectedRef.current.y}` : null
      for (const [key, mesh] of slotMeshes) {
        if (key === selectedKey) setMaterialColor(mesh, colors.accent)
        else if (key !== hoveredKey) setMaterialColor(mesh, locations.has(key) ? colors.occupied : colors.slot)
      }
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    const themeObserver = new MutationObserver(() => {
      colors = getThemeColors()
      scene.background = new THREE.Color(colors.background)
      renderer.setClearColor(colors.background, 1)
      scene.traverse((object) => {
        const role = object.userData.themeRole as string | undefined
        if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments) || !role) return
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        if (role === "base") {
          materials.forEach((material, index) => (material as THREE.MeshBasicMaterial).color.setHex(index === 2 ? colors.top : colors.side))
        } else if (role === "top") materials[0].color.setHex(colors.top)
        else if (role === "rim") materials[0].color.setHex(colors.border)
        else if (role === "edge") materials[0].color.setHex(colors.edge)
        else if (role === "slot") materials[0].color.setHex(object.userData.occupied ? colors.occupied : colors.slot)
      })
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frame)
      themeObserver.disconnect()
      observer.disconnect()
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown)
      renderer.domElement.removeEventListener("pointermove", handlePointerMove)
      renderer.domElement.removeEventListener("pointerup", handlePointerUp)
      renderer.domElement.removeEventListener("click", handleClick)
      renderer.domElement.removeEventListener("wheel", handleWheel)
      renderer.dispose()
      container.removeChild(renderer.domElement)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose()
          const material = object.material
          if (Array.isArray(material)) material.forEach((item) => item.dispose())
          else material.dispose()
        }
      })
    }
  }, [box, locations])

  return <div ref={mountRef} className="h-[360px] w-full touch-none sm:h-[430px]" aria-label={`${box.label} 三维收纳盒`} role="img" />
}

export function InventoryLocationMap({ items, boxes: incomingBoxes = [] }: { items: ComponentItem[]; boxes?: StorageBox[] }) {
  const actions = useInventoryActions()
  const boxes = incomingBoxes && incomingBoxes.length > 0 ? incomingBoxes : DEFAULT_BOXES
  const [activeBox, setActiveBox] = useState(0)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null)
  const [entryOpen, setEntryOpen] = useState(false)
  const [entryLocation, setEntryLocation] = useState("")
  const [dialog, setDialog] = useState<"add" | "rename" | null>(null)
  const [draftName, setDraftName] = useState("")

  const box = boxes[activeBox] ?? boxes[0]
  const locations = useMemo(() => {
    const map = new Map<string, ComponentItem[]>()
    for (const item of items) {
      const parsed = parseLocation(item.location)
      if (!parsed || parsed.boxId !== box.id) continue
      const key = `${parsed.x}-${parsed.y}`
      map.set(key, [...(map.get(key) ?? []), item])
    }
    return map
  }, [box.id, items])
  const selectedItems = selectedCell ? locations.get(`${selectedCell.x}-${selectedCell.y}`) ?? [] : []
  const hoveredItems = hoveredCell ? locations.get(`${hoveredCell.x}-${hoveredCell.y}`) ?? [] : []
  const categories = Array.from(new Set(items.map((item) => item.category)))
  const occupied = locations.size
  const unassigned = items.filter((item) => {
    const parsed = parseLocation(item.location)
    return !parsed || !boxes.some((candidate) => candidate.id === parsed.boxId)
  }).length

  function changeBox(next: number) {
    setActiveBox((next + boxes.length) % boxes.length)
    setSelectedCell(null)
  }
  function openAdd() {
    setDraftName(`盒 ${String(boxes.length + 1).padStart(2, "0")}`)
    setDialog("add")
  }
  function openRename() {
    setDraftName(box.label)
    setDialog("rename")
  }
  function locationFor(cell: Cell) {
    return `${box.id}-${String(cell.x).padStart(2, "0")}-${String(cell.y).padStart(2, "0")}`
  }
  function selectCell(cell: Cell | null) {
    setSelectedCell(cell)
    if (!cell) return
    setEntryLocation(locationFor(cell))
    setEntryOpen(true)
  }
  async function submitDialog() {
    const label = draftName.trim()
    if (!label) return
    if (dialog === "rename") await actions.updateStorageBox(box.id, label, box.subtitle)
    if (dialog === "add") {
      const id = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index)).find((candidate) => !boxes.some((boxItem) => boxItem.id === candidate)) ?? `BOX-${boxes.length + 1}`
      await actions.createStorageBox(id, label, "新建收纳盒")
      setActiveBox(boxes.length)
    }
    setDialog(null)
  }
  async function removeBox() {
    if (boxes.length <= 1) return
    const hasItems = items.some((item) => parseLocation(item.location)?.boxId === box.id)
    const message = hasItems ? `${box.label} 仍有元件，删除后这些元件会变成未分配货位。确定删除吗？` : `确定删除${box.label}吗？`
    if (!window.confirm(message)) return
    await actions.deleteStorageBox(box.id)
    setSelectedCell(null)
  }

  return (
    <section aria-labelledby="location-map-title" className="overflow-hidden border-y border-border/70 bg-background/45">
      <div className="flex flex-col gap-4 px-1 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-2">
        <div><div className="flex items-center gap-2"><MapPinIcon className="size-4 text-muted-foreground" /><h3 id="location-map-title" className="text-sm font-semibold">收纳盒总览</h3><Badge variant="outline" className="font-mono text-[10px] font-normal">7 × 8 · 3D</Badge></div><p className="mt-1 pl-6 text-xs text-muted-foreground">拖动旋转，滚轮缩放，点击货位查看元件。</p></div>
        <div className="flex flex-wrap items-center justify-end gap-1 self-end sm:self-start" aria-label="切换收纳盒">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="上一个盒子" onClick={() => changeBox(activeBox - 1)} className="cursor-pointer"><ChevronLeftIcon /></Button>
          <div className="flex items-center gap-1.5 px-1" role="tablist">{boxes.map((candidate, index) => <button type="button" key={candidate.id} role="tab" aria-selected={activeBox === index} aria-label={`切换到${candidate.label}`} onClick={() => changeBox(index)} className={cn("relative flex min-h-11 min-w-14 cursor-pointer flex-col items-center justify-center px-2 text-center transition-all duration-300", activeBox === index ? "-translate-y-0.5 text-foreground" : "text-muted-foreground hover:-translate-y-0.5 hover:text-foreground")}><span className={cn("absolute inset-x-2 bottom-0 h-px transition-colors", activeBox === index ? "bg-foreground" : "bg-transparent")} /><span aria-hidden="true" className={cn("relative mb-1 block h-3.5 w-8 transition-opacity", activeBox === index ? "opacity-100" : "opacity-55")}><span className="absolute left-1 top-0 h-1.5 w-6 -skew-x-12 border border-foreground/35 bg-muted/80" /><span className="absolute left-0.5 top-1.5 h-1.5 w-6 -skew-x-12 border border-foreground/25 bg-muted/55" /><span className="absolute left-1.5 top-3 h-1.5 w-6 -skew-x-12 border border-foreground/20 bg-muted/35" /></span><span className="font-mono text-xs font-semibold">{candidate.label}</span><span className="mt-0.5 text-[10px]">{candidate.subtitle}</span></button>)}</div>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="下一个盒子" onClick={() => changeBox(activeBox + 1)} className="cursor-pointer"><ChevronRightIcon /></Button><span className="mx-1 hidden h-5 w-px bg-border sm:block" /><Button type="button" variant="ghost" size="icon-sm" aria-label="新增收纳盒" title="新增收纳盒" onClick={openAdd} className="cursor-pointer"><PlusIcon /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label="重命名当前收纳盒" title="重命名" onClick={openRename} className="cursor-pointer"><PencilIcon /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label="删除当前收纳盒" title="删除收纳盒" onClick={removeBox} disabled={boxes.length <= 1} className="cursor-pointer"><Trash2Icon /></Button>
        </div>
      </div>
      <div className="relative border-t border-border/50 bg-muted/20 px-3 py-4 sm:px-6"><div className="pointer-events-none absolute inset-x-1/2 top-1/2 h-52 w-[min(72vw,38rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted/80 blur-3xl" /><ThreeStorageScene box={box} locations={locations} selectedCell={selectedCell} onSelect={selectCell} onHover={setHoveredCell} />{hoveredCell ? <div className="pointer-events-none absolute left-4 top-4 max-w-[min(90%,22rem)] border-l-2 border-lime-500 bg-background/90 px-3 py-2 text-xs shadow-sm backdrop-blur-sm sm:left-6"><div className="font-mono text-[10px] text-muted-foreground">{locationFor(hoveredCell)}</div>{hoveredItems.length ? <div className="mt-1 space-y-0.5">{hoveredItems.map((item) => <p key={item.id} className="truncate font-medium">{item.name} · {item.value} · {item.quantity} pcs</p>)}</div> : <p className="mt-1 text-muted-foreground">空货位 · 点击后快速录入元件</p>}</div> : null}<div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-col gap-2 text-xs sm:left-6 sm:right-6 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-center gap-3 text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-lime-500" />已占用 {occupied}</span><span>空位 {56 - occupied}</span>{unassigned > 0 ? <span className="text-amber-700 dark:text-amber-400">未分配 {unassigned}</span> : null}</div>{selectedCell ? <div className="max-w-full border-l-2 border-foreground/20 pl-3 sm:max-w-sm"><div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground"><BoxIcon className="size-3" />{locationFor(selectedCell)}</div>{selectedItems.length ? <p className="mt-1 truncate font-medium">{selectedItems.map((item) => `${item.name} · ${item.value}`).join("、")}</p> : <p className="mt-1 text-muted-foreground">这是一个空货位</p>}</div> : <p className="text-right text-muted-foreground">选择一个货位</p>}</div></div>
      <AddComponentDialog categories={categories} open={entryOpen} onOpenChange={setEntryOpen} initialLocation={entryLocation} locationReadOnly showTrigger={false} />
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}><DialogContent><DialogHeader><DialogTitle>{dialog === "add" ? "新增收纳盒" : "重命名收纳盒"}</DialogTitle><DialogDescription>{dialog === "add" ? "新增的盒子会保存在当前设备，并立即加入右上角导航。" : `修改${box.label}的显示名称，不会改变已有货位坐标。`}</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="storage-box-name">盒子名称</Label><Input id="storage-box-name" value={draftName} onChange={(event) => setDraftName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submitDialog()} autoFocus /></div><DialogFooter><DialogClose render={<Button variant="outline" className="cursor-pointer" />}>取消</DialogClose><Button type="button" onClick={submitDialog} disabled={!draftName.trim()} className="cursor-pointer">保存</Button></DialogFooter></DialogContent></Dialog>
    </section>
  )
}
