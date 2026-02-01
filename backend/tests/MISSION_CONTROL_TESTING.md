# Mission Control Enhancement - Testing Guide

**Version:** 1.0.0  
**Date:** January 31, 2026  
**Status:** Active Testing Documentation

## 📋 Overview

This document provides comprehensive testing procedures for the Mission Control Simulation Enhancement features (Phases 1-5). All tests must pass before deployment.

---

## 🎯 Testing Objectives

1. **Service Integration**: Verify all Mission Control services integrate correctly
2. **Data Accuracy**: Validate calculations and algorithms
3. **Performance**: Ensure services meet performance requirements
4. **Security**: Verify crypto usage and data integrity
5. **Error Handling**: Test graceful degradation and error scenarios

---

## 📦 Services Under Test

- ✅ **Command Queue** (`commandQueue.js`) - Phase 1
- ✅ **Step Validator** (`stepValidator.js`) - Phase 1
- ✅ **Visibility Calculator** (`visibilityCalculator.js`) - Phase 2
- ✅ **Time Controller** (`timeController.js`) - Phase 3
- ✅ **Performance Tracker** (`performanceTracker.js`) - Phase 5
- ✅ **Orbital Mechanics** (`orbitalMechanics.js`) - Phase 4
- ✅ **Certificate Generator** (`certificateGenerator.js`) - Phase 5
- ✅ **Simulation Engine** (`simulationEngine.js`) - Integration

---

## 🧪 Test Categories

### 1. Unit Tests
- Individual function testing
- Input validation
- Edge cases
- Error handling

### 2. Integration Tests
- Service-to-service communication
- Database interactions
- WebSocket events
- End-to-end workflows

### 3. Performance Tests
- Load handling
- Memory usage
- Response times
- Concurrent operations

### 4. Security Tests
- Crypto implementations
- Data sanitization
- Access control
- Certificate uniqueness

---

## 📝 Test Suite Definitions

## Phase 1: Command Queue Service

### Test: CQ-001 - Command Enqueue
**Purpose**: Verify command is enqueued with correct latency

**Parameters**:
```javascript
{
  sessionId: "test-session-001",
  command: {
    commandName: "PING",
    commandPayload: {}
  }
}
```

**Expected Result**:
- ✅ Command ID returned (format: `cmd_[timestamp]_[hash]`)
- ✅ Status: `uplink_in_progress`
- ✅ Latency: ~27 seconds (30% of 90s for PING)
- ✅ WebSocket event emitted: `command:status`

**Pass Criteria**:
```javascript
expect(commandId).toMatch(/^cmd_\d+_[a-f0-9]{12}$/);
expect(status).toBe('uplink_in_progress');
expect(latencySeconds).toBeGreaterThanOrEqual(25);
expect(latencySeconds).toBeLessThanOrEqual(30);
```

---

### Test: CQ-002 - Critical Command Priority
**Purpose**: Verify critical commands get 50% faster processing

**Parameters**:
```javascript
{
  sessionId: "test-session-001",
  command: {
    commandName: "SAFE_MODE",
    commandPayload: {}
  }
}
```

**Expected Result**:
- ✅ Latency: ~45 seconds (50% of default 90s)
- ✅ Command executes before non-critical commands queued earlier

**Pass Criteria**:
```javascript
expect(latencySeconds).toBeGreaterThanOrEqual(40);
expect(latencySeconds).toBeLessThanOrEqual(50);
```

---

### Test: CQ-003 - Command Queue Processing
**Purpose**: Verify queue processes commands at correct time

**Parameters**:
```javascript
{
  sessionId: "test-session-001",
  command: { commandName: "PING", commandPayload: {} },
  latencySeconds: 5  // Override for testing
}
```

**Expected Result**:
- ✅ Status changes: `uplink_in_progress` → `executing` → `completed`
- ✅ Transition occurs at correct timestamps
- ✅ Progress updates emitted via WebSocket

