"use client"

import * as React from "react"
import { createMap } from "svg-dotted-map"

import { cn } from "@/lib/utils"

export interface Marker {
  lat: number
  lng: number
  size?: number
  pulse?: boolean
}

type MapMarker<M extends Marker> = Omit<M, "lat" | "lng"> & {
  x: number
  y: number
}

export interface DottedMapProps<M extends Marker = Marker>
  extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  mapSamples?: number
  markers?: M[]
  dotColor?: string
  markerColor?: string
  dotRadius?: number
  stagger?: boolean
  pulse?: boolean
  mapRatio?: number
  fillDensity?: number
  renderMarkerOverlay?: (args: {
    marker: MapMarker<M>
    index: number
    x: number
    y: number
    r: number
  }) => React.ReactNode
}

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function DottedMap<M extends Marker = Marker>({
  width = 150,
  height = 150,
  mapSamples = 5000,
  markers = [],
  dotColor = "currentColor",
  markerColor = "#FF6900",
  dotRadius = 0.2,
  stagger = true,
  pulse = false,
  mapRatio = 0.5,
  fillDensity = 1,
  renderMarkerOverlay,
  className,
  style,
  ...svgProps
}: DottedMapProps<M>) {
  // Measure the actual container so the drawing can fill any aspect ratio
  // instead of being letterboxed into a square viewBox.
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [aspect, setAspect] = React.useState(width / height)

  React.useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      if (rect.width > 0 && rect.height > 0) {
        setAspect(rect.width / rect.height)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Keep `width` as the horizontal coordinate resolution and derive the
  // viewBox height from the measured container aspect ratio.
  const vbHeight = width / aspect

  // The world map spans the full width as a band (natural ~2:1 world at
  // mapRatio 0.5), vertically centered, with the leftover space filled by dots.
  const mapHeight = Math.min(width * mapRatio, vbHeight)
  const mapYOffset = Math.max(0, (vbHeight - mapHeight) / 2)

  const { points, addMarkers } = React.useMemo(
    () => createMap({ width, height: mapHeight, mapSamples }),
    [width, mapHeight, mapSamples],
  )

  const offsetPoints = React.useMemo(
    () => points.map((p) => ({ ...p, y: p.y + mapYOffset })),
    [points, mapYOffset],
  )

  const processedMarkers = React.useMemo(() => {
    const raw = addMarkers(markers)
    return raw.map((m) => ({ ...m, y: m.y + mapYOffset }))
  }, [addMarkers, markers, mapYOffset])

  // Derive the map's grid geometry: horizontal step within a row, vertical
  // step between rows, row parity (for staggering), and the y of the first and
  // last populated rows so the filler lattice can be extended from them.
  const { xStep, yStep, yToRowIndex, firstRowY, lastRowY, firstRowIndex, lastRowIndex } =
    React.useMemo(() => {
      const sorted = [...offsetPoints].sort((a, b) => a.y - b.y || a.x - b.x)
      const rowMap = new Map<number, number>()
      let step = 0
      let rowStep = 0
      let prevY = Number.NaN
      let prevXInRow = Number.NaN

      for (const p of sorted) {
        if (p.y !== prevY) {
          if (!Number.isNaN(prevY)) {
            const dy = p.y - prevY
            if (dy > 0) rowStep = rowStep === 0 ? dy : Math.min(rowStep, dy)
          }
          prevY = p.y
          prevXInRow = Number.NaN
          if (!rowMap.has(p.y)) rowMap.set(p.y, rowMap.size)
        }
        if (!Number.isNaN(prevXInRow)) {
          const delta = p.x - prevXInRow
          if (delta > 0) step = step === 0 ? delta : Math.min(step, delta)
        }
        prevXInRow = p.x
      }

      const rowYs = [...rowMap.keys()]
      return {
        xStep: step || 1,
        yStep: rowStep || step || 1,
        yToRowIndex: rowMap,
        firstRowY: rowYs.length ? rowYs[0] : mapYOffset,
        lastRowY: rowYs.length ? rowYs[rowYs.length - 1] : vbHeight - mapYOffset,
        firstRowIndex: 0,
        lastRowIndex: rowMap.size - 1,
      }
    }, [offsetPoints, mapYOffset, vbHeight])

  // Filler dots sit on the SAME lattice as the map (same column/row spacing and
  // stagger), extended into the empty space above the top row and below the
  // bottom row. Each grid cell is randomly kept, denser near the outer edge and
  // fading out toward the map.
  const fillerDots = React.useMemo(() => {
    const topSpan = firstRowY
    const bottomSpan = vbHeight - lastRowY
    if (yStep <= 0 || xStep <= 0 || (topSpan <= 0 && bottomSpan <= 0)) return []

    const rand = mulberry32(
      width * 997 + Math.round(vbHeight * 31) + Math.round(mapRatio * 100),
    )
    const dots: Array<{ x: number; y: number }> = []

    // Probability a given cell is drawn. t = 0 at the outer edge, 1 at the map.
    // Capped below 1 so even the densest edge rows stay scattered, not solid.
    const maxProb = 0.65
    const keepProb = (t: number) =>
      Math.min(1, Math.pow(1 - t, 2.5) * maxProb * fillDensity)

    const fillRow = (rowY: number, rowIndex: number, t: number) => {
      const p = keepProb(t)
      if (p <= 0) return
      const offsetX = stagger && ((rowIndex % 2) + 2) % 2 === 1 ? xStep / 2 : 0
      for (let x = offsetX; x <= width; x += xStep) {
        if (rand() < p) dots.push({ x, y: rowY })
      }
    }

    // Rows above the topmost land row, walking up toward y = 0.
    if (topSpan > 0) {
      for (let k = 1; ; k++) {
        const rowY = firstRowY - k * yStep
        if (rowY <= 0) break
        fillRow(rowY, firstRowIndex - k, rowY / topSpan)
      }
    }

    // Rows below the bottommost land row, walking down toward y = vbHeight.
    if (bottomSpan > 0) {
      for (let k = 1; ; k++) {
        const rowY = lastRowY + k * yStep
        if (rowY >= vbHeight) break
        fillRow(rowY, lastRowIndex + k, (vbHeight - rowY) / bottomSpan)
      }
    }

    return dots
  }, [
    width,
    vbHeight,
    xStep,
    yStep,
    firstRowY,
    lastRowY,
    firstRowIndex,
    lastRowIndex,
    mapRatio,
    fillDensity,
    stagger,
  ])

  return (
    <div
      ref={containerRef}
      className={cn(
        "text-gray-500 dark:text-gray-500",
        "h-full w-full",
        className,
      )}
      style={style}
    >
      <svg
        viewBox={`0 0 ${width} ${vbHeight}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%", display: "block" }}
        {...svgProps}
      >
      {/* Filler dots are already snapped to the map lattice (stagger baked in). */}
      {fillerDots.map((point, index) => (
        <circle
          cx={point.x}
          cy={point.y}
          r={dotRadius}
          fill={dotColor}
          key={`fill-${index}`}
        />
      ))}

      {offsetPoints.map((point, index) => {
        const rowIndex = yToRowIndex.get(point.y) ?? 0
        const offsetX = stagger && rowIndex % 2 === 1 ? xStep / 2 : 0
        return (
          <circle
            cx={point.x + offsetX}
            cy={point.y}
            r={dotRadius}
            fill={dotColor}
            key={`${point.x}-${point.y}-${index}`}
          />
        )
      })}

      {processedMarkers.map((marker, index) => {
        const rowIndex = yToRowIndex.get(marker.y) ?? 0
        const offsetX = stagger && rowIndex % 2 === 1 ? xStep / 2 : 0
        const x = marker.x + offsetX
        const y = marker.y
        const r = marker.size ?? dotRadius
        const shouldPulse = pulse
          ? marker.pulse !== false
          : marker.pulse === true
        const pulseTo = r * 2.8

        return (
          <g key={`${marker.x}-${marker.y}-${index}`}>
            <circle cx={x} cy={y} r={r} fill={markerColor} />

            {shouldPulse ? (
              <g pointerEvents="none">
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill="none"
                  stroke={markerColor}
                  strokeOpacity={1}
                  strokeWidth={0.35}
                >
                  <animate
                    attributeName="r"
                    values={`${r};${pulseTo}`}
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;0"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill="none"
                  stroke={markerColor}
                  strokeOpacity={0.9}
                  strokeWidth={0.3}
                >
                  <animate
                    attributeName="r"
                    values={`${r};${pulseTo}`}
                    dur="1.4s"
                    begin="0.7s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.9;0"
                    dur="1.4s"
                    begin="0.7s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            ) : null}

            {renderMarkerOverlay?.({
              marker: { ...marker, x, y },
              index,
              x,
              y,
              r,
            })}
          </g>
        )
      })}
      </svg>
    </div>
  )
}
