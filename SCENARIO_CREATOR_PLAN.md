# Scenario Creator Implementation Plan

**Assignment:** 🛠️ FEATURE: SCENARIO CREATOR (Admin)  
**Importance:** 🟡 MEDIUM  
**Your Role:** Frontend Developer

---

## ✅ What You Already Have

### Backend Infrastructure (Ready to Use!)

**1. Complete Scenario Schema** - `backend/src/schemas/scenarioSchemas.js`
```javascript
{
  code: string,               // e.g., "ROOKIE_ORBIT_101"
  title: string,              // Max 200 chars
  description: string,        // Max 2000 chars
  difficulty: enum,           // 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  tier: enum,                 // 'ROOKIE_PILOT' | 'MISSION_SPECIALIST' | 'MISSION_COMMANDER'
  type: enum,                 // 'GUIDED' | 'SANDBOX'
  estimatedDurationMinutes: number,
  status: enum,               // 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isActive: boolean,
  isCore: boolean,
  isPublic: boolean,
  satellite_id: string,
  initialState: {             // Optional - simulation seed data
    orbit: {...},
    power: {...},
    attitude: {...},
    thermal: {...},
    communications: {...}
  },
  consoleLayout: {            // Optional
    panels: string[],
    widgets: string[]
  },
  tags: string[],             // Optional
  objectives: string[],       // Optional
  prerequisites: string[]     // Optional - scenario IDs
}
```

**2. Scenario Steps Schema** - `backend/src/schemas/scenarioStepSchemas.js`
```javascript
{
  scenario_id: string,
  stepOrder: number,          // 1, 2, 3, ...
  title: string,              // Max 200 chars
  instructions: string,       // Max 2000 chars
  objective: string,          // Success criteria
  hints: string               // For NOVA AI tutor
}
```

**3. Backend API Endpoints (All Working!)**
- ✅ `POST /api/v1/scenarios` - Create scenario
- ✅ `PATCH /api/v1/scenarios/:id` - Update scenario
- ✅ `GET /api/v1/scenarios` - List scenarios
- ✅ `GET /api/v1/scenarios/:id` - Get scenario details
- ✅ `POST /api/v1/scenario-steps` - Create step
- ✅ `PATCH /api/v1/scenario-steps/:id` - Update step
- ✅ `GET /api/v1/scenario-steps?scenario_id=X` - List steps for scenario
- ✅ `GET /api/v1/satellites` - List satellites
- ✅ `POST /api/v1/satellites` - Create satellite
- ✅ `POST /api/v1/ai/help/ask` - Ask NOVA for help (can use for generation)

**4. Admin Role Check** - `backend/src/services/userService.js`
- Backend checks `req.user.isAdmin` for authorization
- Frontend needs to get this from user profile

**5. Frontend Scenario Schema** - `frontend/src/lib/schemas/scenario-schema.js`
- Already exists! Can be used for validation

---

## 🎯 Implementation Status

### ✅ Phase 1: Basic Admin Interface - **COMPLETED** (February 2026)

#### ✅ 1.1 Admin Guard Component
**File:** `frontend/src/components/admin/AdminRoute.jsx`
- **Status:** Fully implemented
- Checks user.isAdmin flag from AuthContext
- Redirects unauthorized users to dashboard
```jsx
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  // Check if user has isAdmin flag
  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}
```

#### ✅ 1.2 Admin Scenarios List Page
**File:** `frontend/src/pages/admin/AdminScenarios.jsx`
- **Status:** Fully implemented with complete CRUD operations
- Search by title/code with debounced input
- Filter by status (all/draft/published/archived)
- Filter by difficulty (all/beginner/intermediate/advanced)
- Grid/list view toggle
- Edit, View, and Delete actions for each scenario
- Publish/Unpublish toggle with API integration
- Responsive design with shadcn/ui components