**Pass Criteria**:
```javascript
// After 5 seconds
expect(queuedCommand.status).toBe('executing');

// After execution duration
expect(queuedCommand.status).toBe('completed');
expect(queuedCommand.completedAt).toBeDefined();
```

---

### Test: CQ-004 - Queue Statistics
**Purpose**: Verify accurate queue metrics

**Parameters**:
```javascript
// Enqueue 10 commands (5 complete, 3 executing, 2 pending)
```

**Expected Result**:
```javascript
{
  total: 10,
  pending: 2,
  completed: 5,
  failed: 0
}
```

**Pass Criteria**:
```javascript
const stats = commandQueue.getStats();
expect(stats.total).toBe(10);
expect(stats.pending).toBe(2);
expect(stats.completed).toBe(5);
```

---

## Phase 1: Step Validator Service

### Test: SV-001 - Beacon Received Validation
**Purpose**: Validate beacon reception detection

**Parameters**:
```javascript
{
  step: {
    completionCondition: {
      type: 'beacon_received',
      parameters: { beaconType: 'initial' }
    }
  },
  sessionState: {
    lastBeaconReceived: Date.now(),
    beaconType: 'initial'
  }
}
```

**Expected Result**:
```javascript
{
  isComplete: true,
  reason: "Beacon received (initial)",
  completedAt: [timestamp]
}
```

**Pass Criteria**:
```javascript
const result = stepValidator.validateBeacon(condition, sessionState);
expect(result.isComplete).toBe(true);
expect(result.reason).toContain('Beacon received');
```

---

### Test: SV-002 - Command Sequence Validation (Strict)
**Purpose**: Validate strict command sequence ordering

**Parameters**:
```javascript
{
  condition: {
    type: 'command_sequence',
    parameters: {
      requiredCommands: ['PING', 'UPDATETIME', 'DEPLOY_ANTENNA'],
      order: 'strict'
    }
  },
  commandHistory: [
    { commandName: 'PING', resultStatus: 'OK', issuedAt: '2026-01-31T10:00:00Z' },
    { commandName: 'UPDATETIME', resultStatus: 'OK', issuedAt: '2026-01-31T10:01:00Z' },
    { commandName: 'DEPLOY_ANTENNA', resultStatus: 'OK', issuedAt: '2026-01-31T10:02:00Z' }
  ]
}
```

**Expected Result**:
```javascript
{
  isComplete: true,
  reason: "Command sequence completed in order",
  completedAt: "2026-01-31T10:02:00Z"
}
```

**Pass Criteria**:
```javascript
const result = stepValidator.validateCommandSequence(condition, sessionState, commandHistory);
expect(result.isComplete).toBe(true);
expect(result.progress).toBe(undefined); // Only present if incomplete
```

---

### Test: SV-003 - Telemetry Threshold Validation
**Purpose**: Validate telemetry value comparisons

**Parameters**:
```javascript
{
  condition: {
    type: 'telemetry_threshold',
    parameters: {
      subsystem: 'power',
      parameter: 'currentCharge_percent',
      operator: 'gte',
      value: 50
    }
  },
  sessionState: {
    telemetry: {
      power: { currentCharge_percent: 75 }
    }
  }
}
```

**Expected Result**:
```javascript
{
  isComplete: true,
  reason: "power.currentCharge_percent gte 50 (current: 75)",
  currentValue: 75
}
```

**Pass Criteria**:
```javascript
const result = stepValidator.validateTelemetry(condition, sessionState);
expect(result.isComplete).toBe(true);
expect(result.currentValue).toBe(75);
```

---

## Phase 2: Visibility Calculator Service

### Test: VC-001 - Ground Station Visibility
**Purpose**: Verify line-of-sight calculations

**Parameters**:
```javascript
{
  satelliteOrbit: {
    altitude_km: 415,
    inclination_degrees: 51.6,
    eccentricity: 0.0001
  },
  groundStation: {
    stationId: 'gs-goldstone',
    displayName: 'Goldstone',
    location: {
      latitude: 35.426,
      longitude: -116.89,
      altitude: 1.0
    }
  },
  currentTime: Date.now()
}
```

