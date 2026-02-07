/**
 * Swagger/OpenAPI Configuration
 * Mission Control API Documentation
 */

const swaggerJSDoc = require("swagger-jsdoc");
const missionControl = require("./missionControl");

const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "GroundCTRL Mission Control API",
			version: missionControl.version,
			description: `
## 🛰️ Mission Control Platform for Satellite Simulation

A production-ready Node.js/Express API with enterprise-grade security, Firebase integration, 
and aerospace-themed mission control interfaces.

### Mission Control Response Protocol

All API responses follow the Mission Control protocol with status codes:
- **GO** - Operation successful (2xx responses)
- **NO-GO** - Client error or rejected request (4xx responses)
- **HOLD** - Service temporarily unavailable (503, 504)
- **ABORT** - Critical system failure (5xx responses)

### Response Format

Every response includes:
- \`status\` - Mission control status (GO/NO-GO/HOLD/ABORT)
- \`code\` - HTTP status code
- \`brief\` - Mission control briefing message
- \`payload\` - Response data or error details
- \`telemetry\` - Mission timing and operator information
- \`timestamp\` - Unix timestamp

### Security Features

- 🔐 JWT Authentication (Access + Refresh tokens)
- 🚫 Token Blacklisting (immediate revocation)
- 🔒 Account Lockout (5 failed attempts = 15 min lockout)
- 🛡️ Rate Limiting (configurable per endpoint)
- 📝 Comprehensive Audit Logging
- 👤 Call Sign System (non-unique display labels for operators)
- 🆔 UID-based Identity (canonical user identification)
- 👔 Admin Role Management

### Mission Time

All timestamps use ISO 8601 format. Telemetry includes:
- \`missionTime\` - Current operation timestamp
- \`operatorCallSign\` - Authenticated operator identifier
- \`stationId\` - Ground station identifier (${missionControl.stationId})
- \`requestId\` - Unique request identifier (UUID)
      `.trim(),
		},
		servers: [
			{
				url: "http://localhost:{port}/api/v1",
				description: "Development Server (Local)",
				variables: {
					port: {
						default: "8080",
						description: "Server port (configured in .env)",
					},
				},
			},
			{
				url: "https://api.missionctrl.org/api/v1",
				description: "Production Server",
			},
		],
		tags: [
			{
				name: "Health",
				description: "System health and status monitoring",
			},
			{
				name: "Authentication",
				description: "Operator authentication and session management",
			},
			{
				name: "Users",
				description: "User management operations (requires authentication)",
			},
			{
				name: "Satellites",
				description:
					"Satellite management operations (CRUD, ownership scoping, training scenarios)",
			},
			{
				name: "Scenarios",
				description:
					"Mission scenario management (CRUD operations with satellite references and initial state)",
			},
			{
				name: "Scenario Steps",
				description:
					"Ordered step sequences for guided scenarios (objectives, instructions, hints for NOVA)",
			},
			{
				name: "Scenario Sessions",
				description:
					"User training session tracking (progress, state management, step progression)",
			},
			{
				name: "Commands",
				description:
					"Mission command logging and validation (satellite operations during training sessions)",
			},
			{
				name: "AI (NOVA)",
				description:
					"AI-powered tutoring system with step-aware guidance and conversation history",
			},
			{
				name: "Help Articles",
				description:
					"Help documentation and knowledge base (articles, FAQs, categories)",
			},
			{
				name: "Leaderboard",
				description:
					"Operator rankings and leaderboards (global, scenario-specific, time periods)",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					description:
						"Enter your JWT access token obtained from the login endpoint",
				},
			},
			schemas: {
				MissionControlResponse: {
					type: "object",
					properties: {
						status: {
							type: "string",
							enum: ["GO", "NO-GO", "HOLD", "ABORT"],
							description: "Mission control status indicator",
						},
						code: {
							type: "integer",
							description: "HTTP status code",
							example: 200,
						},
						brief: {
							type: "string",
							description: "Mission control briefing message",
							example: "Satellite uplink established. Telemetry nominal.",
						},
						payload: {
							type: "object",
							description: "Response data payload",
						},
						telemetry: {
							$ref: "#/components/schemas/Telemetry",
						},
						timestamp: {
							type: "integer",
							description: "Unix timestamp in milliseconds",
							example: 1704067200000,
						},
					},
				},
				Telemetry: {
					type: "object",
					properties: {
						missionTime: {
							type: "string",
							format: "date-time",
							description: "Current operation timestamp (ISO 8601)",
							example: "2025-01-01T00:00:00.000Z",
						},
						operatorCallSign: {
							type: "string",
							description: "Authenticated operator call sign",
							example: "APOLLO-11",
						},
						stationId: {
							type: "string",
							description: "Ground station identifier",
							example: "GROUNDCTRL-01",
						},
						requestId: {
							type: "string",
							format: "uuid",
							description: "Unique request identifier",
							example: "123e4567-e89b-12d3-a456-426614174000",
						},
					},
				},
				ErrorResponse: {
					type: "object",
					properties: {
						status: {
							type: "string",
							enum: ["NO-GO", "ABORT"],
							description: "Mission control error status",
						},
						code: {
							type: "integer",
							description: "HTTP error status code",
							example: 400,
						},
						brief: {
							type: "string",
							description: "Mission control error briefing",
							example: "Invalid trajectory parameters. Recalculate and retry.",
						},
						payload: {
							type: "object",
							properties: {
								error: {
									type: "object",
									properties: {
										code: {
											type: "string",
											example: "VALIDATION_ERROR",
										},
										message: {
											type: "string",
											example: "Invalid input parameters",
										},
										details: {
											type: "object",
											nullable: true,
										},
									},
								},
							},
						},
						telemetry: {
							$ref: "#/components/schemas/Telemetry",
						},
						timestamp: {
							type: "integer",
							example: 1704067200000,
						},
					},
				},
				User: {
					type: "object",
					properties: {
						uid: {
							type: "string",
							description:
								"Unique user identifier (Firebase UID) - CANONICAL IDENTIFIER for all operations",
							example: "abc123xyz456",
						},
						email: {
							type: "string",
							format: "email",
							description:
								"Operator email address (unique constraint for data integrity, not used for targeting)",
							example: "pilot@groundctrl.com",
						},
						callSign: {
							type: "string",
							description:
								"Operator call sign (NON-UNIQUE display label for context only, never used for identity or authorization)",
							example: "APOLLO-11",
						},
						displayName: {
							type: "string",
							description: "Operator display name",
							example: "Neil Armstrong",
						},
						isAdmin: {
							type: "boolean",
							description: "Admin privileges flag",
							example: false,
						},
					},
				},
				Tokens: {
					type: "object",
					properties: {
						accessToken: {
							type: "string",
							description: "JWT access token (15 minute expiry)",
							example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
						},
						refreshToken: {
							type: "string",
							description: "JWT refresh token (7 day expiry)",
							example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
						},
					},
				},
				Satellite: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Unique satellite identifier",
							example: "sat_123",
						},
						name: {
							type: "string",
							description: "Satellite name or designation",
							example: "TrainingSat-01",
						},
						description: {
							type: "string",
							description: "Optional human-readable description",
							example: "ISS-like satellite for training",
						},
						orbit: {
							type: "object",
							properties: {
								altitude_km: {
									type: "number",
									description:
										"Altitude above Earth mean sea level in kilometers",
									example: 408,
								},
								inclination_degrees: {
									type: "number",
									description: "Orbital plane inclination in degrees",
									example: 51.6,
								},
							},
						},
						power: {
							type: "object",
							properties: {
								solarPower_watts: {
									type: "number",
									description: "Peak power from solar panels in Watts",
									example: 2.5,
								},
								batteryCapacity_wh: {
									type: "number",
									description: "Usable battery energy in Watt-hours",
									example: 20,
								},
								baseDrawRate_watts: {
									type: "number",
									description: "Always-on power draw in Watts",
									example: 0.5,
								},
								currentCharge_percent: {
									type: "number",
									description: "Battery state of charge (0-100%)",
									example: 85,
								},
							},
						},
						attitude: {
							type: "object",
							properties: {
								currentTarget: {
									type: "string",
									enum: ["NADIR", "SUN", "INERTIAL_EAST"],
									description: "Current pointing target",
									example: "NADIR",
								},
								error_degrees: {
									type: "number",
									description: "Pointing error from desired target in degrees",
									example: 0.5,
								},
							},
						},
						thermal: {
							type: "object",
							properties: {
								currentTemp_celsius: {
									type: "number",
									description:
										"Current average satellite temperature in Celsius",
									example: 20,
								},
								minSafe_celsius: {
									type: "number",
									description: "Minimum safe operating temperature in Celsius",
									example: -20,
								},
								maxSafe_celsius: {
									type: "number",
									description: "Maximum safe operating temperature in Celsius",
									example: 50,
								},
								heaterAvailable: {
									type: "boolean",
									description: "Whether an active heater is available",
									example: true,
								},
							},
						},
						propulsion: {
							type: "object",
							properties: {
								propellantRemaining_kg: {
									type: "number",
									description: "Remaining propellant mass in kilograms",
									example: 0.5,
								},
								maxDeltaV_ms: {
									type: "number",
									description:
										"Approximate available delta-V in meters per second",
									example: 50,
								},
							},
						},
						payload: {
							type: "object",
							properties: {
								type: {
									type: "string",
									description: "Payload type (e.g., Camera, Spectrometer)",
									example: "Camera",
								},
								isActive: {
									type: "boolean",
									description: "Whether the payload is currently active",
									example: false,
								},
								powerDraw_watts: {
									type: "number",
									description: "Payload power consumption when active in Watts",
									example: 5,
								},
							},
						},
						status: {
							type: "string",
							enum: ["ACTIVE", "INACTIVE", "ARCHIVED", "TRAINING"],
							description: "Operational/training status",
							example: "TRAINING",
						},
						capabilities: {
							type: "array",
							items: {
								type: "string",
							},
							description: "Capabilities used for filtering",
							example: ["Power management", "Attitude control"],
						},
						designSource: {
							type: "string",
							description: "Reference design source",
							example: "ISS-inspired",
						},
						createdBy: {
							type: "string",
							description: "User ID who created the satellite",
							example: "abc123xyz456",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
					},
				},
				Scenario: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Unique scenario identifier",
							example: "scen_123",
						},
						code: {
							type: "string",
							description:
								"Unique scenario code (uppercase alphanumeric with underscores)",
							example: "ROOKIE_ORBIT_101",
						},
						title: {
							type: "string",
							description: "Human-readable scenario title",
							example: "Orbit Orientation",
						},
						description: {
							type: "string",
							description:
								"Detailed mission description and learning objectives",
							example:
								"Learn the basics of orbital mechanics and satellite positioning",
						},
						difficulty: {
							type: "string",
							enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
							description: "Difficulty level for learning path",
							example: "BEGINNER",
						},
						tier: {
							type: "string",
							enum: ["ROOKIE_PILOT", "MISSION_SPECIALIST", "MISSION_COMMANDER"],
							description: "Pilot tier required",
							example: "ROOKIE_PILOT",
						},
						type: {
							type: "string",
							enum: ["GUIDED", "SANDBOX"],
							description: "GUIDED (step-by-step) or SANDBOX (free-play)",
							example: "GUIDED",
						},
						estimatedDurationMinutes: {
							type: "number",
							description: "Expected playtime in minutes",
							example: 15,
						},
						status: {
							type: "string",
							enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
							description: "Publishing status",
							example: "PUBLISHED",
						},
						isActive: {
							type: "boolean",
							description: "Whether scenario is available for users",
							example: true,
						},
						isCore: {
							type: "boolean",
							description: "true for core training scenarios",
							example: true,
						},
						satellite_id: {
							type: "string",
							description: "FK to satellites.id",
							example: "sat_123",
						},
						initialState: {
							type: "object",
							description:
								"Seed state for simulation (orbit, power, attitude, etc.)",
							properties: {
								orbit: {
									type: "object",
									properties: {
										altitude_km: {
											type: "number",
											description: "Initial altitude in kilometers",
											example: 408,
										},
										inclination_degrees: {
											type: "number",
											description: "Initial inclination in degrees",
											example: 51.6,
										},
									},
								},
								power: {
									type: "object",
									properties: {
										currentCharge_percent: {
											type: "number",
											description: "Initial battery charge percentage",
											example: 100,
										},
									},
								},
								attitude: {
									type: "object",
									properties: {
										currentTarget: {
											type: "string",
											enum: ["NADIR", "SUN", "INERTIAL_EAST"],
											description: "Initial pointing target",
											example: "NADIR",
										},
										error_degrees: {
											type: "number",
											description: "Initial pointing error in degrees",
											example: 0.5,
										},
									},
								},
								thermal: {
									type: "object",
									properties: {
										currentTemp_celsius: {
											type: "number",
											description: "Initial temperature in Celsius",
											example: 20,
										},
									},
								},
							},
						},
						consoleLayout: {
							type: "object",
							description: "Which panels/widgets appear in mission console",
							properties: {
								panels: {
									type: "array",
									items: {
										type: "string",
									},
									description: "Which panels appear in mission console",
									example: ["power", "attitude", "thermal"],
								},
								widgets: {
									type: "array",
									items: {
										type: "string",
									},
									description: "Which widgets appear in mission console",
									example: ["telemetry", "commands"],
								},
							},
						},
						tags: {
							type: "array",
							items: {
								type: "string",
							},
							description:
								"Tags for filtering (e.g., power-management, attitude-control)",
							example: ["orbit", "basics"],
						},
						objectives: {
							type: "array",
							items: {
								type: "string",
							},
							description: "Learning objectives for this scenario",
							example: [
								"Understand orbital mechanics",
								"Practice attitude control",
							],
						},
						prerequisites: {
							type: "array",
							items: {
								type: "string",
							},
							description: "Scenario IDs that should be completed first",
							example: ["scen_122"],
						},
						createdBy: {
							type: "string",
							description: "User ID who created the scenario",
							example: "abc123xyz456",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
					},
				},
				ScenarioStep: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Unique step identifier",
							example: "step_123",
						},
						scenario_id: {
							type: "string",
							description: "FK to scenarios.id",
							example: "scen_123",
						},
						stepOrder: {
							type: "number",
							description: "Step sequence (1, 2, 3, ...)",
							example: 1,
						},
						title: {
							type: "string",
							description: "Step title",
							example: "Check Current Attitude",
						},
						instructions: {
							type: "string",
							description: "What user is asked to do at this step",
							example: "Check the satellite attitude control system status",
						},
						objective: {
							type: "string",
							description: 'What counts as "success" for this step',
							example: "Verify attitude is within 2 degrees of NADIR",
						},
						completionCondition: {
							type: "string",
							description:
								"How backend knows step is complete (logic description)",
							example:
								'attitude.error_degrees <= 2.0 && attitude.currentTarget === "NADIR"',
						},
						isCheckpoint: {
							type: "boolean",
							description: "true for key milestones (useful for resuming)",
							example: false,
						},
						expectedDurationSeconds: {
							type: "number",
							description: "Estimated step duration in seconds",
							example: 120,
						},
						hint_suggestion: {
							type: "string",
							description: "Default hint text the AI tutor can use",
							example: "Check the attitude control panel on the left side",
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
					},
				},
				ScenarioSession: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Unique session identifier",
							example: "sess_123",
						},
						user_id: {
							type: "string",
							description: "User ID (uid) of the operator",
							example: "abc123xyz456",
						},
						scenario_id: {
							type: "string",
							description: "FK to scenarios.id",
							example: "scen_123",
						},
						status: {
							type: "string",
							enum: [
								"NOT_STARTED",
								"IN_PROGRESS",
								"PAUSED",
								"COMPLETED",
								"FAILED",
								"ABANDONED",
							],
							description: "Current session status",
							example: "IN_PROGRESS",
						},
						current_step_id: {
							type: "string",
							description: "FK to scenario_steps.id - current step",
							example: "step_123",
							nullable: true,
						},
						currentStepOrder: {
							type: "number",
							description: "Current step order the operator is on",
							example: 1,
						},
						completedSteps: {
							type: "array",
							items: {
								type: "string",
							},
							description: "Array of completed step IDs",
							example: [],
						},
						score: {
							type: "number",
							description: "Session score (0-100)",
							example: 85,
							nullable: true,
						},
						total_hints_used: {
							type: "number",
							description: "Number of hints requested during session",
							example: 2,
						},
						total_errors: {
							type: "number",
							description: "Number of errors made during session",
							example: 1,
						},
						state: {
							type: "object",
							description: "Runtime simulation state (JSON)",
							example: {
								satelliteState: { power: { currentCharge_percent: 85 } },
							},
						},
						started_at: {
							type: "string",
							format: "date-time",
							description: "Session start timestamp",
							example: "2025-01-01T00:00:00.000Z",
							nullable: true,
						},
						completed_at: {
							type: "string",
							format: "date-time",
							description: "Session completion timestamp",
							example: "2025-01-01T01:00:00.000Z",
							nullable: true,
						},
						last_activity_at: {
							type: "string",
							format: "date-time",
							description: "Last activity timestamp",
							example: "2025-01-01T00:30:00.000Z",
						},
						attemptNumber: {
							type: "number",
							description: "Which attempt this is for the operator",
							example: 1,
						},
						notes: {
							type: "string",
							description: "Session notes or feedback",
							example: "Good progress on power management",
							nullable: true,
						},
						version: {
							type: "number",
							description: "Version number for optimistic locking",
							example: 1,
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
					},
				},
				Command: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Unique command identifier",
							example: "cmd_123",
						},
						session_id: {
							type: "string",
							description: "FK to user_scenario_sessions.id",
							example: "sess_123",
							nullable: true,
						},
						scenario_step_id: {
							type: "string",
							description: "FK to scenario_steps.id",
							example: "step_123",
							nullable: true,
						},
						issued_at: {
							type: "string",
							format: "date-time",
							description: "When the command was issued",
							example: "2025-01-01T00:00:00.000Z",
						},
						command_name: {
							type: "string",
							description:
								"Command type from valid command registry (40+ satellite operations)",
							example: "SET_ATTITUDE_MODE",
							enum: [
								"SET_ORBIT_ALTITUDE",
								"SET_ORBIT_INCLINATION",
								"EXECUTE_ORBITAL_MANEUVER",
								"STATION_KEEPING",
								"DEPLOY_SOLAR_ARRAYS",
								"RETRACT_SOLAR_ARRAYS",
								"SET_POWER_MODE",
								"ENABLE_BATTERY_CHARGING",
								"DISABLE_BATTERY_CHARGING",
								"SET_ATTITUDE_MODE",
								"SET_POINTING_TARGET",
								"EXECUTE_ATTITUDE_MANEUVER",
								"CALIBRATE_GYROSCOPE",
								"SET_THERMAL_MODE",
								"ENABLE_HEATER",
								"DISABLE_HEATER",
								"SET_THERMAL_SETPOINT",
								"ARM_PROPULSION",
								"DISARM_PROPULSION",
								"EXECUTE_BURN",
								"ABORT_BURN",
								"ENABLE_TRANSMITTER",
								"DISABLE_TRANSMITTER",
								"SET_ANTENNA_MODE",
								"UPLINK_DATA",
								"DOWNLINK_DATA",
								"SYSTEM_RESET",
								"SAFE_MODE",
								"NOMINAL_MODE",
								"RUN_DIAGNOSTICS",
							],
						},
						command_payload: {
							type: "object",
							description:
								"Command parameters as JSON (structure varies by command_name)",
							example: { mode: "NADIR" },
						},
						result_status: {
							type: "string",
							enum: ["OK", "ERROR", "NO_EFFECT"],
							description: "Command execution result status",
							example: "OK",
							nullable: true,
						},
						result_message: {
							type: "string",
							description: "Detailed result/error message",
							example: "Attitude mode set to NADIR successfully",
							nullable: true,
						},
						is_valid: {
							type: "boolean",
							description: "Whether command passed validation",
							example: true,
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
					},
				},
				AIMessage: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Unique message identifier",
							example: "msg_123",
						},
						session_id: {
							type: "string",
							description: "FK to scenario_sessions.id",
							example: "sess_123",
						},
						user_id: {
							type: "string",
							description: "User ID (uid) of the operator",
							example: "abc123xyz456",
						},
						role: {
							type: "string",
							enum: ["user", "assistant"],
							description: "Message role (user or NOVA assistant)",
							example: "assistant",
						},
						content: {
							type: "string",
							description: "Message text content",
							example:
								"Great job! You successfully oriented the satellite to NADIR.",
						},
						step_id: {
							type: "string",
							description:
								"FK to scenario_steps.id - current step when message was sent",
							example: "step_123",
							nullable: true,
						},
						command_id: {
							type: "string",
							description:
								"FK to user_commands.id - related command if applicable",
							example: "cmd_123",
							nullable: true,
						},
						hint_type: {
							type: "string",
							enum: [
								"CONCEPTUAL",
								"PROCEDURAL",
								"TROUBLESHOOTING",
								"CONTEXTUAL",
								"FALLBACK",
							],
							description: "Type of hint provided (for assistant messages)",
							example: "PROCEDURAL",
							nullable: true,
						},
						is_fallback: {
							type: "boolean",
							description:
								"Whether this is a fallback response (AI unavailable)",
							example: false,
						},
						metadata: {
							type: "object",
							description:
								"Additional metadata (e.g., model used, token count)",
							example: { model: "gpt-4", tokens: 150 },
						},
						created_at: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
						updated_at: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
					},
				},
				HelpCategory: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Unique category identifier",
							example: "cat_123",
						},
						code: {
							type: "string",
							description:
								"Unique category code (uppercase alphanumeric with underscores)",
							example: "GETTING_STARTED",
						},
						name: {
							type: "string",
							description: "Display name for the category",
							example: "Getting Started",
						},
						description: {
							type: "string",
							description: "Brief category description",
							example: "Learn the basics of GroundCTRL",
							nullable: true,
						},
						icon: {
							type: "string",
							description: "Icon name (e.g., Lucide icon name)",
							example: "rocket",
							nullable: true,
						},
						color: {
							type: "string",
							description: "Category accent color (hex format)",
							example: "#3b82f6",
							nullable: true,
						},
						orderIndex: {
							type: "number",
							description: "Sort order (lower = first)",
							example: 0,
						},
						isActive: {
							type: "boolean",
							description: "Whether category is active",
							example: true,
						},
						parentCategoryId: {
							type: "string",
							description: "For nested categories",
							example: null,
							nullable: true,
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
					},
				},
				HelpArticle: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Unique article identifier",
							example: "article_123",
						},
						slug: {
							type: "string",
							description: "URL-friendly identifier",
							example: "getting-started-with-missions",
						},
						title: {
							type: "string",
							description: "Article title",
							example: "Getting Started with Missions",
						},
						subtitle: {
							type: "string",
							description: "Optional subtitle or tagline",
							example: "Learn how to create and run your first mission",
							nullable: true,
						},
						excerpt: {
							type: "string",
							description: "Short summary for search results and cards",
							example: "A beginner-friendly guide to mission creation",
							nullable: true,
						},
						category_id: {
							type: "string",
							description: "FK to help_categories.id",
							example: "cat_123",
						},
						type: {
							type: "string",
							enum: [
								"GUIDE",
								"REFERENCE",
								"TROUBLESHOOTING",
								"FAQ",
								"RELEASE_NOTES",
								"GLOSSARY",
							],
							description: "Article format type",
							example: "GUIDE",
						},
						difficulty: {
							type: "string",
							enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
							description: "Content difficulty level",
							example: "BEGINNER",
							nullable: true,
						},
						tags: {
							type: "array",
							items: {
								type: "string",
							},
							description: "Tags for filtering and search",
							example: ["missions", "beginner", "tutorial"],
						},
						content: {
							type: "array",
							items: {
								type: "object",
								description:
									"Structured content blocks (PARAGRAPH, HEADING, LIST, CODE, IMAGE, etc.)",
							},
							description: "Structured content blocks",
						},
						status: {
							type: "string",
							enum: ["DRAFT", "PUBLISHED", "ARCHIVED", "NEEDS_REVIEW"],
							description: "Publishing status",
							example: "PUBLISHED",
						},
						isActive: {
							type: "boolean",
							description: "Whether article is active",
							example: true,
						},
						isFeatured: {
							type: "boolean",
							description: "Show in featured/popular section",
							example: false,
						},
						isPinned: {
							type: "boolean",
							description: "Pin to top of category",
							example: false,
						},
						orderIndex: {
							type: "number",
							description: "Sort order within category",
							example: 0,
						},
						estimatedReadMinutes: {
							type: "number",
							description: "Estimated reading time in minutes",
							example: 5,
							nullable: true,
						},
						thumbnailUrl: {
							type: "string",
							description: "Thumbnail image for cards",
							example: "https://example.com/thumbnail.jpg",
							nullable: true,
						},
						views: {
							type: "number",
							description: "View count",
							example: 1250,
						},
						helpfulCount: {
							type: "number",
							description: "Helpful votes",
							example: 45,
						},
						notHelpfulCount: {
							type: "number",
							description: "Not helpful votes",
							example: 3,
						},
						version: {
							type: "string",
							description: "Version number (semver)",
							example: "1.0.0",
						},
						author_id: {
							type: "string",
							description: "FK to users.id (content author)",
							example: "abc123xyz456",
							nullable: true,
						},
						publishedAt: {
							type: "string",
							format: "date-time",
							description: "When article was/will be published",
							example: "2025-01-01T00:00:00.000Z",
							nullable: true,
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
					},
				},
				HelpFAQ: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Unique FAQ identifier",
							example: "faq_123",
						},
						question: {
							type: "string",
							description: "The question",
							example: "How do I reset my password?",
						},
						answer: {
							type: "string",
							description: "Plain text or markdown answer",
							example: 'Click on "Forgot Password" on the login page...',
						},
						category_id: {
							type: "string",
							description: "FK to help_categories.id",
							example: "cat_123",
						},
						tags: {
							type: "array",
							items: {
								type: "string",
							},
							description: "Tags for filtering",
							example: ["account", "password", "login"],
						},
						orderIndex: {
							type: "number",
							description: "Sort order",
							example: 0,
						},
						status: {
							type: "string",
							enum: ["DRAFT", "PUBLISHED", "ARCHIVED", "NEEDS_REVIEW"],
							description: "Publishing status",
							example: "PUBLISHED",
						},
						isActive: {
							type: "boolean",
							description: "Whether FAQ is active",
							example: true,
						},
						isFeatured: {
							type: "boolean",
							description: "Show in main FAQ section",
							example: true,
						},
						relatedArticleIds: {
							type: "array",
							items: {
								type: "string",
							},
							description: "Related article IDs",
							example: ["article_123"],
						},
						createdAt: {
							type: "string",
							format: "date-time",
							description: "Creation timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
						updatedAt: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
					},
				},
				LeaderboardOperator: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "Operator user ID",
							example: "abc123xyz456",
						},
						callSign: {
							type: "string",
							description: "Operator call sign",
							example: "APOLLO-11",
						},
						rank: {
							type: "number",
							description: "Current ranking position",
							example: 1,
						},
						score: {
							type: "number",
							description: "Average performance score (0-100)",
							example: 95,
						},
						missionsCompleted: {
							type: "number",
							description: "Total missions completed",
							example: 25,
						},
						bestScore: {
							type: "number",
							description: "Best mission score achieved",
							example: 98,
						},
						worstScore: {
							type: "number",
							description: "Worst mission score achieved",
							example: 85,
						},
					},
				},
				LeaderboardResponse: {
					type: "object",
					properties: {
						operators: {
							type: "array",
							items: {
								$ref: "#/components/schemas/LeaderboardOperator",
							},
							description: "Array of ranked operators",
						},
						topThree: {
							type: "array",
							items: {
								$ref: "#/components/schemas/LeaderboardOperator",
							},
							description: "Top 3 operators for podium display",
						},
						period: {
							type: "string",
							enum: ["today", "week", "month", "all-time"],
							description: "Time period filter applied",
							example: "all-time",
						},
						lastUpdated: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
						totalOperators: {
							type: "number",
							description: "Total number of operators in leaderboard",
							example: 150,
						},
						userRank: {
							$ref: "#/components/schemas/UserRank",
						},
						nearbyOperators: {
							type: "array",
							items: {
								$ref: "#/components/schemas/LeaderboardOperator",
							},
							description: "Operators ranked near the authenticated user",
						},
					},
				},
				UserRank: {
					type: "object",
					properties: {
						id: {
							type: "string",
							description: "User ID",
							example: "abc123xyz456",
						},
						callSign: {
							type: "string",
							description: "User call sign",
							example: "APOLLO-11",
						},
						rank: {
							type: "number",
							description: "Current ranking position",
							example: 15,
						},
						score: {
							type: "number",
							description: "Average performance score",
							example: 88,
						},
						percentile: {
							type: "number",
							description: "Percentile ranking (0-100)",
							example: 90,
						},
						totalOperators: {
							type: "number",
							description: "Total operators in leaderboard",
							example: 150,
						},
						rankChange: {
							type: "number",
							description:
								"Change in rank since previous period (positive = improved)",
							example: 3,
						},
						missionsCompleted: {
							type: "number",
							description: "Missions completed",
							example: 18,
						},
					},
				},
				ScenarioLeaderboard: {
					type: "object",
					properties: {
						scenarioId: {
							type: "string",
							description: "Scenario identifier",
							example: "scen_123",
						},
						operators: {
							type: "array",
							items: {
								type: "object",
								properties: {
									userId: {
										type: "string",
										description: "Operator user ID",
										example: "abc123xyz456",
									},
									callSign: {
										type: "string",
										description: "Operator call sign",
										example: "APOLLO-11",
									},
									rank: {
										type: "number",
										description: "Ranking position",
										example: 1,
									},
									score: {
										type: "number",
										description: "Best score for this scenario",
										example: 95,
									},
									completionTime: {
										type: "string",
										format: "date-time",
										description: "When the best score was achieved",
										example: "2025-01-01T00:00:00.000Z",
									},
									duration: {
										type: "string",
										description: "Mission duration",
										example: "15m 30s",
									},
								},
							},
						},
						topThree: {
							type: "array",
							items: {
								type: "object",
							},
							description: "Top 3 operators for this scenario",
						},
						lastUpdated: {
							type: "string",
							format: "date-time",
							description: "Last update timestamp",
							example: "2025-01-01T00:00:00.000Z",
						},
						totalOperators: {
							type: "number",
							description: "Total operators who completed this scenario",
							example: 75,
						},
					},
				},
				UserRankSummary: {
					type: "object",
					properties: {
						allTime: {
							$ref: "#/components/schemas/UserRank",
						},
						month: {
							$ref: "#/components/schemas/UserRank",
						},
						week: {
							$ref: "#/components/schemas/UserRank",
						},
						today: {
							$ref: "#/components/schemas/UserRank",
						},
					},
				},
			},
			responses: {
				UnauthorizedError: {
					description: "NO-GO - Authentication required",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
							example: {
								status: "NO-GO",
								code: 401,
								brief:
									"Ground station authorization required. Authentication failed.",
								payload: {
									error: {
										code: "UNAUTHORIZED",
										message: "Authentication token required",
										details: null,
									},
								},
								telemetry: {
									missionTime: "2025-01-01T00:00:00.000Z",
									operatorCallSign: "SYSTEM",
									stationId: "GROUNDCTRL-01",
									requestId: "123e4567-e89b-12d3-a456-426614174000",
								},
								timestamp: 1704067200000,
							},
						},
					},
				},
				ForbiddenError: {
					description: "NO-GO - Insufficient permissions",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
							example: {
								status: "NO-GO",
								code: 403,
								brief:
									"Clearance insufficient. Contact Mission Control for access.",
								payload: {
									error: {
										code: "FORBIDDEN",
										message: "Insufficient permissions for this operation",
										details: null,
									},
								},
								telemetry: {
									missionTime: "2025-01-01T00:00:00.000Z",
									operatorCallSign: "APOLLO-11",
									stationId: "GROUNDCTRL-01",
									requestId: "123e4567-e89b-12d3-a456-426614174000",
								},
								timestamp: 1704067200000,
							},
						},
					},
				},
				RateLimitError: {
					description: "NO-GO - Rate limit exceeded",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
							example: {
								status: "NO-GO",
								code: 429,
								brief:
									"Ground station capacity exceeded. Rate limiting engaged.",
								payload: {
									error: {
										code: "RATE_LIMIT_EXCEEDED",
										message: "Too many requests. Please try again later.",
										details: null,
									},
								},
								telemetry: {
									missionTime: "2025-01-01T00:00:00.000Z",
									operatorCallSign: "SYSTEM",
									stationId: "GROUNDCTRL-01",
									requestId: "123e4567-e89b-12d3-a456-426614174000",
								},
								timestamp: 1704067200000,
							},
						},
					},
				},
				ValidationError: {
					description: "NO-GO - Invalid request data",
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/ErrorResponse",
							},
							example: {
								status: "NO-GO",
								code: 422,
								brief:
									"Payload validation failed. Check data integrity and format.",
								payload: {
									error: {
										code: "VALIDATION_ERROR",
										message: "Request validation failed",
										details: {
											field: "email",
											message: "Invalid email format",
										},
									},
								},
								telemetry: {
									missionTime: "2025-01-01T00:00:00.000Z",
									operatorCallSign: "SYSTEM",
									stationId: "GROUNDCTRL-01",
									requestId: "123e4567-e89b-12d3-a456-426614174000",
								},
								timestamp: 1704067200000,
							},
						},
					},
				},
				HealthStatus: {
					type: "object",
					properties: {
						status: {
							type: "string",
							enum: ["GO", "NO-GO", "HOLD", "ABORT"],
							description: "Overall health status",
							example: "GO",
						},
						statusDetail: {
							type: "string",
							description: "Detailed status description",
							example: "All systems operational",
						},
						service: {
							type: "string",
							description: "Service name",
							example: "GroundCTRL API",
						},
						version: {
							type: "string",
							description: "Service version",
							example: "1.4.0",
						},
						station: {
							type: "string",
							description: "Ground station identifier",
							example: "GROUNDCTRL-01",
						},
						uptime: {
							type: "integer",
							description: "Service uptime in seconds",
							example: 3600,
						},
						uptimeFormatted: {
							type: "string",
							description: "Human-readable uptime",
							example: "1h 0m 0s",
						},
						timestamp: {
							type: "string",
							format: "date-time",
							description: "Health check timestamp",
							example: "2026-01-10T20:00:00.000Z",
						},
						environment: {
							type: "string",
							description: "Deployment environment",
							example: "development",
						},
					},
				},
				DatabaseHealthStatus: {
					type: "object",
					properties: {
						status: {
							type: "string",
							enum: ["GO", "NO-GO", "HOLD", "ABORT"],
							description: "Database health status",
							example: "GO",
						},
						statusDetail: {
							type: "string",
							description: "Detailed database status",
							example: "Database responding normally",
						},
						database: {
							type: "string",
							description: "Database type",
							example: "Firebase Firestore",
						},
						service: {
							type: "string",
							description: "Service name",
							example: "GroundCTRL API",
						},
						station: {
							type: "string",
							description: "Ground station identifier",
							example: "GROUNDCTRL-01",
						},
						latency: {
							type: "object",
							properties: {
								ms: {
									type: "integer",
									description: "Response latency in milliseconds",
									example: 45,
								},
								threshold: {
									type: "integer",
									description: "Acceptable latency threshold in milliseconds",
									example: 100,
								},
							},
						},
						timestamp: {
							type: "string",
							format: "date-time",
							description: "Database health check timestamp",
							example: "2026-01-10T20:00:00.000Z",
						},
					},
				},
			},
		},
	},
	apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
