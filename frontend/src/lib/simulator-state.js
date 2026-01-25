

// Initial telemetry state representing a realistic LEO satellite
export const initialTelemetry = {
  timestamp: Date.now(),
  subsystems: {
    power: {
      status: "nominal",
      batteryVoltage: 28.4,
      batterySoc: 92,
      solarArrayOutput: 1847,
      powerDraw: 1420,
      inEclipse: false,
    },
    thermal: {
      status: "warning",
      panels: [
        { id: "panel-1", temp: 35, limit: 60 },
        { id: "panel-2", temp: 52, limit: 60 },
        { id: "panel-3", temp: 41, limit: 60 },
      ],
      batteryTemp: 28,
      payloadTemp: 32,
      radiatorEfficiency: 0.94,
    },
    propulsion: {
      status: "nominal",
      fuelRemaining: 75,
      fuelMass: 12.4,
      thrusterStatus: [
        { id: "thr-1", name: "RCS-1", health: "nominal", firingCount: 847 },
        { id: "thr-2", name: "RCS-2", health: "nominal", firingCount: 823 },
        { id: "thr-3", name: "RCS-3", health: "nominal", firingCount: 891 },
        { id: "thr-4", name: "RCS-4", health: "nominal", firingCount: 856 },
        { id: "thr-5", name: "MAIN", health: "nominal", firingCount: 42 },
      ],
      deltaVAvailable: 127.3,
    },
    payload: {
      status: "nominal",
      dataRate: 2.4,
      bufferUsage: 34,
      activeMode: "imaging",
    },
  },
  orbit: {
    altitude: 380,
    perigee: 378,
    apogee: 412,
    inclination: 51.6,
    period: 92.1,
    eccentricity: 0.0025,
    trueAnomaly: 127.4,
    meanMotion: 15.63,
    epoch: new Date().toISOString(),
  },
  attitude: {
    quaternion: [0.707, 0.0, 0.707, 0.0],
    angularRates: { x: 0.001, y: -0.002, z: 0.001 },
    mode: "nadir",
    sunAngle: 23.4,
    nadirAngle: 0.8,
  },
  communications: {
    status: "nominal",
    signalStrength: -87,
    dataRate: 2.4,
    groundStation: "Svalbard",
    nextPass: {
      station: "McMurdo",
      startTime: "08:22:15 UTC",
      duration: 12,
    },
    linkMargin: 6.2,
  },
}

export const initialMission = {
  id: "mission-001",
  title: "Stable Orbit & First Contact",
  description:
    "Establish a stable orbit and complete first ground station contact",
  completed: false,
  active: true,
  progress: 40,
  steps: [
    { id: 1, text: "Initialize satellite systems", completed: true, active: false },
    { id: 2, text: "Establish ground link", completed: true, active: false },
    { id: 3, text: "Analyze current orbit parameters", completed: false, active: true },
    { id: 4, text: "Plan perigee raising maneuver", completed: false, active: false },
    { id: 5, text: "Execute burn sequence", completed: false, active: false },
  ],
}

export const initialAlerts = [
  {
    id: "alert-001",
    severity: "warning",
    subsystem: "Thermal",
    message: "Panel 2 temperature approaching limit (52°C / 60°C max)",
    timestamp: Date.now() - 120000,
    acknowledged: false,
  },
]

export const commandQueue = []

// Simulate command execution with realistic delays
export function simulateCommandExecution(
  command,
  onStatusChange
) {
  const stages = [
    { status: "validating", delay: 500 },
    { status: "transmitting", delay: 1500 },
    { status: "awaiting-ack", delay: 2000 },
    { status: "executing", delay: 3000 },
    { status: "completed", delay: 1000 },
  ]

  let currentIndex = 0

  function executeNextStage() {
    if (currentIndex >= stages.length) return

    const stage = stages[currentIndex]
    setTimeout(() => {
      if (stage.status === "completed") {
        onStatusChange(stage.status, {
          received: true,
          validated: true,
          executed: true,
          message: "Command executed successfully",
        })
      } else {
        onStatusChange(stage.status)
      }
      currentIndex++
      executeNextStage()
    }, stage.delay)
  }

  executeNextStage()
}

// Update telemetry with realistic variations
export function updateTelemetry(current) {
  const variation = (base, range) =>
    base + (Math.random() - 0.5) * range

  return {
    ...current,
    timestamp: Date.now(),
    subsystems: {
      ...current.subsystems,
      power: {
        ...current.subsystems.power,
        batteryVoltage: variation(current.subsystems.power.batteryVoltage, 0.2),
        batterySoc: Math.max(
          0,
          Math.min(100, variation(current.subsystems.power.batterySoc, 0.1))
        ),
        solarArrayOutput: variation(
          current.subsystems.power.solarArrayOutput,
          20
        ),
        powerDraw: variation(current.subsystems.power.powerDraw, 15),
      },
      thermal: {
        ...current.subsystems.thermal,
        panels: current.subsystems.thermal.panels.map((panel) => ({
          ...panel,
          temp: variation(panel.temp, 0.5),
        })),
        batteryTemp: variation(current.subsystems.thermal.batteryTemp, 0.2),
      },
    },
    orbit: {
      ...current.orbit,
      trueAnomaly: (current.orbit.trueAnomaly + 0.5) % 360,
      altitude: variation(current.orbit.altitude, 0.1),
    },
    communications: {
      ...current.communications,
      signalStrength: variation(current.communications.signalStrength, 2),
    },
  }
}