**Expected Result**:
```javascript
{
  isVisible: true,  // or false depending on orbital position
  elevation: 15.5,  // degrees (>5 for visibility)
  azimuth: 178.3,   // degrees
  range: 1250.7,    // km
  rangeRate: -2.3,  // km/s
  signalStrength: 82, // 0-100
  passDuration: 540,  // seconds
  maxElevation: 45.2  // degrees
}
```

**Pass Criteria**:
```javascript
const visibility = visCalc.calculateVisibility(orbit, station, time);

if (visibility.isVisible) {
  expect(visibility.elevation).toBeGreaterThan(5);
  expect(visibility.azimuth).toBeGreaterThanOrEqual(0);
  expect(visibility.azimuth).toBeLessThanOrEqual(360);
  expect(visibility.range).toBeGreaterThan(0);
  expect(visibility.signalStrength).toBeGreaterThanOrEqual(0);
  expect(visibility.signalStrength).toBeLessThanOrEqual(100);
}
```

---

### Test: VC-002 - Next Pass Calculation
**Purpose**: Predict next ground station pass

**Parameters**:
```javascript
{
  satelliteOrbit: {
    altitude_km: 600,
    inclination_degrees: 97.5,
    eccentricity: 0.0001
  },
  groundStation: { /* Goldstone */ },
  currentTime: Date.now()
}
```

**Expected Result**:
```javascript
{
  startTime: [future timestamp],
  duration: 480,      // seconds
  maxElevation: 38.5, // degrees
  timeUntilPass: 3240 // seconds
}
```

**Pass Criteria**:
```javascript
const nextPass = visCalc.calculateNextPass(orbit, station, time);
expect(nextPass).toBeDefined();
expect(nextPass.startTime).toBeGreaterThan(time);
expect(nextPass.duration).toBeGreaterThan(0);
expect(nextPass.maxElevation).toBeGreaterThan(5);
```

---

### Test: VC-003 - Signal Strength Calculation
**Purpose**: Verify signal degradation with range/elevation

**Parameters**:
```javascript
{
  elevation: 10,  // degrees
  range: 2000     // km
}
```

**Expected Result**:
```javascript
{
  signalStrength: 45  // ~45% at low elevation, far range
}
```

**Pass Criteria**:
```javascript
// Signal should be lower at greater range
const strength1 = visCalc.calculateSignalStrength(45, 1000); // High elevation, close
const strength2 = visCalc.calculateSignalStrength(10, 2000); // Low elevation, far

expect(strength1).toBeGreaterThan(strength2);
expect(strength2).toBeGreaterThanOrEqual(0);
expect(strength2).toBeLessThanOrEqual(100);
```

---

## Phase 3: Time Controller Service

### Test: TC-001 - Time Scale Setting
**Purpose**: Verify time acceleration control

**Parameters**:
```javascript
{
  sessionId: "test-session-001",
  newScale: 60,
  reason: "waiting_for_pass"
}
```

**Expected Result**:
```javascript
{
  scale: 60,
  mode: "auto",
  previousScale: 1,
  reason: "waiting_for_pass"
}
```

**Pass Criteria**:
```javascript
const result = timeController.setTimeScale(sessionId, 60, reason);
expect(result.scale).toBe(60);
expect(result.previousScale).toBe(1);
```

---

### Test: TC-002 - Critical Operation Time Adjustment
**Purpose**: Verify automatic slowdown during critical ops

**Parameters**:
```javascript
{
  sessionId: "test-session-001",
  isActive: true,
  operationType: "orbital_maneuver"
}
```

**Expected Result**:
- ✅ Time scale reduced to ≤1x (real-time or slower)
- ✅ Previous scale saved for restoration

**Pass Criteria**:
```javascript
timeController.setTimeScale(sessionId, 100);
timeController.setCriticalOperation(sessionId, true, 'orbital_maneuver');

const state = timeController.getTimeState(sessionId);
expect(state.scale).toBeLessThanOrEqual(1);
expect(state.criticalOperationActive).toBe(true);
```

