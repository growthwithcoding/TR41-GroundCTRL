# GroundCTRL API Testing - Postman Collection

This directory contains comprehensive Postman test files for the GroundCTRL Mission Control API using **Top Gun (1986)** character test data.

## 📁 Files Included

- **`GroundCTRL_Environment.postman_environment.json`** - Environment variables with Top Gun character credentials
- **`GroundCTRL_API.postman_collection.json`** - Complete API test collection with automated tests

## 🎬 Top Gun Mission Roster

The test suite includes the following operators from Top Gun (1986):

| Call Sign | Real Name | Role | Status |
|-----------|-----------|------|--------|
| **ICEMAN** | Tom Kazansky | Admin / Top Pilot | Register + Manual Firestore Update |
| **GOOSE** | Nick Bradshaw | RIO | Standard User |
| **SLIDER** | Ron Kerner | RIO (Iceman's RIO) | Standard User |
| **VIPER** | Mike Metcalf | Commanding Officer | Standard User |
| **JESTER** | Rick Heatherly | Flight Instructor | Standard User |
| **COUGAR** | Bill Cortell | Pilot | Test User (Deleted) |
| **MERLIN** | Sam Wells | RIO | Standard User |
| **HOLLYWOOD** | Rick Neven | Fighter Pilot | Standard User |
| **WOLFMAN** | Leonard Wolfe | RIO | Standard User |
| **STINGER** | CDR Johnson | Base Commander | Standard User |
| **SUNDOWN** | Marcus Williams | Fighter Pilot | Standard User |
| **CHARLIE** | Charlotte Blackwood | Civilian Instructor | Standard User |

> **Important Notes:**
> - **MAVERICK** is reserved for Swagger documentation examples
> - **ICEMAN** must be registered first, then manually promoted to admin in Firestore
> - **callSign** field is optional in API requests and responses
> - **isAdmin** is always set to `false` via API registration (requires manual Firestore update for admin privileges)

## 🚀 Getting Started

### 1. Import into Postman

1. Open Postman
2. Click **Import** button
3. Select both JSON files:
   - `GroundCTRL_Environment.postman_environment.json`
   - `GroundCTRL_API.postman_collection.json`
4. Click **Import**

### 2. Select the Environment

1. In Postman, look for the environment dropdown (top-right)
2. Select **"GroundCTRL Mission Environment"**
3. Verify the base URL is set to `http://localhost:3001`

### 3. Create ICEMAN Admin User (Required First-Time Setup)

**⚠️ IMPORTANT: Complete this step BEFORE running the full test collection**

1. **Start the Server** - Ensure the GroundCTRL backend is running:
   ```bash
   npm start
   # or
   npm run dev
   ```

2. **Register ICEMAN** - Navigate to: `Authentication - Registration` → `Register ICEMAN (Admin)`
   - Click **Send** to register the ICEMAN user
   - Copy the `uid` from the response (saved as `admin_user_id`)

3. **Set isAdmin to true in Google Console (Online)**:
   - Go to: https://console.firebase.google.com/
   - Select your project
   - Click **Firestore Database** in the left sidebar
   - Click on the `users` collection
   - Find the document with ICEMAN's UID (or email: `iceman@topgun.navy.mil`)
   - Click on the document to edit it
   - Change the `isAdmin` field from `false` to `true`
   - Click **Update**

4. **Login ICEMAN** - Navigate to: `Authentication - Login & Token Management` → `Login ICEMAN (Admin)`
   - Click **Send** to get admin tokens
   - This authenticates ICEMAN with admin privileges

> **✅ ICEMAN is now set up!** When running the full collection, **SKIP** the "Register ICEMAN (Admin)" request to avoid duplicate registration errors.

### 4. Run the Tests

#### Option A: Run Entire Collection
1. Click on the collection name
2. Click **Run** button
3. **IMPORTANT:** Deselect/uncheck the **"Register ICEMAN (Admin)"** request (if ICEMAN is already registered)
4. Select all other requests
5. Click **Run GroundCTRL Mission Control API**

> **Note:** Skip the ICEMAN registration when running the full collection if you've already completed the first-time setup in Step 3.

#### Option B: Run Individual Folders
- System Health & Info
- Authentication - Registration
- Authentication - Login & Token Management
- User Management - Admin Operations
- User Management - Audit Logs
- Security Tests
- Mission Roster - Batch Operations

#### Option C: Run Individual Requests
Navigate through folders and click **Send** on individual requests

## 🧪 Test Coverage

### System Tests (2 requests)
- ✅ Health check validation
- ✅ API root information

### Authentication Tests (15 requests)
- ✅ Register ICEMAN (requires manual Firestore update)
- ✅ Login ICEMAN as admin (after manual update)
- ✅ User registration (11 characters)
- ✅ Duplicate registration validation
- ✅ Password strength validation
- ✅ Login functionality
- ✅ Invalid credentials handling
- ✅ Token refresh
- ✅ Logout

### User Management Tests (7 requests)
- ✅ Get all users (admin)
- ✅ Get user by ID
- ✅ Create user (admin)
- ✅ Update user profile
- ✅ Delete user (admin)
- ✅ Authorization checks
- ✅ Audit log retrieval

### Security Tests (3 requests)
- ✅ Protected route access without token
- ✅ Invalid token handling
- ✅ Admin token revocation

### Total: **26+ API requests with automated test assertions**

## 🔑 Environment Variables

The environment includes pre-configured variables for all Top Gun characters:

### Global Variables
- `base_url` - API base URL (http://localhost:3001)
- `api_version` - API version (v1)
- `access_token` - Current user's access token
- `refresh_token` - Current user's refresh token
- `user_id` - Current user's Firebase UID

### Admin Variables
- `admin_access_token` - ICEMAN's access token
- `admin_refresh_token` - ICEMAN's refresh token
- `admin_user_id` - ICEMAN's user ID

### Character Credentials
Each character has the following variables:
- `{character}_email` - Email address
- `{character}_password` - Password
- `{character}_callsign` - Operator call sign
- `{character}_displayname` - Full name

Example for GOOSE:
- `goose_email`: goose@topgun.navy.mil
- `goose_password`: Goose123!@RIO
- `goose_callsign`: GOOSE
- `goose_displayname`: Nick Bradshaw

## 📊 Automated Test Scripts

### Global Tests (All Requests)
- Validates Mission Control response format
- Checks for required telemetry data
- Verifies mission time synchronization

### Request-Specific Tests
Each request includes specific assertions for:
- HTTP status codes
- Mission Control status (GO/NO-GO/HOLD/ABORT)
- Response payload structure
- Data integrity
- Token management
- Authorization rules

## 🎯 Test Execution Order

### First-Time Setup (Complete Once)
1. **Import to Postman** (see Getting Started above)
2. **Create ICEMAN user via registration** (see Step 3 in Getting Started)
3. **Set isAdmin to true in Google Console (Online)** (see Step 3 in Getting Started)
4. **Login ICEMAN as admin** to get authenticated tokens

### Running the Test Collection
After completing the first-time setup, run tests in this order:

1. **System Health & Info** - Verify API is running
2. **Authentication - Registration**
   - **⚠️ SKIP "Register ICEMAN (Admin)"** (already completed in first-time setup)
   - Register other test users (GOOSE, SLIDER, VIPER, JESTER)
3. **Authentication - Login & Token Management** - Authenticate users
4. **User Management - Admin Operations** - Test CRUD operations
5. **Security Tests** - Validate authorization
6. **Mission Roster - Batch Operations** - Register remaining operators

> **💡 TIP:** When running the entire collection, uncheck the "Register ICEMAN (Admin)" request to avoid duplicate registration errors.

##  Security Testing

The collection includes comprehensive security tests:

- **Authentication Required**: Tests that protected routes reject unauthenticated requests
- **Token Validation**: Tests that invalid tokens are properly rejected
- **Role-Based Access**: Tests that admin-only routes reject standard users
- **Token Revocation**: Tests that admins can revoke user tokens
- **Lockout Protection**: Failed login attempts are tracked

## 📝 Password Requirements

All test passwords meet the security requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

Example: `Goose123!@RIO`

## 🎬 Mission Control Response Format

All successful responses follow this format:

```json
{
  "status": "GO",
  "code": 200,
  "payload": {
    // Response data
  },
  "telemetry": {
    "missionTime": "2025-12-21T18:20:00.000Z",
    "operatorCallSign": "GOOSE",
    "stationId": "GROUNDCTRL-01",
    "requestId": "abc-123"
  },
  "timestamp": 1703181600000
}
```

### Status Codes
- **GO** - Operation successful/approved
- **NO-GO** - Operation rejected/failed
- **HOLD** - Operation pending/waiting
- **ABORT** - Operation terminated

## 🛠️ Customization

### Changing the Base URL
1. Go to Environments
2. Select "GroundCTRL Mission Environment"
3. Edit `base_url` variable

### Adding New Characters
1. Edit the environment file
2. Add new variables following the pattern:
   - `{callsign}_email`
   - `{callsign}_password`
   - `{callsign}_callsign`
   - `{callsign}_displayname`

### Modifying Tests
1. Click on a request
2. Go to the **Tests** tab
3. Edit the JavaScript test code
4. Save changes

## 📚 Additional Resources

- [GroundCTRL API Documentation](../README.md)
- [Postman Documentation](https://learning.postman.com/)

## 🐛 Troubleshooting

### Tests Failing?
1. Ensure the backend server is running
2. Verify Firebase is properly configured
3. Check that environment is selected in Postman
4. **Verify you manually set isAdmin to true for ICEMAN in Firestore** (required for admin tests)
5. Clear any existing test data from Firebase

### Admin Tests Failing with 403?
- ICEMAN's `isAdmin` field in Firestore must be set to `true`
- After updating in Firestore, re-run "Login ICEMAN (Admin)" to get fresh tokens
- Check the test console output - it will display ICEMAN's UID for easy lookup

### ICEMAN Registration Test Shows Warning?
- This is expected! The test "⚠️ isAdmin is false (MANUAL UPDATE REQUIRED)" is designed to pass
- It confirms that the API correctly prevents admin creation
- Follow the manual Firestore update instructions above

### Connection Issues?
- Verify `base_url` is correct (default: http://localhost:3001)
- Check that the server is running on the correct port
- Ensure no firewall is blocking localhost connections

### Token Errors?
- Run the login requests again to get fresh tokens
- Tokens expire after 15 minutes (default)
- Use the refresh token endpoint to get new access tokens

## ⚡ Quick Test Run

For a rapid test of core functionality:

### First-Time Setup:
1. **Import to Postman** - Import the collection and environment files
2. **Register ICEMAN** - Create admin user via the registration request
3. **⚠️ MANUAL:** Set isAdmin to true in Google Console (Online) - see Step 3 in Getting Started
4. **Login ICEMAN (Admin)** - Authenticate with admin privileges

### Subsequent Test Runs (Skip ICEMAN Registration):
1. **Health Check** - Verify system is running
2. **Login ICEMAN (Admin)** - Authenticate with admin privileges
3. **Get All Users** - Test admin functionality
4. **Register GOOSE** - Create standard user (if not already registered)
5. **Login GOOSE** - Test standard user login

## � Manual Admin Setup (Required for ICEMAN)

Since the API cannot create admin users (security measure), you must manually promote ICEMAN after registration:

### Step-by-Step Instructions:

1. **Run "Register ICEMAN (Admin)" request** in Postman
   - This creates the user with `isAdmin: false`
   - Copy the `uid` from the response (also saved as `admin_user_id`)

2. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select your project

3. **Navigate to Firestore Database**
   - Click "Firestore Database" in the left sidebar
   - Click on the `users` collection

4. **Find ICEMAN's document**
   - Look for the document with the UID from step 1
   - Or use the email: `iceman@topgun.navy.mil`

5. **Edit the document**
   - Click on the document to open it
   - Find the `isAdmin` field (currently `false`)
   - Change it to `true`
   - Click "Update"

6. **Run "Login ICEMAN (Admin)" request** in Postman
   - This will generate fresh tokens with admin privileges
   - You can now use admin-protected endpoints

### Why This Step is Necessary

For security reasons, the API **cannot** create admin users through registration. This prevents:
- Unauthorized privilege escalation
- Attackers registering themselves as admins
- Accidental admin account creation

Admin privileges must be granted manually in the database by someone with Firestore access.

## 📄 License

This test suite is part of the GroundCTRL Mission Control System.

---

**Mission Status: GO** ✈️

*"I feel the need... the need for speed!" - Testing at supersonic velocity*
