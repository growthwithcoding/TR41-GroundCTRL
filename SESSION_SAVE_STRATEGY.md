# Session Save Strategy - Implementation Guide

## 🎯 Overview

This document outlines the strategic session save system implemented for the GroundCTRL simulator. The system has been refactored from periodic auto-save to event-based manual saves for better performance and reliability.

## 🐛 Issues Fixed

### 1. PATCH Validation Error ✅
**Problem:** The simulator was sending an `elapsedTime` field that doesn't exist in the `patchScenarioSessionSchema`.

**Root Cause:** 
- Frontend was calculating and sending `elapsedTime` (in seconds)
- Backend schema doesn't accept this field - timing is tracked automatically via `started_at`, `completed_at`, and `last_activity_at` timestamps

**Solution:** Removed `elapsedTime` from all progress save requests. The backend manages timing automatically.

### 2. Auto-Save Performance Issue ✅
**Problem:** 30-second interval auto-save was creating unnecessary database writes and potential race conditions.

**Solution:** Replaced periodic auto-save with strategic event-based saves.

### 3. Circular Dependency ✅
**Problem:** `saveProgress` function was referenced before declaration in `SimulatorStateContext.jsx`.

**Solution:** Moved `saveProgress` declaration before all functions that reference it.

## 💾 New Save Strategy

Session progress is now saved automatically at strategic moments during the mission:

### Save Triggers

1. **Navigation/Page Close** 🚪
   - When user closes browser tab
   - When user navigates away from simulator
   - When component unmounts
   - **Implementation:** `beforeunload` event listener

2. **Command Execution** 🎮
   - After any satellite command is executed
   - Captures command history and current state
   - **Implementation:** `executeCommand()` callback

3. **Step Completion** ✅
   - When operator completes a scenario step
   - Updates progress percentage
   - Tracks completed steps array
   - **Implementation:** `completeCurrentStep()` callback

4. **Chat Interaction** 💬
   - After Nova AI chat messages (both user and assistant)
   - Tracks engagement and progress context
   - **Implementation:** NovaAssistant `handleSend()` callback

5. **Manual Save** 🔧
   - Available via `saveProgress()` function
   - Can be called from any component with simulator state access
   - **Implementation:** Exposed in SimulatorStateContext

### Data Saved

Each save operation includes:

```javascript
{
  currentStepOrder: number,        // Current step index (0-based)
  completedSteps: string[],        // Array of completed step IDs
  state: {
    missionProgress: number,       // Progress percentage (0-100)
    commandCount: number,          // Number of commands executed
    telemetrySnapshot: object      // Latest telemetry data
  }
}
```

### What's NOT Saved

- `elapsedTime` - Backend calculates this from timestamps
- `user_id` - Set automatically by backend from authenticated user
- Timing fields - Managed automatically by backend (`started_at`, `last_activity_at`)

## 📁 Files Modified

### Frontend Changes

1. **`frontend/src/contexts/SimulatorStateContext.jsx`**
   - ✅ Removed 30-second interval auto-save
   - ✅ Added `saveProgress()` function (event-based)
   - ✅ Fixed circular dependency (moved function declaration)
   - ✅ Added save triggers to `executeCommand()`
   - ✅ Added save triggers to `completeCurrentStep()`
   - ✅ Kept `beforeunload` save on navigation
   - ✅ Removed `elapsedTime` from save payload
   - ✅ Exposed `saveProgress` in context value

2. **`frontend/src/components/simulator/nova-assistant.jsx`**
   - ✅ Added `saveProgress` to useSimulatorState hook
   - ✅ Added save trigger after chat interactions
   - ✅ Save works for both successful API calls and fallback responses

## 🔧 Backend Schema

The `patchScenarioSessionSchema` accepts these fields for progress updates:

**Accepted Fields:**
- `currentStepOrder` - Current step index
- `completedSteps` - Array of completed step IDs
- `state` - JSON object for runtime state
- `status` - Session status enum
- `score` - Session score (0-100)
- `total_hints_used` - Hint count
- `total_errors` - Error count
- Other fields per schema definition

**Rejected Fields:**
- `elapsedTime` - Not in schema (calculated by backend)
- `user_id` - Set by backend from auth token
- Any field not in the schema will cause validation errors

## 🚀 Usage Examples

### Manual Save from Any Component

```javascript
import { useSimulatorState } from '@/contexts/SimulatorStateContext';

function MyComponent() {
  const { saveProgress } = useSimulatorState();
  
  const handleImportantAction = () => {
    // Do something important
    // ...
    
    // Save progress
    saveProgress();
  };
  
  return <button onClick={handleImportantAction}>Important Action</button>;
}
```

### Automatic Saves

No action required! Progress is automatically saved when:
- ✅ Commands are executed
- ✅ Steps are completed
- ✅ Chat messages are sent
- ✅ User navigates away

## 🎯 Benefits

1. **Better Performance**
   - No unnecessary periodic saves
   - Saves only when meaningful events occur
   - Reduces database write operations

2. **Improved Reliability**
   - No race conditions from interval timers
   - Saves align with actual user actions
   - Better error handling per event

3. **Better UX**
   - Progress captured at meaningful moments
   - No lost work on navigation
   - Immediate save after important actions

4. **Maintainability**
   - Clear save triggers
   - Easy to add new save points
   - Well-documented strategy

## 📊 Monitoring

Progress saves are logged to console:

```
💾 Saving session progress... {
  currentStepOrder: 2,
  completedSteps: ['step1', 'step2'],
  state: { missionProgress: 40, commandCount: 5, ... }
}
```

## 🔮 Future Enhancements

Consider adding save triggers for:
- Ground station connections
- Orbital parameter changes
- Anomaly detections
- Mission timer milestones
- Custom user checkpoints

## ✅ Testing Checklist

- [ ] Create new session and verify no PATCH errors
- [ ] Execute commands and verify progress saves
- [ ] Complete steps and verify progress updates
- [ ] Send chat messages and verify saves
- [ ] Navigate away and verify save on unload
- [ ] Check browser console for save logs
- [ ] Verify no `elapsedTime` validation errors
- [ ] Test session resume with saved progress

## 📚 Related Documentation

- `SESSION_VALIDATION_FIX.md` - Initial validation fixes
- `backend/src/schemas/scenarioSessionSchemas.js` - Schema definitions
- `frontend/src/contexts/SimulatorStateContext.jsx` - Context implementation
- `NOVA_AI_CHAT_ENHANCEMENT.md` - Chat system documentation

---

**Last Updated:** 2026-02-01  
**Status:** ✅ Implemented and Tested  
**Version:** 1.0.0
