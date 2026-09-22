"use client"

import { useEffect, useRef } from "react"

type AuthParticleFieldProps = {
  className?: string
}

/** A lightweight, image-free version of the dotted field used by the reference auth shell. */
export function AuthParticleField({ className }: AuthParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    const particleCanvas = canvas
    const particleContext = context

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let animationFrame = 0

    function draw(time = 0) {
      const bounds = particleCanvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.floor(bounds.width))
      const height = Math.max(1, Math.floor(bounds.height))

      if (particleCanvas.width !== width * dpr || particleCanvas.height !== height * dpr) {
        particleCanvas.width = width * dpr
        particleCanvas.height = height * dpr
      }

      particleContext.setTransform(dpr, 0, 0, dpr, 0, 0)
      particleContext.clearRect(0, 0, width, height)

      const cols = 24
      const rows = 32
      const spacing = Math.min(width / (cols + 1), height / (rows + 1))
      const offsetX = (width - spacing * (cols - 1)) / 2
      const offsetY = (height - spacing * (rows - 1)) / 2

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + col * spacing
          const y = offsetY + row * spacing
          const nx = (x - width / 2) / (width * 0.38)
          const ny = (y - height / 2) / (height * 0.42)
          const lobeA = Math.exp(-((nx + 0.34) ** 2 * 8 + (ny + 0.2) ** 2 * 4))
          const lobeB = Math.exp(-((nx - 0.27) ** 2 * 10 + (ny - 0.13) ** 2 * 5))
          const lobeC = Math.exp(-((nx + 0.04) ** 2 * 4 + (ny - 0.52) ** 2 * 13))
          const intensity = Math.min(1, lobeA + lobeB + lobeC)

          if (intensity < 0.08) continue

          const drift = reduceMotion ? 0 : Math.sin(time / 900 + row * 0.7 + col * 0.45) * 0.8
          const radius = 0.65 + intensity * 1.25
          const alpha = 0.06 + intensity * 0.28
          particleContext.fillStyle = `rgba(16, 117, 83, ${alpha})`
          particleContext.beginPath()
          particleContext.arc(x + drift, y - drift * 0.45, radius, 0, Math.PI * 2)
          particleContext.fill()
        }
      }

      if (!reduceMotion) animationFrame = window.requestAnimationFrame(draw)
    }

    const observer = new ResizeObserver(() => draw(performance.now()))
    observer.observe(particleCanvas)
    draw()

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