#### ✅ 1.3 Scenario Creator/Editor Page  
**File:** `frontend/src/pages/admin/ScenarioCreator.jsx`
- **Status:** Fully implemented with three modes (create/edit/view)
- **Modes:**
  - Create mode: Empty form for new scenarios
  - Edit mode: Load existing scenario, all fields editable (`?edit=scenarioId`)
  - View mode: Read-only display of scenario details (`?view=scenarioId`)

**Structure:**
```
Step 1: Basic Info
├─ Scenario code (uppercase, alphanumeric + underscore)
├─ Title
├─ Description
├─ Difficulty (dropdown)
├─ Tier (dropdown)
├─ Type (GUIDED or SANDBOX)
├─ Estimated duration (minutes)
└─ Category tags

Step 2: Satellite Configuration
├─ Select existing satellite (dropdown) OR
├─ Create new satellite inline
└─ Configure initial state (orbit, power, attitude, etc.)

Step 3: Steps & Objectives
├─ Add ordered steps
│   ├─ Step title
│   ├─ Instructions
│   ├─ Success criteria
│   └─ Hints for NOVA
├─ Learning objectives
└─ Prerequisites (other scenarios)

Step 4: Publishing Options
├─ Status (DRAFT/PUBLISHED)
├─ isActive checkbox
├─ isCore checkbox
├─ isPublic checkbox
└─ Preview & Submit
```

#### 1.3 Create API Service
**File:** `frontend/src/lib/api/scenarioService.js`
```javascript
import api from './httpClient'

export async function createScenario(scenarioData) {
  const response = await api.post('/scenarios', scenarioData)
  return response.payload
}

export async function createScenarioStep(stepData) {
  const response = await api.post('/scenario-steps', stepData)
  return response.payload
}

export async function getSatellites() {
  const response = await api.get('/satellites')
  return response.payload
}

export async function createSatellite(satelliteData) {
  const response = await api.post('/satellites', satelliteData)
  return response.payload
}
```

#### 1.4 Update Routing
**File:** `frontend/src/App.jsx`
```jsx
import { AdminRoute } from '@/components/admin/AdminRoute'
import ScenarioCreator from '@/pages/admin/ScenarioCreator'

// Add route:
<Route 
  path="/admin/scenarios/create" 
  element={
    <AdminRoute>
      <ScenarioCreator />
    </AdminRoute>
  } 
/>
```

---

### Phase 2: NOVA-Assisted Generation - **Priority 2**

#### 2.1 Add "Generate with NOVA" Mode Toggle
**In ScenarioCreator.jsx:**
```jsx
const [useNOVA, setUseNOVA] = useState(false)

<div className="mb-6">
  <label className="flex items-center space-x-2">
    <input 
      type="checkbox" 
      checked={useNOVA} 
      onChange={(e) => setUseNOVA(e.target.checked)}
    />
    <span>Generate with NOVA AI</span>
  </label>
</div>

{useNOVA && (
  <NOVAGenerationPrompt onGenerate={handleNOVAGenerate} />
)}
```

#### 2.2 NOVA Generation Component
**File:** `frontend/src/components/admin/NOVAGenerationPrompt.jsx`
```jsx
export function NOVAGenerationPrompt({ onGenerate }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await api.post('/ai/help/ask', {
        question: `Generate a training scenario structure: ${prompt}`,
        context: 'scenario_generation'
      })
      
      // Parse NOVA's response and extract scenario structure
      const scenarioData = parseNOVAResponse(response.payload.answer)
      onGenerate(scenarioData)
    } catch (error) {
      console.error('NOVA generation failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the scenario you want to create...
Example: Create a power management scenario for rookie pilots where they must restore battery after eclipse"
        className="w-full h-32 p-3 border rounded"
      />
      <button 
        onClick={handleGenerate} 
        disabled={loading || !prompt}
      >
        {loading ? 'Generating...' : 'Generate Draft'}
      </button>
    </div>
  )
}
```