---

### Test: TC-003 - Time Prompt Creation
**Purpose**: Generate operator prompts for time acceleration

**Parameters**:
```javascript
{
  sessionId: "test-session-001",
  reason: "long_wait",
  suggestedScale: 60,
  estimatedWaitTime: 2700  // 45 minutes
}
```

**Expected Result**:
```javascript
{
  id: "time_prompt_[timestamp]",
  sessionId: "test-session-001",
  reason: "long_wait",
  suggestedScale: 60,
  estimatedWaitTime: 2700,
  currentScale: 1,
  timestamp: [current time]
}
```

**Pass Criteria**:
```javascript
const prompt = timeController.createTimePrompt(sessionId, reason, scale, waitTime);
expect(prompt.id).toMatch(/^time_prompt_\d+$/);
expect(prompt.suggestedScale).toBe(60);
```

---

## Phase 4: Orbital Mechanics Service

### Test: OM-001 - TLE Parsing
**Purpose**: Verify Two-Line Element parsing

**Parameters**:
```javascript
{
  line1: "1 25544U 98067A   24031.50000000  .00016717  00000-0  10270-3 0  9005",
  line2: "2 25544  51.6416 339.8014 0002735  32.4851  14.8192 15.50574920437487"
}
```

**Expected Result**:
- ✅ Valid satellite record created
- ✅ No parsing errors
- ✅ Orbital elements extracted correctly

**Pass Criteria**:
```javascript
const satrec = orbitalMechanics.createSatelliteRecord(line1, line2);
expect(satrec).toBeDefined();
expect(satrec.error).toBe(0);
expect(satrec.satnum).toBe(25544);
```

---

### Test: OM-002 - SGP4 Propagation
**Purpose**: Verify satellite position calculation

**Parameters**:
```javascript
{
  satrec: [ISS satellite record],
  date: new Date('2026-01-31T12:00:00Z')
}
```

**Expected Result**:
```javascript
{
  position: { x: 1234.5, y: -5678.9, z: 3456.7 },  // ECI km
  velocity: { x: 7.2, y: 1.5, z: -0.8 }            // ECI km/s
}
```

**Pass Criteria**:
```javascript
const posVel = orbitalMechanics.propagate(satrec, date);
expect(posVel.position).toBeDefined();
expect(posVel.velocity).toBeDefined();

// ISS altitude ~400-420 km
const altitude = Math.sqrt(
  posVel.position.x**2 + posVel.position.y**2 + posVel.position.z**2
) - 6371;
expect(altitude).toBeGreaterThan(400);
expect(altitude).toBeLessThan(430);
```

---

### Test: OM-003 - Eclipse Calculation
**Purpose**: Verify Earth shadow detection

**Parameters**:
```javascript
{
  satPosition: { x: 4000, y: 3000, z: 1000 },  // ECI km
  timestamp: Date.now()
}
```

**Expected Result**:
```javascript
{
  inEclipse: true,    // or false
  inUmbra: false,     // full shadow
  inPenumbra: true,   // partial shadow
  shadowFraction: 0.5 // 0-1
}
```

**Pass Criteria**:
```javascript
const eclipse = orbitalMechanics.calculateEclipse(satPosition, timestamp);
expect(eclipse.shadowFraction).toBeGreaterThanOrEqual(0);
expect(eclipse.shadowFraction).toBeLessThanOrEqual(1);

if (eclipse.inUmbra) {
  expect(eclipse.shadowFraction).toBe(1.0);
}
```

---

## Phase 5: Performance Tracker Service

### Test: PT-001 - Session Initialization
**Purpose**: Initialize performance tracking

**Parameters**:
```javascript
{
  sessionId: "test-session-001",
  scenario: {
    id: "sc-001",
    name: "First Contact",
    difficulty: "beginner",
    steps: [/* 5 steps */]
  }
}
```

