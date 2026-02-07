/**
 * Express App Configuration
 * Initializes Express app with middleware and routes
 */

require("dotenv").config({
	path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const { initializeFirebase } = require("./config/firebase");
const swaggerSpec = require("./config/swagger");
const _OpenApiValidator = require("express-openapi-validator");
const missionControl = require("./config/missionControl");
const auditLogger = require("./middleware/auditLogger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const authErrorNormalizer = require("./middleware/authErrorNormalizer");
const { apiLimiter } = require("./middleware/rateLimiter");
// const { responseEnvelopeMiddleware } = require('./middleware/responseEnvelope'); // Temporarily disabled
const routes = require("./routes");
const logger = require("./utils/logger");

// Initialize Express app
const app = express();

// Track application readiness
app.locals.appReady = false;
app.locals.firebaseInitialized = false;

// Initialize Firebase with graceful error handling
// Don't exit process on failure - let server start for Cloud Run health checks
let firebaseInitialized = false;

// Add startup logging for Cloud Run debugging
console.log("🚀 Starting GroundCTRL Backend Server...");
console.log(`Node Version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`PORT: ${process.env.PORT || "8080"}`);

try {
	console.log("📡 Initializing Firebase Admin SDK...");
	initializeFirebase();
	firebaseInitialized = true;
	app.locals.firebaseInitialized = true;
	console.log("✅ Firebase initialized successfully");
	logger.info("Firebase initialized successfully");
} catch (error) {
	console.error("❌ Firebase initialization failed:", error.message);
	app.locals.firebaseInitialized = false;
	logger.error(
		"Failed to initialize Firebase - server will start in degraded mode",
		{
			error: error.message,
			stack: error.stack,
		},
	);
	console.error("⚠️  WARNING: Firebase initialization failed");
	console.error(
		"    Server will start but Firebase features will be unavailable",
	);
	console.error("    Error:", error.message);
	// Don't exit - let the server start so Cloud Run health checks pass
	// Firebase errors will be handled by individual endpoints
}

// Security headers middleware (helmet)
// Enable for all environments including tests so security header tests work
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for now
				scriptSrc: ["'self'"],
				imgSrc: ["'self'", "data:", "https:"],
				reportUri: "/csp-report", // CSP violation reporting endpoint
			},
		},
		hsts: {
			maxAge: 31536000, // 1 year
			includeSubDomains: true,
			preload: true,
		},
	}),
);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
	? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
	: [
			"http://localhost:3001",
			"http://localhost:5173",
			"http://localhost:5174", // Allow alternate port
			"http://localhost:5175", // Allow alternate port
			"http://localhost:8080", // Allow backend port
		];

logger.info("CORS Configuration", {
	nodeEnv: process.env.NODE_ENV,
	allowedOriginsEnv: process.env.ALLOWED_ORIGINS,
	allowedOriginsArray: allowedOrigins,
});

// 1. Handle CORS preflight globally (before auth)
app.use((req, res, next) => {
	if (req.method === "OPTIONS") {
		cors({
			origin: (origin, callback) => {
				// Allow requests with no origin (like mobile apps or curl requests)
				if (!origin) return callback(null, true);

				// In development and test, allow any localhost origin
				if (
					(process.env.NODE_ENV === "development" ||
						process.env.NODE_ENV === "test") &&
					origin.startsWith("http://localhost:")
				) {
					return callback(null, true);
				}

				if (allowedOrigins.indexOf(origin) !== -1) {
					callback(null, true);
				} else {
					logger.warn("CORS blocked origin", { origin, allowedOrigins });
					// Return false to block without throwing error (prevents 500)
					callback(null, false);
				}
			},
			credentials: true, // Allow credentials for preflight requests from allowed origins
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			optionsSuccessStatus: 204,
			maxAge: 3600,
		})(req, res, next);
	} else {
		next();
	}
});

// 2. Apply CORS to all routes
app.use(
	cors({
		origin: (origin, callback) => {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);

			// In development and test, allow any localhost origin
			if (
				(process.env.NODE_ENV === "development" ||
					process.env.NODE_ENV === "test") &&
				origin.startsWith("http://localhost:")
			) {
				return callback(null, true);
			}

			if (allowedOrigins.indexOf(origin) !== -1) {
				callback(null, true);
			} else {
				logger.warn("CORS blocked origin", { origin, allowedOrigins });
				// Return false to block without throwing error (prevents 500)
				callback(null, false);
			}
		},
		credentials: (req, callback) => {
			const origin = req.headers.origin;
			if (!origin) return callback(null, true);
			if (
				(process.env.NODE_ENV === "development" ||
					process.env.NODE_ENV === "test") &&
				origin.startsWith("http://localhost:")
			) {
				return callback(null, true);
			}
			if (allowedOrigins.indexOf(origin) !== -1) {
				callback(null, true);
			} else {
				callback(null, false);
			}
		}, // Allow cookies/credentials with allowed origins
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		optionsSuccessStatus: 204, // Return 204 for successful OPTIONS requests
		maxAge: 3600, // 24 hours
	}),
);

// Expose Firebase status for health checks
app.locals.firebaseInitialized = firebaseInitialized;

// Body parsing middleware with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Trust proxy (required for Cloud Run to get real client IPs from X-Forwarded-* headers)
app.set("trust proxy", 1);

// Response envelope middleware (must be early to wrap all responses)
// app.use(responseEnvelopeMiddleware); // Temporarily disabled for testing

// Global API rate limiter (applied to all routes)
app.use(apiLimiter);

// Request logging middleware
app.use(auditLogger);

// Swagger API Documentation
app.use(
	"/api/v1/docs",
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpec, {
		customCss: ".swagger-ui .topbar { display: none }",
		customSiteTitle: "GroundCTRL API Documentation",
		customfavIcon: "/favicon.ico",
	}),
);

// Health endpoint at root level for tests and quick checks (before auth)
app.get("/health", (req, res) => {
	res.json({
		status: "GO",
		service: "GroundCTRL API",
		version: missionControl.version,
	});
});

// Root endpoint (before auth)
app.get("/", (req, res) => {
	res.json({
		service: "GroundCTRL API",
		version: missionControl.version,
		status: "operational",
		documentation: "/api/v1/docs",
		health: "/api/v1/health",
	});
});

// OpenAPI Schema Validation Middleware
// Validates requests and responses against OpenAPI spec
try {
	// Temporarily disabled due to missing schema references
	// app.use(
	// 	OpenApiValidator.middleware({
	// 		apiSpec: swaggerSpec,
	// 		validateRequests: true,
	// 		validateResponses: process.env.NODE_ENV !== "production",
	// 		validateApiSpec: true,
	// 		ignorePaths: /^\/(health|docs)/,
	// 		formats: {},
	// 	})
	// );
	console.log("✅ OpenAPI validation middleware disabled (schema issues)");
} catch (error) {
	console.warn(
		"⚠️  OpenAPI validation middleware failed to initialize:",
		error.message,
	);
	console.warn("    API validation will be skipped");
	// Comment out the middleware for now
	// app.use(OpenApiValidator.middleware({...}));
}

// API Routes (versioned) - auth is handled within routes
app.use("/api/v1", routes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Auth error normalizer (must be before global error handler)
app.use(authErrorNormalizer);

// OpenAPI Validation Error Handler
app.use((err, req, res, next) => {
	// Handle OpenAPI validation errors
	if (err.status && err.status === 400 && err.errors) {
		logger.warn("OpenAPI validation error", {
			path: req.path,
			method: req.method,
			errors: err.errors,
		});

		return res.status(422).json({
			status: "NO-GO",
			code: 422,
			brief: "Request validation failed. Check API specification.",
			payload: {
				error: {
					code: "VALIDATION_ERROR",
					message: "Request does not match OpenAPI specification",
					details: err.errors,
				},
			},
			telemetry: {
				missionTime: new Date().toISOString(),
				operatorCallSign: req.user?.callSign || "SYSTEM",
				stationId: missionControl.stationId,
				requestId: req.id || "unknown",
			},
			timestamp: Date.now(),
		});
	}

	// Handle OpenAPI response validation errors (development only)
	if (err.status && err.status === 500 && err.message?.includes("response")) {
		logger.error("OpenAPI response validation error", {
			path: req.path,
			method: req.method,
			error: err.message,
		});

		// In production, don't expose response validation errors
		if (process.env.NODE_ENV === "production") {
			return next(err);
		}

		return res.status(500).json({
			status: "ABORT",
			code: 500,
			brief: "Response validation failed. Check API implementation.",
			payload: {
				error: {
					code: "RESPONSE_VALIDATION_ERROR",
					message: "API response does not match OpenAPI specification",
					details: err.message,
				},
			},
			telemetry: {
				missionTime: new Date().toISOString(),
				operatorCallSign: req.user?.callSign || "SYSTEM",
				stationId: missionControl.stationId,
				requestId: req.id || "unknown",
			},
			timestamp: Date.now(),
		});
	}

	next(err);
});

// Global error handler (must be last)
app.use(errorHandler);

// Mark app as ready after all middleware and routes are configured
console.log("✅ Express app configuration complete");
app.locals.appReady = true;

module.exports = app;