#### 2.3 Review & Edit Generated Content
```jsx
{novaGeneratedData && (
  <div className="bg-yellow-50 border-2 border-yellow-400 p-4 mb-6">
    <h3 className="font-bold mb-2">⚠️ NOVA Generated Draft - Review Required</h3>
    <p className="text-sm text-gray-700 mb-4">
      This content was generated by AI. You MUST review and edit before saving.
    </p>
    
    {/* Show generated fields with edit buttons */}
    <div className="space-y-2">
      <div>
        <strong>Title:</strong> {novaGeneratedData.title}
        <button onClick={() => editField('title')}>Edit</button>
      </div>
      {/* ... more fields ... */}
    </div>
    
    <button 
      onClick={() => setNovaGeneratedData(null)}
      className="mt-4 text-red-600"
    >
      Discard AI Draft
    </button>
  </div>
)}
```

---

### Phase 3: Validation & Polish - **Priority 3**

#### 3.1 Client-Side Validation
```jsx
import { createScenarioSchema } from '@/lib/schemas/scenario-schema'

const validateScenario = () => {
  try {
    createScenarioSchema.parse({
      body: scenarioData
    })
    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      errors: error.errors.map(e => e.message) 
    }
  }
}
```

#### 3.2 Preview Mode
```jsx
const [showPreview, setShowPreview] = useState(false)

{showPreview && (
  <ScenarioPreview 
    scenario={scenarioData} 
    steps={stepsData}
    onClose={() => setShowPreview(false)}
  />
)}
```

#### 3.3 Draft Save
```jsx
const saveDraft = async () => {
  const draftData = {
    ...scenarioData,
    status: 'DRAFT'
  }
  
  await createScenario(draftData)
  // Show success message
  navigate('/admin/scenarios')
}
```

---

## 📝 Answers to Questions

### Q: Should non-admins ever access scenario creation?
**A:** NO (for now). Backend enforces `isAdmin` check. Frontend blocks with `<AdminRoute>`.

**Future:** Maybe add "Suggest Scenario" feature for users (saves as DRAFT, admin must approve).

### Q: Do scenarios require versioning?
**A:** NO. Backend uses:
- `status: 'DRAFT'` - Editable
- `status: 'PUBLISHED'` - Live, users can see
- `status: 'ARCHIVED'` - Hidden, but not deleted

**To "update" published scenario:** Admin can PATCH it, or change to DRAFT, edit, then republish.

### Q: Should NOVA generation be prompt-based, template-based, or both?
**A:** Start with **PROMPT-BASED** (simpler):
```
User: "Create a power management scenario for rookies"
↓
NOVA: Returns suggested structure
↓
Admin: Reviews & edits before saving
```

**Future:** Add template dropdown (e.g., "Orbital Maneuver Template", "Anomaly Response Template")

### Q: Are satellites predefined or per-scenario?
**A:** **BOTH**:
- Admin can select existing satellite from dropdown (`GET /satellites`)
- OR create new satellite inline (`POST /satellites`)
- Scenario stores `satellite_id` FK

**Initial State:** Admin can override satellite's default state for the scenario.

### Q: Preview / dry-run mode?
**A:** YES - Phase 3:
- Show scenario in read-only simulator view
- Don't create actual session
- Let admin "test drive" before publishing

---

## 🚀 Implementation Order

### Week 1: Basic Wizard
1. ✅ Create `AdminRoute` guard
2. ✅ Create wizard UI (4 steps)
3. ✅ Create `scenarioService.js` API calls
4. ✅ Wire up form submission
5. ✅ Add to navigation (admin-only link)
6. ✅ Test CRUD operations

### Week 2: NOVA Integration
1. ✅ Add "Generate with NOVA" toggle
2. ✅ Create NOVA prompt component
3. ✅ Parse NOVA responses
4. ✅ Show draft with edit UI
5. ✅ Test generation quality

### Week 3: Polish
1. ✅ Add validation (Zod schema)
2. ✅ Add preview mode
3. ✅ Add draft save
4. ✅ Error handling
5. ✅ Loading states
6. ✅ Success messages

---

## 📦 Reusable Components to Build