**Expected Result**:
```javascript
{
  sessionId: "test-session-001",
  scenarioName: "First Contact",
  startTime: [timestamp],
  commands: { total: 0, correct: 0, incorrect: 0 },
  scores: { overall: 0, ... },
  achievements: []
}
```

**Pass Criteria**:
```javascript
const metrics = perfTracker.initializeSession(sessionId, scenario);
expect(metrics.sessionId).toBe(sessionId);
expect(metrics.steps.total).toBe(5);
expect(metrics.scores.overall).toBe(0);
```

---

### Test: PT-002 - Command Recording
**Purpose**: Track command execution

**Parameters**:
```javascript
{
  sessionId: "test-session-001",
  command: { commandName: "PING" },
  wasCorrect: true,
  wasRedundant: false
}
```

**Expected Result**:
- ✅ Command count incremented
- ✅ Correct command count incremented
- ✅ Scores updated

**Pass Criteria**:
```javascript
perfTracker.recordCommand(sessionId, command, true, false);
const metrics = perfTracker.getMetrics(sessionId);
expect(metrics.commands.total).toBe(1);
expect(metrics.commands.correct).toBe(1);
```

---

### Test: PT-003 - Achievement Detection
**Purpose**: Detect and award achievements

**Parameters**:
```javascript
{
  sessionMetrics: {
    errors: { count: 0 },
    commands: { total: 15 },
    // ... other metrics
  }
}
```

**Expected Result**:
```javascript
{
  achievements: [
    {
      id: 'perfect_commander',
      name: 'Perfect Commander',
      description: 'Complete mission with zero errors',
      badge: '🏆'
    }
  ]
}
```

**Pass Criteria**:
```javascript
perfTracker.checkAchievements(sessionId);
const metrics = perfTracker.getMetrics(sessionId);
const achievement = metrics.achievements.find(a => a.id === 'perfect_commander');
expect(achievement).toBeDefined();
```

---

## Phase 5: Certificate Generator Service

### Test: CG-001 - Certificate ID Generation (CRITICAL - CRYPTO)
**Purpose**: Verify cryptographically secure unique certificate IDs

**Parameters**:
```javascript
{
  userId: "user-12345678",
  sessionId: "session-abcdef123456"
}
```

**Expected Result**:
```javascript
"CERT-user-123-session-abcd-[UUID v4]"
// Example: "CERT-user-123-session-abcd-550e8400-e29b-41d4-a716-446655440000"
```

**Pass Criteria**:
```javascript
const certId1 = certGen.generateCertificateId(userId, sessionId);
const certId2 = certGen.generateCertificateId(userId, sessionId);

// Must use crypto.randomUUID() - verify format
expect(certId1).toMatch(/^CERT-[a-z0-9]{8}-[a-z0-9]{12}-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

// Must be unique even with same inputs
expect(certId1).not.toBe(certId2);

// Test collision resistance: Generate 10,000 certificates
const ids = new Set();
for (let i = 0; i < 10000; i++) {
  const id = certGen.generateCertificateId(userId, `session-${i}`);
  expect(ids.has(id)).toBe(false); // No duplicates
  ids.add(id);
}
expect(ids.size).toBe(10000);
```

**Security Requirements**:
- ✅ MUST use `crypto.randomUUID()` (Node.js built-in)
- ✅ MUST NOT use `Math.random()`
- ✅ MUST be globally unique across all users and sessions
- ✅ MUST be unpredictable (no sequential patterns)

---

### Test: CG-002 - Mission Certificate Generation
**Purpose**: Generate complete mission certificate

**Parameters**:
```javascript
{
  userId: "user-123",
  userName: "Commander Smith",
  sessionMetrics: {
    sessionId: "session-001",
    endTime: Date.now(),
    startTime: Date.now() - 1800000, // 30 min ago
    scores: { overall: 92 },
    tier: { name: 'EXCELLENT', label: 'Excellent', badge: '🌟' },
    commands: { total: 25 },
    steps: { completed: 5, total: 5 },
    achievements: []
  },
  scenario: {
    name: "First Contact",
    description: "Establish communication with satellite"
  }
}
```

