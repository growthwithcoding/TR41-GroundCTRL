# Frontend Fix Notes

## Launch Animation Issues

### Satellite Altitude Mismatch
- **Issue**: The launch animation currently uses hardcoded altitude values instead of actual satellite data from scenarioSession
- **Fix Required**: Update the animation to pull actual altitude from scenarioSession data
- **Dependencies**: May require WebSocket connection to get real-time satellite data

### Subsystem Status Indicators
- **Issue**: POWER, COMMS, ATTITUDE, PAYLOAD status lights may not match the actual scenario structure
- **Fix Required**: Verify that status lights accurately reflect the scenario's subsystem states
- **Location**: Check simulator components for subsystem status rendering
- **Dependencies**: Ensure data structure matches between scenario definition and UI components

## Next Steps
- Implement WebSocket connection for real-time data updates (See: WEBSOCKET_IMPLEMENTATION_PLAN.md)
- Once WebSocket is operational, verify data flow from scenarioSession to launch animation
- Test subsystem status indicators against various scenario configurations

---

# QA Findings & Testing Notes

## 🔐 Authentication & Authorization

### Google OAuth Integration
- **Issue**: Authorization UI with Google looks incorrect/funny
  - **Suggestion**: Replace with Mission Control branding/logo
  - **Priority**: Medium
  - **Status**: Needs design review

- **Issue**: Login errors from Google OAuth not handled gracefully
  - **Priority**: High
  - **Status**: Needs error handling implementation

- **Issue**: Error flashing on homepage before dashboard redirect
  - **Description**: Brief flash of error or homepage content before successful redirect to dashboard
  - **Priority**: High
  - **Status**: Needs routing fix

### Post-Login Routing
- **Decision Needed**: Dashboard or Homepage/Landing page after successful login?
  - **Current**: Unclear behavior
  - **Priority**: Medium
  - **Status**: Requires product decision

---

## 📊 Dashboard

### Working Features ✅
- **Styling**: Looks great! Visual design approved

### Issues Found 🔴

- **Quick Actions**: Not functioning correctly
  - **Priority**: High
  - **Status**: Needs investigation and fix

- **SAT-01 Status**: All status indicators working correctly?
  - **Priority**: High
  - **Status**: Requires testing with real satellite data

- **Mission Progress Widget**: Is it accurately tracking/displaying progress?
  - **Priority**: High
  - **Status**: Needs backend integration testing

- **Recent Activity Widget**: Is it displaying actual activity?
  - **Priority**: High
  - **Status**: Needs backend integration testing

---

## 🎯 Missions Page

### Backend Integration Required
- **Status**: Cannot fully test without real backend connection
- **Blocker**: Requires API integration
- **Priority**: High
- **Next Steps**: 
  - Connect to scenarios API
  - Test mission creation flow
  - Validate mission progress tracking
  - Test mission completion logic

---

## 🛰️ Simulator

### Working Features ✅
- **Visual Design**: Looks great! UI/UX approved

### Accuracy & Data Validation Needed 🔍

#### Telemetry Accuracy
- **Fuel Levels**: Are calculations accurate?
- **Battery Charge**: SOC (State of Charge) accurate?
- **Solar Power Generation**: Realistic power output?
- **Thermal Readings**: Temperature calculations correct?
- **Next Contact Times (AOS/LOS)**: Ground station pass predictions accurate?
- **Priority**: High
- **Status**: Requires orbital mechanics validation

#### Ground Control Stations
- **Feature Request**: Hide/Show ground control stations on map
  - **Priority**: Medium
  - **Status**: Enhancement

- **Constraint**: Satellites can only get new coordinates over ground stations
  - **Question**: Is this constraint properly enforced?
  - **Priority**: High
  - **Status**: Needs implementation verification

#### Satellite Classification
- **Current**: Generic satellite representation
- **Needed**: Types of satellites by:
  - Orbit (LEO, MEO, GEO)
  - Function (Communications, Earth Observation, Navigation, etc.)
  - Practical uses
- **Example**: Display "LEO-01" with orbit type and function
- **Priority**: Medium
- **Status**: Enhancement / Educational feature

#### Maneuvers
- **Question**: Are orbital maneuvers accurately simulated?
  - Delta-V calculations
  - Fuel consumption
  - Orbital parameter changes
- **Priority**: High
- **Status**: Requires validation

### Launch Animation 🚀

