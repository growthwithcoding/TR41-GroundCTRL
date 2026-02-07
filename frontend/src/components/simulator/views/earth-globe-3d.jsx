/**
 * EarthGlobe3D - 3D Globe Visualization Component
 * 
 * Uses Three.js for photorealistic Earth rendering with satellite orbit.
 * Features proper orbital mechanics, camera controls, and follow mode.
 * 
 * Inspired by stellarsnap.space orbit simulator.
 */

import { useRef, useEffect, useState, useCallback } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

// ============================================================================
// Constants
// ============================================================================

const EARTH_RADIUS = 1
const EARTH_RADIUS_KM = 6371
const DEG_TO_RAD = Math.PI / 180
const GRAVITATIONAL_PARAM = 398600.4418 // km³/s² (Earth's GM)

// ============================================================================
// Sub-Components
// ============================================================================

/** Loading spinner overlay */
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-sm text-muted-foreground">Loading Globe...</span>
      </div>
    </div>
  )
}

/** Orbital info display panel */
function OrbitalInfoPanel({ 
  altitude, 
  inclination, 
  lat, 
  lon 
}) {
  return (
    <div className="absolute top-3 left-3 bg-card/90 backdrop-blur border border-border rounded-lg p-3 z-10">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
        Orbital View
      </div>
      <div className="space-y-1 text-xs font-mono">
        <InfoRow label="ALT" value={`${altitude.toFixed(0)} km`} />
        <InfoRow label="INC" value={`${inclination.toFixed(1)}°`} />
        <InfoRow label="LAT" value={`${lat.toFixed(2)}°`} />
        <InfoRow label="LON" value={`${lon.toFixed(2)}°`} />
      </div>
    </div>
  )
}

/** Single info row */
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

/** View mode indicator badge */
function ViewModeBadge() {
  return (
    <div className="absolute top-3 right-3 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-1.5 z-10">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-mono text-primary">3D GLOBE</span>
      </div>
    </div>
  )
}