**Expected Result**:
```javascript
{
  id: "CERT-[unique-id]",
  userId: "user-123",
  userName: "Commander Smith",
  type: "mission_completion",
  template: "excellent_performance",
  mission: {
    name: "First Contact",
    difficulty: "intermediate",
    sessionId: "session-001"
  },
  performance: {
    overallScore: 92,
    tier: { name: 'EXCELLENT', ... },
    duration: "30m 0s",
    commandsIssued: 25,
    stepsCompleted: "5/5"
  },
  completionDate: "2026-01-31T18:00:00.000Z",
  shareableText: "🌟 Commander Smith just completed..."
}
```

**Pass Criteria**:
```javascript
const cert = certGen.generateMissionCertificate(userId, userName, metrics, scenario);
expect(cert.id).toBeDefined();
expect(cert.performance.overallScore).toBe(92);
expect(cert.template).toBe('excellent_performance');
expect(cert.shareableText).toContain('Commander Smith');
```

---

### Test: CG-003 - Performance Analysis
**Purpose**: Generate strengths and improvements feedback

**Parameters**:
```javascript
{
  sessionMetrics: {
    scores: {
      commandAccuracy: 95,
      responseTime: 85,
      resourceManagement: 70,
      completionTime: 90,
      errorAvoidance: 100
    },
    errors: { count: 0 }
  }
}
```

**Expected Result**:
```javascript
{
  strengths: [
    "Excellent command accuracy...",
    "Perfect execution - no errors..."
  ],
  improvements: [
    "Focus on conserving power and fuel resources"
  ],
  overallFeedback: "Outstanding performance! You demonstrated..."
}
```

**Pass Criteria**:
```javascript
const analysis = certGen.analyzePerformance(metrics);
expect(analysis.strengths.length).toBeGreaterThan(0);
expect(analysis.overallFeedback).toBeDefined();
```

---

## Integration Tests

### Test: INT-001 - Complete Mission Simulation
**Purpose**: End-to-end simulation with all services

**Scenario**: First Contact Mission

**Steps**:
1. Start simulation session
2. Command queue initialized
3. Beacon transmitted after 45 min (accelerated)
4. Operator sends PING command
5. Command queued with latency
6. Ground station visibility checked
7. Command executed when visible
8. Step validated as complete
9. Performance tracked throughout
10. Certificate generated on completion

**Expected Result**:
- ✅ All services communicate correctly
- ✅ WebSocket events emitted
- ✅ Session state consistent
- ✅ Certificate generated with unique ID
- ✅ Performance metrics accurate

**Pass Criteria**:
```javascript
// Full workflow test
const sessionId = await startSimulation(satellite);
const commandId = await enqueueCommand(sessionId, { commandName: 'PING' });

// Wait for command execution
await waitForCommandStatus(commandId, 'completed');

// Check step validation
const stepResult = await validateStep(sessionId, step1);
expect(stepResult.isComplete).toBe(true);

// Complete mission
const certificate = await completeMission(sessionId);
expect(certificate.id).toMatch(/^CERT-/);
expect(certificate.performance.overallScore).toBeGreaterThan(0);
```

---

### Test: INT-002 - Beacon Reception During Ground Pass
**Purpose**: Verify beacon only received during visibility

**Steps**:
1. Start simulation
2. Beacon transmitted (satellite not visible)
3. Wait for orbital propagation
4. Beacon transmitted (satellite now visible)

**Expected Result**:
- ✅ First beacon: `beacon:transmitted` event (not received)
- ✅ Second beacon: `beacon:received` event with station info
- ✅ Step validator recognizes beacon reception