### 1. StepBuilder Component
```jsx
// frontend/src/components/admin/StepBuilder.jsx
export function StepBuilder({ steps, onChange }) {
  // Add/remove/reorder steps
  // Each step has: stepOrder, title, instructions, objective, hints
}
```

### 2. SatelliteSelector Component
```jsx
// frontend/src/components/admin/SatelliteSelector.jsx
export function SatelliteSelector({ value, onChange }) {
  // Dropdown of existing satellites
  // "Create New" button opens modal
}
```

### 3. InitialStateEditor Component
```jsx
// frontend/src/components/admin/InitialStateEditor.jsx
export function InitialStateEditor({ value, onChange }) {
  // Forms for orbit, power, attitude, thermal, comms
  // All optional - can start with defaults
}
```

---

## ⚠️ Gotchas & Notes

### 1. Admin Check
**Backend has `isAdmin` flag but you need to fetch it!**

**Option A:** Add `isAdmin` to user profile in Firestore  
**Option B:** Call `GET /auth/me` to get full user data from backend

Check AuthContext - does it load `isAdmin` field?

### 2. Scenario Code Uniqueness
Backend validates unique `code` field. If duplicate, backend returns 422 error.

Show error to user: "Scenario code already exists"

### 3. Satellite FK Validation
Backend validates `satellite_id` exists. If not found, backend returns 422 error.

Always fetch fresh satellite list before showing dropdown.

### 4. Steps Order
Backend expects `stepOrder` to be sequential (1, 2, 3...).

Your UI should enforce this - maybe drag-and-drop reordering?

### 5. NOVA Response Parsing
NOVA returns free-form text, NOT structured JSON.

You'll need to parse it:
```javascript
function parseNOVAResponse(text) {
  // Look for patterns like:
  // "Title: ..."
  // "Description: ..."
  // "Steps: 1. ... 2. ... 3. ..."
  
  // Return structured object
}
```

### 6. Draft vs Published
- `DRAFT` scenarios: Only admin can see
- `PUBLISHED` scenarios: Users can see (if `isActive=true`)
- `ARCHIVED` scenarios: Hidden from all

Backend enforces via `scenarioHooks.applyOwnershipScoping()`

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Admin can access `/admin/scenarios/create`
- [ ] Non-admin redirected to dashboard
- [ ] Can create scenario with all required fields
- [ ] Can select existing satellite
- [ ] Can create new satellite inline
- [ ] Can add multiple steps
- [ ] Steps maintain correct order
- [ ] Can save as DRAFT
- [ ] Can publish directly
- [ ] Validation errors show correctly
- [ ] NOVA generation creates valid structure
- [ ] Can edit NOVA-generated content
- [ ] Can discard NOVA draft
- [ ] Preview mode works
- [ ] Created scenario appears in list
- [ ] Non-admins can't see DRAFT scenarios

---

## 📂 Files to Create

```
frontend/src/
├── components/
│   └── admin/
│       ├── AdminRoute.jsx               ← NEW
│       ├── NOVAGenerationPrompt.jsx     ← NEW
│       ├── StepBuilder.jsx              ← NEW
│       ├── SatelliteSelector.jsx        ← NEW
│       ├── InitialStateEditor.jsx       ← NEW
│       └── ScenarioPreview.jsx          ← NEW
├── pages/
│   └── admin/
│       ├── ScenarioCreator.jsx          ← NEW
│       └── ScenarioList.jsx             ← NEW (optional)
└── lib/
    └── api/
        └── scenarioService.js           ← NEW
```

---

## 🎯 Success Criteria

✅ **Done when:**
1. Admin can create scenarios via wizard
2. Non-admins cannot access creator
3. All fields validate against backend schema
4. Can select or create satellites
5. Can add ordered steps
6. NOVA generation creates valid draft
7. Admin must explicitly review NOVA content
8. Can save as DRAFT or publish
9. Created scenarios appear in backend
10. No errors in console

---

**Ready to start?** I recommend beginning with Phase 1 (Basic Wizard) first. Want me to build the `AdminRoute` and basic wizard structure?
