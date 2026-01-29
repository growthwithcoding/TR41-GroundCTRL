# GroundCTRL - Virtual Satellite Simulator

Browser-based training simulator for satellite operations. Learn fundamentals through interactive, guided missions with real-time AI guidance.

**Successfully migrated from Next.js to React + Vite!**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
//hey whats up 
## 📦 Tech Stack

- **React 19.2** - UI library
- **Vite 5.x** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Tailwind CSS v4** - Modern utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Firebase 12.8** - Authentication & database
- **React Helmet Async** - SEO & metadata management
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **React Hook Form + Zod** - Form management and validation
- **@fontsource** - Self-hosted fonts (Geist Sans, Geist Mono, JetBrains Mono)
- **next-themes** - Theme management (dark/light mode)
- **Sonner** - Toast notifications

## 🗂️ Project Structure

```
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Root component with routes
│   ├── index.css             # Global styles
│   ├── pages/                # Route components
│   │   ├── Index.jsx         # Home page
│   │   ├── Dashboard.jsx     # User dashboard
│   │   ├── Simulator.jsx     # Satellite simulator
│   │   ├── Missions.jsx      # Mission selection
│   │   ├── MissionBriefing.jsx
│   │   ├── Account.jsx       # User account settings
│   │   ├── Settings.jsx      # App settings
│   │   ├── Help.jsx          # Help center
│   │   ├── HelpArticle.jsx   # Help article details
│   │   ├── Contact.jsx       # Contact page
│   │   ├── Privacy.jsx       # Privacy policy
│   │   ├── Terms.jsx         # Terms of service
│   │   └── NotFound.jsx      # 404 page
│   ├── components/           # Reusable components
│   │   ├── ui/              # Radix UI components
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── simulator/       # Simulator components
│   │   ├── missions/        # Mission components
│   │   ├── auth-form.jsx    # Authentication form
│   │   ├── nova-chat.jsx    # AI assistant chat
│   │   ├── app-header.jsx   # App header/navigation
│   │   ├── footer.jsx       # App footer
│   │   └── theme-*.jsx      # Theme components
│   ├── hooks/               # Custom React hooks
│   │   ├── use-auth.jsx     # Authentication hook
│   │   ├── use-mobile.js    # Mobile detection
│   │   └── use-toast.js     # Toast notifications
│   ├── lib/                 # Utilities and data
│   │   ├── firebase/        # Firebase configuration
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── missions-data.js # Mission definitions
│   │   ├── help-data.js     # Help articles
│   │   ├── simulator-state.js
│   │   ├── simulator-types.js
│   │   └── utils.js         # Utility functions
├── public/                  # Static assets
│   ├── images/             # Image assets
│   ├── favicon.ico
│   └── *.png               # App icons
├── .env                    # Environment variables
├── vite.config.js         # Vite configuration
├── firebase.json          # Firebase Hosting config
├── components.json        # shadcn/ui config
├── postcss.config.mjs     # PostCSS config
└── package.json
```

## 🛣️ Routes

- `/` - Home page with authentication
- `/dashboard` - User dashboard (protected)
- `/simulator` - Satellite simulator (protected)
- `/missions` - Mission selection
- `/mission-briefing/:id` - Mission briefing details
- `/account` - User account settings (protected)
- `/settings` - Application settings (protected)
- `/help` - Help center
- `/help/article/:slug` - Help article details
- `/contact` - Contact page
- `/privacy` - Privacy policy
- `/terms` - Terms of service

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 🚢 Deployment

### Firebase Hosting

```bash
# Build the project
npm run build

# Deploy to Firebase
npm run deploy
```

The app is configured for Firebase Hosting with:
- Project ID: `groundctrl-c8860`
- Region: `us-central1`
- Domain: `api.missionctrl.org`

### Other Platforms

The production build is in the `dist/` folder and can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
- Any static hosting service

## 🎯 Key Features

### Core Functionality
- ✅ Interactive satellite simulator with real-time controls
- ✅ Mission-based training system with progress tracking
- ✅ AI assistant (NOVA) for guidance and support
- ✅ Real-time command console with satellite interaction
- ✅ World map visualization for satellite tracking
- ✅ Dashboard with metrics and activity monitoring

### Technical Features
- ✅ Client-side routing with React Router v6
- ✅ Protected routes with authentication guards
- ✅ Self-hosted fonts for better performance and privacy
- ✅ Code splitting by route for optimal loading
- ✅ Optimized production builds
- ✅ Firebase authentication and Firestore integration
- ✅ Dark/light theme support with system preference detection
- ✅ SEO-friendly with React Helmet
- ✅ Responsive design for all screen sizes
- ✅ Form validation with React Hook Form and Zod
- ✅ Toast notifications for user feedback
- ✅ Comprehensive UI component library

## 📝 Migration Notes

This project was successfully migrated from Next.js to React + Vite while preserving:
- ✅ All functionality
- ✅ All UI components
- ✅ All routes (converted from Next.js file-based to React Router)
- ✅ Authentication system
- ✅ Theme switching
- ✅ Firebase integration

### Changes Made:
- Converted Next.js App Router to React Router v6
- Replaced `next/link` with React Router `Link`
- Replaced `next/navigation` hooks with React Router equivalents (`useNavigate`, `useParams`, `useLocation`)
- Removed "use client" directives (not needed in React)
- Updated environment variables (`NEXT_PUBLIC_*` → `VITE_*`)
- Migrated fonts to `@fontsource` packages
- Added React Helmet for metadata management
- Configured Vite for optimal performance
- Updated routing structure to explicit route definitions

## 🛠️ Development

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Type check and build
npm run build:check

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🎨 UI Components

This project uses a custom component library built on Radix UI primitives and styled with Tailwind CSS. Components include:

- **Layout**: Card, Separator, Scroll Area, Resizable Panels
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch, Slider
- **Feedback**: Toast, Alert, Alert Dialog, Progress, Spinner, Skeleton
- **Navigation**: Navigation Menu, Menubar, Breadcrumb, Tabs, Pagination
- **Overlay**: Dialog, Sheet, Drawer, Popover, Hover Card, Tooltip, Dropdown Menu
- **Data Display**: Table, Badge, Avatar, Calendar, Chart, Accordion
- **And more**: Button, Toggle, Command, Context Menu, etc.

## 🔒 Authentication

The app uses Firebase Authentication with support for:
- Email/password authentication
- Protected routes requiring login
- Persistent authentication state
- User profile management

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop (1920px and above)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🤝 Contributing

This is a private project. For questions or contributions, contact the EIM Development Team.

## 📄 License

Private - All rights reserved

## 👥 Contributors

EIM Development Team

---

**Last Updated**: January 2026
