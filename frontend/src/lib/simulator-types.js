// Satellite Subsystem Types following real mission control patterns

[]
  batteryTemp: number
  payloadTemp: number
  radiatorEfficiency: number
}

 // deg/s
  mode: AttitudeMode
  sunAngle: number // degrees
  nadirAngle: number // degrees
}

 | null
  linkMargin: number // dB
}

export type SystemStatus = 'nominal' | 'warning' | 'critical' | 'offline'
export type AttitudeMode = 'nadir' | 'sun-pointing' | 'target-tracking' | 'safe' | 'slewing'

export type CommandType = 
  | 'orbital-maneuver'
  | 'attitude-control'
  | 'communications'
  | 'power-management'
  | 'payload-control'
  | 'thermal-control'

export type CommandStatus = 
  | 'queued'
  | 'validating'
  | 'transmitting'
  | 'awaiting-ack'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'rejected'

