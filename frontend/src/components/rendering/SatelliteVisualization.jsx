/**
 * Satellite Visualization Component - 2D NASA Blue Marble Map
 * 
 * Simple 2D map view with satellite tracking and ground station visualization.
 */

import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import {
  EARTH_RADIUS_KM,
  DEG_TO_RAD,
  RAD_TO_DEG,
  propagateOrbit,
  generateOrbitGroundTrack,
  orbitalPeriod,
  getSubsolarPoint,
} from "@/lib/satellite-projection"

// NASA Blue Marble texture path
const EARTH_TEXTURE_URL = "/images/world.200401.3x5400x2700.jpg"

export function SatelliteVisualization({
  altitude = 415,
  inclination = 51.6,
  eccentricity = 0.0001,
  raan = 0,
  argumentOfPerigee = 0,
  groundStations = [],
  showControls = false,
  showTerminator = true,
  showGroundStations = true,
  className = "",
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const textureRef = useRef(null)
  const animationRef = useRef(0)
  
  const [canvasState, setCanvasState] = useState({ width: 720, height: 360, dpr: 1 })
  const [orbitProgress, setOrbitProgress] = useState(0)
  const [isTextureLoaded, setIsTextureLoaded] = useState(false)
  const [controlState, setControlState] = useState({
    altitude,
    inclination,
  })

  // Orbital elements
  const orbitalElements = useMemo(() => ({
    a: EARTH_RADIUS_KM + controlState.altitude,
    e: eccentricity,
    i: controlState.inclination,
    raan: raan,
    argP: argumentOfPerigee,
    trueAnomaly: 0,
    epoch: Date.now(),
  }), [controlState.altitude, controlState.inclination, eccentricity, raan, argumentOfPerigee])

  // Current satellite state
  const [satState, setSatState] = useState(null)

  // Load Earth texture
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      textureRef.current = img
      setIsTextureLoaded(true)
    }
    img.onerror = () => {
      console.error("Failed to load Earth texture")
      setIsTextureLoaded(false)
    }
    img.src = EARTH_TEXTURE_URL
    
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      
      setCanvasState({
        width: rect.width,
        height: rect.height,
        dpr,
      })
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Generate ground track
  const groundTrack = useMemo(() => {
    return generateOrbitGroundTrack(orbitalElements, 2, 180)
  }, [orbitalElements])

  // Animation loop
  useEffect(() => {
    const period = orbitalPeriod(orbitalElements.a)
    const animationSpeed = 60 // Complete orbit in 60 seconds
    
    let lastTime = performance.now()
    
    const animate = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime
      
      setOrbitProgress(prev => {
        const newProgress = prev + deltaTime / animationSpeed
        return newProgress >= 1 ? newProgress - 1 : newProgress
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [orbitalElements.a])

  // Update satellite state
  useEffect(() => {
    const period = orbitalPeriod(orbitalElements.a)
    const time = orbitProgress * period
    const state = propagateOrbit(orbitalElements, time)
    setSatState(state)
  }, [orbitalElements, orbitProgress])

  // Convert lat/lon to x/y coordinates
  const latLonToXY = useCallback((lat, lon, width, height) => {
    const x = ((lon + 180) / 360) * width
    const y = ((90 - lat) / 180) * height
    return { x, y }
  }, [])

  // Draw graticule (lat/lon grid)
  const drawGraticule = useCallback((ctx, width, height) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)"
    ctx.lineWidth = 0.5
    ctx.setLineDash([4, 8])

    // Latitude lines every 30°
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath()
      const y = ((90 - lat) / 180) * height
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Longitude lines every 60°
    for (let lon = -120; lon <= 120; lon += 60) {
      ctx.beginPath()
      const x = ((lon + 180) / 360) * width
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Equator and prime meridian (more visible)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)"
    ctx.lineWidth = 0.75
    ctx.setLineDash([])
    
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.stroke()

    ctx.setLineDash([])
  }, [])

  // Draw terminator
  const drawTerminator = useCallback((ctx, width, height, timestamp) => {
    const subsolar = getSubsolarPoint(timestamp)
    
    ctx.fillStyle = "rgba(0, 0, 20, 0.4)"
    ctx.beginPath()
    
    const points = []
    for (let i = 0; i <= 180; i++) {
      const angle = (i / 180) * 2 * Math.PI
      const lat = Math.asin(Math.cos(angle) * Math.cos(subsolar.lat * DEG_TO_RAD)) * RAD_TO_DEG
      let lon = subsolar.lon + Math.atan2(Math.sin(angle), -Math.sin(subsolar.lat * DEG_TO_RAD) * Math.cos(angle)) * RAD_TO_DEG
      lon = ((lon + 540) % 360) - 180
      
      const { x, y } = latLonToXY(lat, lon, width, height)
      points.push({ x, y })
    }
    
    ctx.beginPath()
    const nightSide = subsolar.lon > 0 ? "left" : "right"
    
    if (nightSide === "left") {
      ctx.moveTo(0, 0)
      points.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.lineTo(0, height)
      ctx.lineTo(0, 0)
    } else {
      ctx.moveTo(width, 0)
      points.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.lineTo(width, height)
      ctx.lineTo(width, 0)
    }
    
    ctx.fill()
  }, [latLonToXY])

  // Draw ground track
  const drawGroundTrack = useCallback((ctx, width, height, track) => {
    if (track.length < 2) return

    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.setLineDash([])
    
    ctx.beginPath()
    let prevX = -1
    
    track.forEach((point, i) => {
      const { x, y } = latLonToXY(point.lat, point.lon, width, height)
      
      if (i === 0 || Math.abs(x - prevX) > width / 2) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      prevX = x
    })
    
    ctx.stroke()

    // Previous orbit (faded)
    ctx.strokeStyle = "rgba(59, 130, 246, 0.3)"
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 6])
    
    ctx.beginPath()
    prevX = -1
    
    track.forEach((point, i) => {
      let lon = point.lon + 22.5
      if (lon > 180) lon -= 360
      
      const { x, y } = latLonToXY(point.lat, lon, width, height)
      
      if (i === 0 || Math.abs(x - prevX) > width / 2) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      prevX = x
    })
    
    ctx.stroke()
    ctx.setLineDash([])
  }, [latLonToXY])

  // Draw ground stations
  const drawGroundStations = useCallback((ctx, width, height, state) => {
    if (!groundStations || groundStations.length === 0) return
    
    groundStations.forEach(station => {
      const { x, y } = latLonToXY(station.lat, station.lon, width, height)
      
      // Calculate distance
      const dlat = (station.lat - state.lat) * DEG_TO_RAD
      const dlon = (station.lon - state.lon) * DEG_TO_RAD
      const a = Math.sin(dlat/2) ** 2 + Math.cos(station.lat * DEG_TO_RAD) * Math.cos(state.lat * DEG_TO_RAD) * Math.sin(dlon/2) ** 2
      const angularDist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * RAD_TO_DEG
      const inRange = angularDist < 60
      
      // Coverage circle
      const coverageRadius = 35 * (width / 720)
      ctx.beginPath()
      ctx.arc(x, y, coverageRadius, 0, Math.PI * 2)
      ctx.fillStyle = inRange ? "rgba(34, 197, 94, 0.1)" : "rgba(107, 114, 128, 0.1)"
      ctx.fill()
      ctx.strokeStyle = inRange ? "rgba(34, 197, 94, 0.5)" : "rgba(107, 114, 128, 0.3)"
      ctx.lineWidth = 1
      if (!inRange) ctx.setLineDash([4, 2])
      ctx.stroke()
      ctx.setLineDash([])
      
      // Station marker
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = inRange ? "#22c55e" : "#6b7280"
      ctx.fill()
      
      // Station name
      ctx.fillStyle = inRange ? "#6b9e8a" : "#6b7280"
      ctx.font = "8px system-ui"
      ctx.textAlign = "center"
      ctx.fillText(station.name, x, y + 18)
    })
  }, [latLonToXY, groundStations])

  // Draw satellite
  const drawSatellite = useCallback((ctx, width, height, state) => {
    const { x, y } = latLonToXY(state.lat, state.lon, width, height)
    
    // Footprint ellipse
    ctx.beginPath()
    ctx.ellipse(x, y, 45, 25, 0, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(59, 130, 246, 0.15)"
    ctx.fill()
    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)"
    ctx.lineWidth = 1
    ctx.stroke()
    
    // Satellite body
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.PI / 4)
    
    ctx.fillStyle = "#1e293b"
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(-6, -6, 12, 12, 2)
    ctx.fill()
    ctx.stroke()
    
    // Solar panels
    ctx.fillStyle = "#3b82f6"
    ctx.fillRect(-18, -2, 9, 4)
    ctx.fillRect(9, -2, 9, 4)
    
    ctx.restore()
    
    // Pulse animation
    const pulseRadius = 10 + (Date.now() % 1000) / 100
    ctx.beginPath()
    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(59, 130, 246, ${0.4 - pulseRadius / 30})`
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Label
    ctx.fillStyle = "#e2e8f0"
    ctx.font = "bold 9px system-ui"
    ctx.textAlign = "center"
    ctx.fillText("SAT-01", x, y + 32)
    
    // Coordinates display
    const latDir = state.lat >= 0 ? "N" : "S"
    const lonDir = state.lon >= 0 ? "E" : "W"
    ctx.fillStyle = "rgba(15, 23, 42, 0.8)"
    ctx.fillRect(width / 2 - 75, height - 25, 150, 18)
    ctx.strokeStyle = "#334155"
    ctx.lineWidth = 0.5
    ctx.strokeRect(width / 2 - 75, height - 25, 150, 18)
    ctx.fillStyle = "#94a3b8"
    ctx.font = "9px ui-monospace, monospace"
    ctx.textAlign = "center"
    ctx.fillText(
      `${Math.abs(state.lat).toFixed(1)}°${latDir}  ${Math.abs(state.lon).toFixed(1)}°${lonDir}  Alt: ${state.alt.toFixed(0)}km`,
      width / 2,
      height - 13
    )
  }, [latLonToXY])

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !satState) return

    const { width, height, dpr } = canvasState

    ctx.clearRect(0, 0, width * dpr, height * dpr)
    ctx.save()
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = "#0a0e1a"
    ctx.fillRect(0, 0, width, height)

    // Earth texture
    if (textureRef.current && isTextureLoaded) {
      ctx.drawImage(textureRef.current, 0, 0, width, height)
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)"
      ctx.fillRect(0, 0, width, height)
    }

    drawGraticule(ctx, width, height)

    if (showTerminator) {
      drawTerminator(ctx, width, height, Date.now())
    }

    drawGroundTrack(ctx, width, height, groundTrack)

    if (showGroundStations) {
      drawGroundStations(ctx, width, height, satState)
    }

    drawSatellite(ctx, width, height, satState)

    ctx.restore()
  }, [canvasState, satState, isTextureLoaded, groundTrack, showTerminator, showGroundStations, drawGraticule, drawTerminator, drawGroundTrack, drawGroundStations, drawSatellite])

  useEffect(() => {
    render()
  }, [render])

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        width={canvasState.width * canvasState.dpr}
        height={canvasState.height * canvasState.dpr}
        style={{
          width: canvasState.width,
          height: canvasState.height,
        }}
        className="w-full h-full"
      />
      
      {!isTextureLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="text-sm text-muted-foreground">Loading Earth texture...</div>
        </div>
      )}
      
      {showControls && (
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur border border-border rounded-lg p-3 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Altitude: {controlState.altitude.toFixed(0)} km
            </label>
            <input
              type="range"
              min="200"
              max="2000"
              step="50"
              value={controlState.altitude}
              onChange={(e) => setControlState(prev => ({ ...prev, altitude: Number(e.target.value) }))}
              className="w-48"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Inclination: {controlState.inclination.toFixed(1)}°
            </label>
            <input
              type="range"
              min="0"
              max="180"
              step="0.5"
              value={controlState.inclination}
              onChange={(e) => setControlState(prev => ({ ...prev, inclination: Number(e.target.value) }))}
              className="w-48"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SatelliteVisualization
