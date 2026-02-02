# GroundCTRL - Mission Control Platform

## Virtual Satellite Simulator

**GroundCTRL** is a browser-based training simulator that introduces users to the fundamentals of satellite operations through interactive, guided missions. Players manage a virtual Earth-orbiting satellite using a simplified mission console, real-time AI guidance, and structured objectives that blend learning with gameplay. Designed for space enthusiasts, students, and new operators, the platform provides visual feedback, step-by-step tutorials, and progress tracking. The simulator runs in modern desktop browsers and aims to make satellite operations education engaging, accessible, and beginner-friendly. Built with **React**, **Node.js**, and **Firebase**.

![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Database-Firebase-FFCA28?logo=firebase&logoColor=white)

---

## Team

- **Full Stack Engineer**  
  - Austin Allen Carlson — [@aacarlson](https://github.com/growthwithcoding)

- **Frontend Software Engineers**  
  - Daniel Ocampo — [@Danielsoftware033](https://github.com/Danielsoftware033)

- **Backend Software Engineers**  
  - Cameron Carmody — [@gotcurds](https://github.com/gotcurds)
  - Tessa Robinson — [@TeslamodelIT](https://github.com/TeslamodelIT)
  
- **Cybersecurity**  
  - Mohana Gautam — [@mohanag7-SHIV](https://github.com/mohanag7-SHIV)

- **Quality Assurance**  
  - Adam Colyer — [@AColyer13](https://github.com/AColyer13)

## ✨ Implemented Features

### 👨‍💼 Admin Scenario Management (February 2026)
Comprehensive admin interface for creating and managing training scenarios:
- **Scenario List Interface** - Search, filter, and manage all scenarios with CRUD operations
- **Multi-mode Editor** - Create new scenarios, edit existing ones, or view in read-only mode
- **Dynamic Step Management** - Build multi-step guided missions with objectives and hints
- **Satellite Configuration** - Link scenarios to satellites and configure ground stations
- **Publishing Controls** - Draft, publish, archive workflows with status management
- **Admin Access Control** - Role-based routing with AdminRoute guard component

📚 Documentation:
- [SCENARIO_CREATOR_PLAN.md](./SCENARIO_CREATOR_PLAN.md) - Implementation plan and features

### 🎮 Simulator State Management (January 2026)
Comprehensive real-time state tracking and synchronization system:
- **Command Tracking** - Track all commands executed since session start with full history
- **Telemetry Updates** - Real-time satellite telemetry updates every 2 seconds with 100-snapshot history
- **Scenario Step Progression** - Automatic/manual mission step completion with progress tracking
- **SocketIO Synchronization** - Real-time state sync between frontend and backend
- **Command Effects** - Commands actually affect simulation physics (orbital maneuvers, power draw, etc.)
- **Alert System** - System alerts with acknowledgment tracking
- **State Persistence** - Automatic Firestore persistence and recovery

📚 Documentation:
- [SIMULATOR_STATE_MANAGEMENT.md](./SIMULATOR_STATE_MANAGEMENT.md) - Technical architecture
- [SIMULATOR_STATE_INTEGRATION_GUIDE.md](./SIMULATOR_STATE_INTEGRATION_GUIDE.md) - Integration examples

### 🏠 Homepage Mission Display (January 2026)
Dynamic mission suggestion system showing in-progress and next available missions based on user progress.

📚 Documentation: [HOMEPAGE_MISSION_DISPLAY.md](./HOMEPAGE_MISSION_DISPLAY.md)

### 🚀 Mission Start Modal (January 2026)
Interactive mission briefing interface with scenario details and start controls.

📚 Documentation: [MISSION_START_MODAL.md](./MISSION_START_MODAL.md)

### 🧹 Mock Data Removal (January 2026)
Migrated from hardcoded mock data to Firebase-backed real data.

📚 Documentation: [MOCK_DATA_REMOVAL.md](./MOCK_DATA_REMOVAL.md)

### 🔧 Firestore Index Management (January 2026)
Comprehensive Firestore index configuration for optimized queries.

📚 Documentation: [FIRESTORE_INDEX_FIX.md](./FIRESTORE_INDEX_FIX.md)

## 🧪 Automated Testing Suite (January 2026)

Comprehensive testing automation with Jest, SuperTest, and Playwright:

### Quick Start
```bash
# Backend tests
cd backend
npm install
npm test

# Frontend E2E tests (CURRENTLY DISABLED)
# E2E tests have been temporarily removed to prevent interference with development
# They will be re-implemented in a future update when the frontend is more stable
```

### Test Categories
- **Unit Tests**: Jest for isolated component testing
- **Integration Tests**: SuperTest for API endpoint testing  
- **E2E Tests**: ⚠️ Temporarily disabled (future implementation planned)
- **Security Tests**: Security vulnerability testing
- **CI/CD**: Automated testing on every PR

### Available Commands
```bash
# Backend testing
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests (requires emulators)
npm run test:security      # Security tests
npm run test:coverage      # With coverage report

# Frontend E2E testing - TEMPORARILY DISABLED
# npm run test:e2e          # (Removed - will be restored in future update)
# npm run test:e2e:ui       # (Removed - will be restored in future update)
# npm run test:e2e:headed   # (Removed - will be restored in future update)
```

### CI/CD Integration
- ✅ Automated testing on every Pull Request
- ⚠️ Multi-browser E2E testing (temporarily disabled)
- ✅ Test result summaries and artifact collection
- ✅ Firebase emulator integration for isolated testing

📚 **Complete Testing Documentation**: [backend/tests/](backend/tests/)
- **[Quick Start Guide](backend/tests/QUICKSTART.md)** - Get started in 5 minutes
- **[Installation Guide](backend/tests/INSTALLATION.md)** - Complete setup instructions
- **[Testing Guide](backend/tests/TESTING_GUIDE.md)** - Comprehensive documentation
- **[E2E Testing](backend/tests/E2E_TESTING.md)** - Playwright setup and usage
---
