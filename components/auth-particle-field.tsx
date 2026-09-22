"use client"

import { useEffect, useRef } from "react"

type AuthParticleFieldProps = {
  className?: string
}

type Particle = {
  x: number
  y: number
  size: number
  alpha: number
  phase: number
  drift: number
}

const SOURCE_SIZE = 1024
const SAMPLE_STEP = 3

function noise(index: number, seed: number) {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453
  return value - Math.floor(value)
}

/**
 * Samples the supplied source artwork as a particle mask. This preserves the
 * original planet and orbit composition while keeping the rendered result live.
 */
export function AuthParticleField({ className }: AuthParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return
    const particleCanvas = canvas
    const particleContext = context

    const sourceCanvas = document.createElement("canvas")
    sourceCanvas.width = SOURCE_SIZE
    sourceCanvas.height = SOURCE_SIZE
    const sourceContext = sourceCanvas.getContext("2d", {
      willReadFrequently: true,
    })
    if (!sourceContext) return
    const maskContext = sourceContext

    const image = new Image()
    image.src = "/auth-particle-source.png"

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    )
    let reduceMotion = reduceMotionQuery.matches
    let particles: Particle[] = []
    let animationFrame = 0
    let lastFrame = 0
    let disposed = false
    const particleColor = document.documentElement.classList.contains("dark")
      ? "245, 245, 245"
      : "30, 30, 32"

    function buildParticles() {
      maskContext.clearRect(0, 0, SOURCE_SIZE, SOURCE_SIZE)
      maskContext.drawImage(image, 0, 0, SOURCE_SIZE, SOURCE_SIZE)
      const pixels = maskContext.getImageData(
        0,
        0,
        SOURCE_SIZE,
        SOURCE_SIZE,
      ).data
      const nextParticles: Particle[] = []
      let index = 0

      for (let y = 0; y < SOURCE_SIZE; y += SAMPLE_STEP) {
        for (let x = 0; x < SOURCE_SIZE; x += SAMPLE_STEP) {
          const pixelIndex = (y * SOURCE_SIZE + x) * 4
          const brightness =
            (pixels[pixelIndex] + pixels[pixelIndex + 1] + pixels[pixelIndex + 2]) /
            3

          if (brightness < 24) {
            index += 1
            continue
          }

          const normalized = brightness / 255
          const keepChance = 0.36 + normalized * 0.64
          if (noise(index, 7) > keepChance) {
            index += 1
            continue
          }

          nextParticles.push({
            x: x / SOURCE_SIZE,
            y: y / SOURCE_SIZE,
            size: 0.7 + normalized * 1.15 + noise(index, 11) * 0.4,
            alpha: 0.18 + normalized * 0.72,
            phase: noise(index, 17) * Math.PI * 2,
            drift: 0.25 + noise(index, 23) * 0.75,
          })
          index += 1
        }
      }

      particles = nextParticles
    }

    function draw(time = 0) {
      const bounds = particleCanvas.getBoundingClientRect()
      const width = Math.max(1, Math.floor(bounds.width))
      const height = Math.max(1, Math.floor(bounds.height))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      if (
        particleCanvas.width !== width * dpr ||
        particleCanvas.height !== height * dpr
      ) {
        particleCanvas.width = width * dpr
        particleCanvas.height = height * dpr
      }

      particleContext.setTransform(dpr, 0, 0, dpr, 0, 0)
      particleContext.clearRect(0, 0, width, height)

      const scale = Math.max(width / SOURCE_SIZE, height / SOURCE_SIZE) * 1.035
      const artworkSize = SOURCE_SIZE * scale
      const offsetX = (width - artworkSize) / 2
      const offsetY = (height - artworkSize) / 2
      const elapsed = reduceMotion ? 0 : time * 0.00022

      for (const particle of particles) {
        const shimmer = reduceMotion
          ? 1
          : 0.88 + Math.sin(elapsed * 2.2 + particle.phase) * 0.12
        const driftX = reduceMotion
          ? 0
          : Math.sin(elapsed + particle.phase) * particle.drift
        const driftY = reduceMotion
          ? 0
          : Math.cos(elapsed * 0.78 + particle.phase) * particle.drift
        const size = Math.max(0.7, particle.size * Math.min(scale, 1.45))

        particleContext.fillStyle = `rgba(${particleColor}, ${particle.alpha * shimmer})`
        particleContext.fillRect(
          offsetX + particle.x * artworkSize + driftX,
          offsetY + particle.y * artworkSize + driftY,
          size,
          size,
        )
      }

      if (!reduceMotion && !disposed) {
        animationFrame = window.requestAnimationFrame(animate)
      }
    }

    function animate(time: number) {
      if (time - lastFrame < 34) {
        animationFrame = window.requestAnimationFrame(animate)
        return
      }
      lastFrame = time
      draw(time)
    }

    function handleMotionChange(event: MediaQueryListEvent) {
      reduceMotion = event.matches
      window.cancelAnimationFrame(animationFrame)
      draw(performance.now())
    }

    const resizeObserver = new ResizeObserver(() => {
      window.cancelAnimationFrame(animationFrame)
      draw(performance.now())
    })

    image.onload = () => {
      if (disposed) return
      buildParticles()
      resizeObserver.observe(particleCanvas)
      draw(performance.now())
    }

    reduceMotionQuery.addEventListener("change", handleMotionChange)

    return () => {
      disposed = true
      resizeObserver.disconnect()
      reduceMotionQuery.removeEventListener("change", handleMotionChange)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