/** Follow satellite toggle button */
function FollowToggle({ 
  active, 
  onToggle 
}) {
  return (
    <button
      onClick={onToggle}
      className={`absolute bottom-3 right-3 bg-card/90 backdrop-blur border rounded-lg px-3 py-2 z-10 transition-colors ${
        active 
          ? "border-primary bg-primary/10 text-primary" 
          : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      <div className="flex items-center gap-2">
        <FollowIcon active={active} />
        <span className="text-xs font-mono">
          {active ? "TRACKING" : "FOLLOW SAT"}
        </span>
      </div>
    </button>
  )
}

/** Follow icon SVG */
function FollowIcon({ active }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-4 h-4"
    >
      {active ? (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v10" />
          <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24" />
          <path d="M1 12h6m6 0h10" />
          <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

/** Interaction hint text */
function InteractionHint({ followMode, isPaused }) {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/60 z-10">
      {followMode 
        ? "Camera tracking satellite • Click TRACKING to exit" 
        : isPaused
        ? "PAUSED • Space to resume • +/- zoom • Arrows rotate • R reset"
        : "Drag to rotate • Scroll to zoom • Space to pause • +/- zoom • Arrows rotate"
      }
    </div>
  )
}

// ============================================================================
// Three.js Factory Functions
// ============================================================================

/** Create Earth mesh with Blue Marble texture */
function createEarthMesh(onLoad) {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64)
  const textureLoader = new THREE.TextureLoader()
  
  const dayTexture = textureLoader.load(
    "/images/world.jpg",
    onLoad,
    undefined,
    () => console.warn("[EarthGlobe3D] Earth texture failed to load")
  )
  dayTexture.anisotropy = 16
  
  const material = new THREE.MeshPhongMaterial({
    map: dayTexture,
    bumpScale: 0.02,
    specular: new THREE.Color(0x333333),
    shininess: 5,
  })

  const earth = new THREE.Mesh(geometry, material)
  earth.rotation.y = -Math.PI / 2
  earth.receiveShadow = true
  
  return earth
}

/** Create atmosphere glow effect */
function createAtmosphere() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.015, 64, 64)
  
  const material = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
  })

  return new THREE.Mesh(geometry, material)
}

/** Create star field background */
function createStarField() {
  const geometry = new THREE.BufferGeometry()
  const starCount = 2000
  const positions = new Float32Array(starCount * 3)

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = 50 + Math.random() * 50
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
  })

  return new THREE.Points(geometry, material)
}

/** Create satellite mesh group */
function createSatelliteMesh() {
  const group = new THREE.Group()

  // Body
  const bodyGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.03)
  const bodyMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x888888,
    specular: 0xffffff,
    shininess: 100,
  })
  group.add(new THREE.Mesh(bodyGeometry, bodyMaterial))

  // Solar panels
  const panelGeometry = new THREE.BoxGeometry(0.08, 0.002, 0.03)
  const panelMaterial = new THREE.MeshPhongMaterial({
    color: 0x1e40af,
    specular: 0x3b82f6,
    shininess: 50,
  })

  const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial)
  leftPanel.position.x = -0.055
  group.add(leftPanel)

  const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial)
  rightPanel.position.x = 0.055
  group.add(rightPanel)

  // Glow indicator
  const glowGeometry = new THREE.SphereGeometry(0.02, 16, 16)
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.6,
  })
  group.add(new THREE.Mesh(glowGeometry, glowMaterial))

  return group
}

/** Create orbital path line */
function createOrbitLine(radius, inclination, raan) {
  const points = []
  const segments = 128
  const inclRad = inclination * DEG_TO_RAD
  const raanRad = raan * DEG_TO_RAD

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    
    let x = radius * Math.cos(angle)
    let y = 0
    let z = radius * Math.sin(angle)

    // Apply inclination (rotate around X axis)
    const y1 = y * Math.cos(inclRad) - z * Math.sin(inclRad)
    const z1 = y * Math.sin(inclRad) + z * Math.cos(inclRad)

    // Apply RAAN (rotate around Y axis)
    const x2 = x * Math.cos(raanRad) + z1 * Math.sin(raanRad)
    const z2 = -x * Math.sin(raanRad) + z1 * Math.cos(raanRad)

    points.push(new THREE.Vector3(x2, y1, z2))
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.7,
  })

  return new THREE.Line(geometry, material)
}

/** Setup scene lighting */
function setupLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
  scene.add(ambientLight)

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5)
  sunLight.position.set(5, 3, 5)
  sunLight.castShadow = true
  scene.add(sunLight)

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3)
  scene.add(hemiLight)
}

// ============================================================================
// Main Component
// ============================================================================

export function EarthGlobe3D({
  altitude = 415,
  inclination = 51.6,
  eccentricity = 0.0001,
  raan = 0,
  showOrbit = true,
  showAtmosphere = true,
  showStars = true,
  animationSpeed = 120,
  className = "",
}) {
  // Refs
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const earthRef = useRef(null)
  const satelliteRef = useRef(null)
  const orbitLineRef = useRef(null)
  const animationRef = useRef(0)
  
  // State
  const [isLoaded, setIsLoaded] = useState(false)
  const [trueAnomaly, setTrueAnomaly] = useState(0)
  const [followSatellite, setFollowSatellite] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // Derived values
  const orbitRadius = EARTH_RADIUS + (altitude / EARTH_RADIUS_KM)

  // Calculate satellite position from orbital elements
  const calculateSatellitePosition = useCallback((
    anomaly,
    radius,
    incl,
    raanDeg
  ) => {
    const inclRad = incl * DEG_TO_RAD
    const raanRad = raanDeg * DEG_TO_RAD

    let x = radius * Math.cos(anomaly)
    let y = 0
    let z = radius * Math.sin(anomaly)

    const y1 = y * Math.cos(inclRad) - z * Math.sin(inclRad)
    const z1 = y * Math.sin(inclRad) + z * Math.cos(inclRad)

    const x2 = x * Math.cos(raanRad) + z1 * Math.sin(raanRad)
    const z2 = -x * Math.sin(raanRad) + z1 * Math.cos(raanRad)

    const r = Math.sqrt(x2 * x2 + y1 * y1 + z2 * z2)
    const lat = Math.asin(y1 / r) / DEG_TO_RAD
    const lon = Math.atan2(z2, x2) / DEG_TO_RAD

    return { lat, lon, alt: altitude, x: x2, y: y1, z: z2 }
  }, [altitude])

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000510)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 1.5, 4)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 1.5
    controls.maxDistance = 10
    controls.enablePan = false
    controlsRef.current = controls

    // Setup lighting
    setupLighting(scene)

    // Create Earth
    const earth = createEarthMesh(() => setIsLoaded(true))
    scene.add(earth)
    earthRef.current = earth

    // Create atmosphere
    if (showAtmosphere) {
      scene.add(createAtmosphere())
    }

    // Create stars
    if (showStars) {
      scene.add(createStarField())
    }

    // Create satellite
    const satellite = createSatelliteMesh()
    scene.add(satellite)
    satelliteRef.current = satellite

    // Create orbit path
    if (showOrbit) {
      const orbitLine = createOrbitLine(orbitRadius, inclination, raan)
      scene.add(orbitLine)
      orbitLineRef.current = orbitLine
    }

    // Handle resize
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationRef.current)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [showAtmosphere, showStars, showOrbit, orbitRadius, inclination, raan])

  // Update orbit when parameters change
  useEffect(() => {
    if (!sceneRef.current || !orbitLineRef.current) return
    
    sceneRef.current.remove(orbitLineRef.current)
    orbitLineRef.current.geometry.dispose()
    
    if (showOrbit) {
      const newOrbitLine = createOrbitLine(orbitRadius, inclination, raan)
      sceneRef.current.add(newOrbitLine)
      orbitLineRef.current = newOrbitLine
    }
  }, [altitude, inclination, raan, showOrbit, orbitRadius])

  // Keyboard controls
  useEffect(() => {
    if (!isLoaded || !cameraRef.current || !controlsRef.current) return

    const camera = cameraRef.current
    const controls = controlsRef.current

    const handleKeyDown = (e) => {
      const rotationSpeed = 0.05
      const zoomSpeed = 0.3
      
      switch(e.key) {
        case ' ':
          e.preventDefault()
          setIsPaused(prev => !prev)
          break
        case '+':
        case '=':
          e.preventDefault()
          camera.position.multiplyScalar(0.9)
          camera.position.clampLength(1.5, 10)
          break
        case '-':
        case '_':
          e.preventDefault()
          camera.position.multiplyScalar(1.1)
          camera.position.clampLength(1.5, 10)
          break
        case 'ArrowUp':
          e.preventDefault()
          camera.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), -rotationSpeed)
          break
        case 'ArrowDown':
          e.preventDefault()
          camera.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), rotationSpeed)
          break
        case 'ArrowLeft':
          e.preventDefault()
          camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationSpeed)
          break
        case 'ArrowRight':
          e.preventDefault()
          camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotationSpeed)
          break
        case 'r':
        case 'R':
          e.preventDefault()
          camera.position.set(0, 1.5, 4)
          controls.target.set(0, 0, 0)
          setFollowSatellite(false)
          break
        case 'f':
        case 'F':
          e.preventDefault()
          setFollowSatellite(prev => !prev)
          break
        case 'p':
        case 'P':
          e.preventDefault()
          setIsPaused(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLoaded])

  // Animation loop
  useEffect(() => {
    if (!isLoaded || !rendererRef.current || !sceneRef.current || !cameraRef.current) return

    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current
    const controls = controlsRef.current

    // Calculate orbital period
    const semiMajorAxis = EARTH_RADIUS_KM + altitude
    const period = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / GRAVITATIONAL_PARAM)

    let lastTime = performance.now()

    const animate = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      // Update true anomaly (only if not paused)
      if (!isPaused) {
        setTrueAnomaly(prev => {
          const newAnomaly = prev + (deltaTime * animationSpeed * 2 * Math.PI) / period
          return newAnomaly % (2 * Math.PI)
        })
      }

      // Rotate Earth (only if not paused)
      if (earthRef.current && !isPaused) {
        earthRef.current.rotation.y += deltaTime * 0.02
      }

      // Update satellite position
      if (satelliteRef.current) {
        const pos = calculateSatellitePosition(trueAnomaly, orbitRadius, inclination, raan)
        satelliteRef.current.position.set(pos.x, pos.y, pos.z)
        satelliteRef.current.lookAt(0, 0, 0)

        // Camera follow mode
        if (followSatellite && camera && controls) {
          const satPosition = new THREE.Vector3(pos.x, pos.y, pos.z)
          const direction = satPosition.clone().normalize()
          const cameraOffset = direction.multiplyScalar(0.8)
          const targetPos = satPosition.clone().add(cameraOffset)
          
          camera.position.lerp(targetPos, 0.05)
          controls.target.set(0, 0, 0)
        }
      }

      controls?.update()
      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationRef.current)
  }, [isLoaded, altitude, inclination, raan, orbitRadius, calculateSatellitePosition, trueAnomaly, followSatellite, animationSpeed, isPaused])

  // Current satellite position for display
  const satPos = calculateSatellitePosition(trueAnomaly, orbitRadius, inclination, raan)

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {!isLoaded && <LoadingOverlay />}
      
      <OrbitalInfoPanel 
        altitude={altitude}
        inclination={inclination}
        lat={satPos.lat}
        lon={satPos.lon}
      />
      
      <ViewModeBadge />
      
      <FollowToggle 
        active={followSatellite}
        onToggle={() => setFollowSatellite(!followSatellite)}
      />
      
      <InteractionHint followMode={followSatellite} isPaused={isPaused} />
    </div>
  )
}

export default EarthGlobe3D