#### Current Issues
- Uses hardcoded altitude (see Launch Animation Issues above)
- Missing pre-launch sequence

#### Enhancement Request
- **Feature**: Complete launch sequence animation
  - **Pre-Launch**: Satellite preparation, integration
  - **Launch**: Liftoff, staging, orbit insertion
  - **Post-Launch**: Deployment, stabilization
- **Reference**: "How satellites are launched and how they stay there"
- **Priority**: Medium
- **Status**: Enhancement for educational value

---

## 📚 Educational Features

### Mode Selection Needed
- **Decision Required**: Free Play vs Education Mode
  - **Free Play**: Sandbox simulation
  - **Education Mode**: Guided learning with objectives
- **Priority**: Medium
- **Status**: Requires product decision

### Tutorial System
- **Question**: Tutorial vs Education - what's the difference?
  - **Tutorial**: Step-by-step guided walkthrough
  - **Education**: Reference material and learning content
- **Suggested Features**:
  - Power/Video tutorials
  - Interactive lessons
  - Quizzes/knowledge checks
- **Priority**: Medium
- **Status**: Requires design and content strategy

---

## ❓ Help Page

### Working Features ✅
- **Styling**: Good visual design

### Improvements Needed 🔧

- **Search Functionality**: 
  - **Current**: Needs better placement
  - **Suggested**: More central, prominent search
  - **Priority**: High

- **AI/Voice Mode Integration**:
  - **Feature**: Voice-activated help
  - **Integration**: Connect with NOVA AI assistant
  - **Priority**: Low
  - **Status**: Future enhancement

- **Content Organization**:
  - **Current**: Could be better organized
  - **Needed**: Clearer categorization, better navigation
  - **Priority**: Medium
  - **Status**: Content restructuring needed

---

## 🔌 WebSocket Integration

**See: WEBSOCKET_IMPLEMENTATION_PLAN.md for detailed implementation plan**

### Critical Issues

- **Real-time Data**: WebSocket fixes needed for live telemetry
  - **Priority**: Critical
  - **Status**: Implementation in progress

- **Session Persistence**: 
  - **Question**: On webpage exit, should simulation continue?
  - **Suggested**: Add confirmation popup
  - **Message**: "Do you want to exit? Simulator will continue running..."
  - **Priority**: High
  - **Status**: Needs UX decision and implementation

---

## 🔔 Notifications

### Issue
- **Status**: Notifications ain't working
- **Priority**: Medium
- **Details**: Need more information on expected notification behavior
- **Status**: Needs investigation

---

## 👤 Admin Features

### Frontend Admin Panel
- **Status**: Needs implementation
- **Priority**: High
- **Requirements**:
  - Admin user management interface
  - Role-based access control UI
  - Admin-specific features and views

### Admin Authentication
- **Current**: One-time use code for admin access
- **Issues**: 
  - Security concerns with one-time code
  - No persistent admin session management
- **Priority**: High
- **Status**: Needs security review and improvement

### User Roles
- **Required**: Admin vs User role differentiation
  - **Admin**: Full system access, user management, configuration
  - **User**: Standard operator access, limited to assigned missions
- **Priority**: High
- **Status**: Backend may exist, frontend UI needed

---

## 📋 Testing Priorities

### 🔴 Critical (Must Fix)
1. WebSocket real-time data integration
2. Google OAuth error handling
3. Dashboard Quick Actions functionality
4. Mission backend integration
5. SAT-01 status accuracy
6. Session exit/persistence handling

### 🟡 High Priority
1. Error flash on homepage before redirect
2. Telemetry accuracy validation (fuel, battery, solar, thermal)
3. Ground station coordinate updates
4. Maneuver accuracy
5. Admin panel frontend implementation
6. Help page search functionality

### 🟢 Medium Priority
1. Google login UI/branding
2. Post-login routing decision
3. Ground station hide/show feature
4. Satellite classification display
5. Educational mode vs free play
6. Help page organization
7. Notification system

### 🔵 Low Priority / Enhancements
1. Launch animation sequence
2. AI/Voice help mode
3. Tutorial vs education content strategy
4. Power/video tutorials

---

## 📝 Decisions Needed

1. **Post-Login Destination**: Dashboard or Landing Page?
2. **Simulation Persistence**: Continue on page exit or terminate?
3. **Educational Modes**: Free Play, Education, Tutorial - define each
4. **Admin Access**: Better security model than one-time code
5. **Satellite Types**: Which classifications to support initially?
