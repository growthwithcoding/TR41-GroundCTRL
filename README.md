# GroundCTRL - Mission Control Platform

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Database-Firebase-FFCA28?logo=firebase&logoColor=white)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**GroundCTRL** is a browser-based training simulator that introduces users to the fundamentals of satellite operations through interactive, guided missions. Players manage a virtual Earth-orbiting satellite using a simplified mission console, real-time AI guidance, and structured objectives that blend learning with gameplay.

## Table of Contents

- [✨ Features](#-features)
- [🛠️ Built With](#️-built-with)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [📸 Screenshots](#-screenshots)
- [🏗️ Project Structure](#️-project-structure)
- [🏛️ Architecture Overview](#️-architecture-overview)
- [💻 Development Workflow](#-development-workflow)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [📧 Contact](#-contact)

## ✨ Features

- **👨‍💼 Admin Scenario Management**: Create and manage training scenarios with multi-step guided missions
- **🎮 Real-Time Simulator**: Track commands, telemetry, and mission progress with Socket.IO synchronization
- **🏠 Dynamic Mission Display**: Personalized mission suggestions based on user progress
- **🚀 Interactive Mission Briefings**: Detailed scenario details with start controls
- **🔧 Optimized Firestore**: Comprehensive index configuration for performance
- **🤖 AI Guidance**: Real-time assistance for satellite operations
- **📊 Progress Tracking**: Automatic step completion and state persistence
- **🔒 Security First**: JWT authentication, rate limiting, and input validation

## 🛠️ Built With

- **[React](https://reactjs.org/)** - Frontend framework
- **[Node.js](https://nodejs.org/)** - Backend runtime
- **[Express](https://expressjs.com/)** - Web framework
- **[Firebase](https://firebase.google.com/)** - Database and authentication
- **[Socket.IO](https://socket.io/)** - Real-time communication
- **[Vite](https://vitejs.dev/)** - Build tool
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Radix UI](https://www.radix-ui.com/)** - UI components

## 🚀 Quick Start

Get GroundCTRL running locally in minutes:

```bash
git clone https://github.com/growthwithcoding/TR41-GroundCTRL.git
cd TR41-GroundCTRL

# Backend setup
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173` to start your satellite mission!

## 📦 Installation

### Prerequisites
- **Node.js** 18+ and **npm** 9+
- **Firebase CLI** (for emulators and deployment)
- **Git**

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/growthwithcoding/TR41-GroundCTRL.git
   cd TR41-GroundCTRL
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure Firebase credentials, API keys, etc.
   npm run dev           # Start development server on port 5000
   ```

3. **Frontend setup**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env  # Configure Firebase config, API endpoint, etc.
   npm run dev           # Start Vite dev server on port 5173
   ```

4. **Firebase Emulators (optional)**
   ```bash
   firebase emulators:start
   # Emulator UI at http://localhost:4000
   ```

### Project Environment Files
- `backend/.env` — Firebase config, JWT secrets, API keys, rate limits
- `frontend/.env` — Firebase project config, backend API URL
- `.firebaserc` — Firebase project mapping and deployment settings

See individual `README.md` files in `backend/` and `frontend/` for detailed setup instructions.

## 📸 Screenshots

*Screenshots and demo GIFs coming soon!*

## 🏗️ Project Structure

```
TR41-GroundCTRL/
├── backend/              # Node.js/Express API server
│   ├── src/
│   ├── tests/
│   └── package.json
├── frontend/             # React/Vite application
│   ├── src/
│   ├── tests/
│   └── package.json
├── docs/                 # Documentation
├── helper_scripts/       # Utility scripts
└── *.md                  # Project documentation
```

- **Backend:** Core server, API routes, tests and seeders in `backend/` — see [backend/README.md](backend/README.md)
- **Frontend:** App source, build and E2E config in `frontend/` — see [frontend/README.md](frontend/README.md)
- **Docs & Guides:** Project documentation at repository root

## 🏛️ Architecture Overview

**Frontend** (React 19 + Vite)
- Component-based UI with Radix UI for accessibility
- Real-time updates via Socket.IO
- Responsive design (mobile, tablet, desktop)
- Dark/light theme toggle with next-themes
- Form handling with React Hook Form + Zod validation

**Backend** (Node.js + Express)
- RESTful API with OpenAPI/Swagger docs
- Real-time WebSocket server (Socket.IO)
- Firebase Admin SDK for auth and Firestore
- Role-based access control (RBAC)
- Rate limiting and input validation
- Comprehensive test coverage (unit, integration, security)

**Database** (Firebase)
- **Firestore** — Primary datastore (scenarios, missions, user progress, telemetry)
- **Firebase Auth** — User authentication with custom claims
- **Firebase Emulators** — Local testing environment

**DevOps & Hosting**
- **Firebase Hosting** — Frontend deployment
- **Google Cloud App Hosting** — Backend deployment
- **GitHub Actions** — CI/CD automation (test, lint, build, deploy on PR/merge)

## 💻 Development Workflow

### Branching Strategy
- `main` — Production-ready code, auto-deployed
- Feature branches — `feature/ISSUE-description` or `fix/ISSUE-description`
- All PRs require passing tests and at least one review before merge

### Making Changes
1. Create a feature branch from `main`
2. Make your changes and commit with clear messages
3. Push your branch and open a PR with a description
4. Ensure CI/CD checks pass (tests, lint, build)
5. Request review from team members
6. Merge when approved; main auto-deploys

### Code Quality
- **Linting**: ESLint enforced on commits and CI
- **Testing**: Unit, integration, and E2E tests required
- **Type Safety**: TypeScript for frontend, JSDoc for backend
- **Security**: Snyk scanning, OWASP validation, rate limiting

## 🧪 Testing

Comprehensive multi-layer testing with **Jest + SuperTest** (backend) and **Playwright** (frontend E2E).

### Quick Start
```bash
# Backend tests
cd backend
npm test

# Frontend E2E tests
cd ../frontend
npm run test:e2e
```

### Test Structure

**Backend** (`backend/tests/`)
- Unit, integration, security, performance, and CI/CD tests

**Frontend** (`frontend/tests/e2e/`)
- Smoke, responsive design, theme, and lazy loading tests

### Available Commands

**Backend Testing**
```bash
cd backend
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:security     # Security tests
npm run test:performance  # Performance tests
npm run test:ci-cd        # Build & dependency checks
```

**Frontend E2E Testing** (Playwright)
```bash
cd frontend
npm run test:e2e           # Run E2E tests
npm run test:e2e:headed    # Run with visible browser
npm run test:e2e:debug     # Interactive debug mode
```

### CI/CD Integration
- ✅ Automated testing on every PR
- ✅ Backend: Jest unit, integration, security, and CI-CD tests
- ✅ Frontend: Playwright E2E tests on Chromium, Firefox, WebKit
- ✅ CodeQL security scanning and lint checks

📚 **Testing Documentation**: See [backend/tests/README.md](backend/tests/README.md) and [frontend/tests/README.md](frontend/tests/README.md)

### Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

For questions, issues, or suggestions:
- **Team**: Contact the development team through the repository

---

**Team**

- **Full Stack Engineer**: Austin Allen Carlson — [@aacarlson](https://github.com/growthwithcoding)
- **Backend Software Engineers**: Cameron Carmody — [@gotcurds](https://github.com/gotcurds), Tessa Robinson — [@TeslamodelIT](https://github.com/TeslamodelIT)
- **Quality Assurance / Cybersecurity Implentation and Testing**: Adam Colyer — [@AColyer13](https://github.com/AColyer13)
- **Cybersecurity Analyst**: Mohana Gautam — [@mohanag7-SHIV](https://github.com/mohanag7-SHIV)
- **Frontend Software Engineers**: Daniel Ocampo — [@Danielsoftware033](https://github.com/Danielsoftware033)


Thank you for using GroundCTRL!