**Pass Criteria**:
```javascript
const beaconEvents = [];
socket.on('beacon:transmitted', (data) => beaconEvents.push({ type: 'transmitted', data }));
socket.on('beacon:received', (data) => beaconEvents.push({ type: 'received', data }));

// Trigger beacons
await transmitBeacon(sessionId, 'periodic');
await waitForOrbitalPass();
await transmitBeacon(sessionId, 'periodic');

expect(beaconEvents[0].type).toBe('transmitted');
expect(beaconEvents[1].type).toBe('received');
expect(beaconEvents[1].data.groundStation).toBeDefined();
```

---

## Performance Tests

### Test: PERF-001 - Command Queue Throughput
**Purpose**: Verify queue handles high command volume

**Parameters**:
```javascript
{
  sessionId: "perf-test-001",
  commandCount: 100,
  concurrency: 10
}
```

**Expected Result**:
- ✅ All 100 commands enqueued successfully
- ✅ No memory leaks
- ✅ Average enqueue time < 10ms
- ✅ Queue processing remains stable

**Pass Criteria**:
```javascript
const startTime = Date.now();
const commandIds = [];

for (let i = 0; i < 100; i++) {
  const id = commandQueue.enqueueCommand(command);
  commandIds.push(id);
}

const duration = Date.now() - startTime;
expect(duration).toBeLessThan(1000); // < 1 second for 100 commands
expect(commandIds.length).toBe(100);
```

---

### Test: PERF-002 - Visibility Calculations
**Purpose**: Verify calculation performance

**Parameters**:
```javascript
{
  iterations: 1000,
  groundStations: 5
}
```

**Expected Result**:
- ✅ 1000 calculations complete in < 5 seconds
- ✅ Average calculation time < 5ms
- ✅ No memory accumulation

**Pass Criteria**:
```javascript
const startTime = Date.now();

for (let i = 0; i < 1000; i++) {
  visCalc.calculateVisibility(orbit, station, Date.now() + i * 1000);
}

const duration = Date.now() - startTime;
expect(duration).toBeLessThan(5000);
```

---

## Security Tests

### Test: SEC-001 - Certificate ID Uniqueness (CRITICAL)
**Purpose**: Prevent certificate ID collisions

**Parameters**:
```javascript
{
  iterations: 100000,
  userId: "same-user",
  sessionId: "same-session"
}
```

**Expected Result**:
- ✅ 100,000 unique IDs generated
- ✅ No duplicates found
- ✅ Uses crypto.randomUUID()

**Pass Criteria**:
```javascript
const ids = new Set();

for (let i = 0; i < 100000; i++) {
  const id = certGen.generateCertificateId(userId, sessionId);
  expect(ids.has(id)).toBe(false);
  ids.add(id);
}

expect(ids.size).toBe(100000);
```

---

### Test: SEC-002 - Certificate Validation
**Purpose**: Verify certificate integrity

**Parameters**:
```javascript
{
  certificateId: "CERT-user-123-session-abc-[uuid]",
  certificateData: { /* valid certificate */ }
}
```

**Expected Result**:
- ✅ Valid certificates pass validation
- ✅ Tampered certificates rejected
- ✅ Missing fields rejected

**Pass Criteria**:
```javascript
const validCert = certGen.generateMissionCertificate(...);
expect(certGen.validateCertificate(validCert.id, validCert)).toBe(true);

// Test tampered ID
expect(certGen.validateCertificate('fake-id', validCert)).toBe(false);

// Test missing required field
delete validCert.userId;
expect(certGen.validateCertificate(validCert.id, validCert)).toBe(false);
```

---

## 🚀 Running the Tests

### Setup

```bash
cd backend

# Install dependencies
npm install

# Install additional test dependencies if needed
npm install --save-dev supertest @types/jest
```

### Execute Tests

```bash
# Run all Mission Control tests
npm test -- --testPathPattern=mission-control

# Run specific service tests
npm test -- commandQueue.test.js
npm test -- stepValidator.test.js
npm test -- visibilityCalculator.test.js
npm test -- timeController.test.js
npm test -- performanceTracker.test.js
npm test -- orbitalMechanics.test.js
npm test -- certificateGenerator.test.js

# Run with coverage
npm test -- --coverage --testPathPattern=mission-control

# Run integration tests
npm test -- --testPathPattern=integration/mission-control

# Run performance tests
npm test -- --testPathPattern=performance/mission-control

# Run security tests
npm test -- --testPathPattern=security/mission-control
```

### Test Structure

```
backend/tests/
├── unit/
│   └── mission-control/
│       ├── commandQueue.test.js
│       ├── stepValidator.test.js
│       ├── visibilityCalculator.test.js
│       ├── timeController.test.js
│       ├── performanceTracker.test.js
│       ├── orbitalMechanics.test.js
│       └── certificateGenerator.test.js
├── integration/
│   └── mission-control/
│       ├── simulation-workflow.test.js
│       ├── beacon-system.test.js
│       └── end-to-end.test.js
├── performance/
│   └── mission-control/
│       ├── queue-throughput.test.js
│       └── visibility-calc.test.js
└── security/
    └── mission-control/
        └── certificate-security.test.js
```

---

## ✅ Pass/Fail Criteria

### Individual Test Pass Criteria
- All assertions pass
- No uncaught exceptions
- No memory leaks
- Execution time within limits
- Expected output matches actual output

### Test Suite Pass Criteria
- ✅ **Unit Tests**: 100% pass rate
- ✅ **Integration Tests**: 100% pass rate
- ✅ **Performance Tests**: Meet performance targets
- ✅ **Security Tests**: No vulnerabilities detected
- ✅ **Coverage**: >80% code coverage

### Critical Test Requirements
- **Certificate Generator**: MUST use `crypto.randomUUID()` (SEC-001)
- **No Math.random()**: MUST NOT use for any security-sensitive operations
- **Unique IDs**: MUST generate collision-free certificate IDs
- **Data Integrity**: MUST validate all input parameters
- **Error Handling**: MUST gracefully handle all error conditions

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: Tests timeout
**Solution**: Increase Jest timeout for long-running tests
```javascript
jest.setTimeout(30000); // 30 seconds
```

#### Issue: WebSocket events not received
**Solution**: Ensure socket.io-client is connected before emitting
```javascript
await waitForSocketConnection(socket);
```

#### Issue: Orbital mechanics calculations fail
**Solution**: Verify satellite.js library is installed
```bash
npm install satellite.js
```

#### Issue: Certificate ID collisions in tests
**Solution**: Verify crypto.randomUUID() is being used, not Math.random()

---

## 📊 Test Reporting

### Generate Test Report

```bash
# Generate HTML coverage report
npm test -- --coverage --coverageReporters=html

# View report
open coverage/index.html
```

### CI/CD Integration

Tests should run automatically on:
- Every commit to feature branches
- Pull requests to main
- Before deployment

### Test Metrics to Track
- ✅ Pass rate (target: 100%)
- ✅ Code coverage (target: >80%)
- ✅ Test execution time
- ✅ Flaky test rate (target: 0%)
- ✅ Performance benchmarks

---

## 📝 Test Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Follow naming convention: `[service].test.js`
3. Include test ID in describe block
4. Document expected results
5. Update this document with test details

### Updating Tests
1. Update test when service behavior changes
2. Document changes in git commit
3. Ensure backward compatibility where possible
4. Update passing criteria if needed

### Removing Tests
1. Document reason for removal
2. Ensure functionality is tested elsewhere
3. Update this document

---

## 🔗 Related Documentation

- [Mission Control Enhancement Plan](../../docs/implementation/MISSION_CONTROL_ENHANCEMENT_PLAN.md)
- [Implementation Progress](../../docs/implementation/MISSION_CONTROL_IMPLEMENTATION_PROGRESS.md)
- [General Testing Guide](./TESTING_GUIDE.md)
- [Comprehensive Test Plan](./COMPREHENSIVE_TEST_PLAN.md)

---

**Last Updated**: January 31, 2026  
**Version**: 1.0.0  
**Status**: Active - All tests required for deployment
