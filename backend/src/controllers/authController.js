/**
 * Auth Controller
 * Handles HTTP requests for authentication operations
 */

const authService = require("../services/authService");
const lockoutService = require("../services/lockoutService");
const responseFactory = require("../factories/responseFactory");
const auditFactory = require("../factories/auditFactory");
const auditRepository = require("../repositories/auditRepository");
const userRepository = require("../repositories/userRepository");
const {
	loginSchema,
	registerSchema,
	refreshTokenSchema,
	revokeTokenSchema,
} = require("../schemas/authSchemas");
const { ValidationError, NotFoundError } = require("../utils/errors");
const httpStatus = require("../constants/httpStatus");
const logger = require("../utils/logger");

/**
 * Sync OAuth user profile (Google, etc.)
 * POST /auth/sync-oauth-profile
 * SECURITY: Must be called with authenticated user token
 * Uses authenticated user's UID from token, not from request body
 * Email is fetched from Firebase Auth (trusted source), not from request
 */
async function syncOAuthProfile(req, res, next) {
	try {
		// SECURITY: Require authentication first – this is the only gate
		if (!req.user || !req.user.uid) {
			throw new ValidationError("Authentication required to sync profile");
		}

		const authenticatedUid = req.user.uid;

		// Optional user-controlled fields – used only for profile enrichment
		// Email is NOT from request body - service fetches it from Firebase Auth
		const body = req.body || {};
		const displayName = body.displayName;
		const photoURL = body.photoURL;

		// Call service with UID + optional profile data.
		// Service fetches email from Firebase Auth using the authenticated UID
		const result = await authService.syncOAuthProfile(authenticatedUid, {
			displayName,
			photoURL,
		});

		logger.info("OAuth profile synced", { uid: authenticatedUid });

		const response = responseFactory.createSuccessResponse(result, {
			callSign: result.user.callSign,
			requestId: req.id,
			statusCode: httpStatus.OK,
		});

		res.status(httpStatus.OK).json(response);
	} catch (error) {
		next(error);
	}
}

/**
 * Register new user
 * POST /auth/register
 */
async function register(req, res, next) {
	try {
		const validation = registerSchema.safeParse(req.body);
		if (!validation.success) {
			throw new ValidationError("Validation failed", validation.error.errors);
		}

		const { email, password, callSign, displayName } = validation.data;

		const result = await authService.register(
			email,
			password,
			callSign,
			displayName,
		);

		const auditEntry = auditFactory.createRegisterAudit(
			result.user.uid,
			result.user.callSign,
			true,
			{
				ipAddress: req.ip,
				userAgent: req.get("user-agent"),
			},
		);
		await auditRepository.logAudit(auditEntry);

		logger.info("User registered successfully", {
			uid: result.user.uid,
			callSign: result.user.callSign,
		});

		if (result.refreshToken) {
			res.cookie("refreshToken", result.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000,
				path: "/api/v1/auth",
			});
		}

		const responsePayload = {
			user: result.user,
			tokens: {
				accessToken: result.accessToken,
			},
		};

		const response = responseFactory.createSuccessResponse(responsePayload, {
			callSign: result.user.callSign,
			requestId: req.id,
			statusCode: httpStatus.CREATED,
			flatten: true,
		});

		res.status(httpStatus.CREATED).json(response);
	} catch (error) {
		// Handle Firebase auth errors specifically
		if (error.code === "auth/email-already-in-use") {
			return res
				.status(400)
				.json({ payload: { error: { message: "Email already in use" } } });
		} else if (
			error.code === "auth/invalid-email" ||
			error.code === "auth/weak-password"
		) {
			return res.status(400).json({
				payload: { error: { message: "Invalid email or weak password" } },
			});
		} else if (
			error.message &&
			error.message.includes("Firebase not initialized")
		) {
			logger.error("Firebase unavailable during registration", {
				error: error.message,
			});
			return res.status(503).json({
				payload: {
					error: { message: "Service unavailable - try again later" },
				},
			});
		}

		if (req.body?.callSign) {
			const auditEntry = auditFactory.createRegisterAudit(
				"UNKNOWN",
				req.body.callSign,
				false,
				{
					ipAddress: req.ip,
					userAgent: req.get("user-agent"),
					errorMessage: error.message,
					statusCode: error.statusCode || 500,
				},
			);
			await auditRepository.logAudit(auditEntry);
		}

		next(error);
	}
}

/**
 * Login user
 * POST /auth/login
 */
async function login(req, res, next) {
	try {
		const validation = loginSchema.safeParse(req.body);
		if (!validation.success) {
			throw new ValidationError("Validation failed", validation.error.errors);
		}

		const { email, password } = validation.data;

		// Audit: Login attempt
		logger.audit("Login attempt", {
			email: email,
			ipAddress: req.ip,
			userAgent: req.get("user-agent"),
			path: req.path,
			method: req.method,
		});

		// Attempt login
		let result;
		let userId;
		let userCallSign;

		try {
			result = await authService.login(email, password);
			userId = result.user.uid;
			userCallSign = result.user.callSign;

			await lockoutService.checkAccountLockout(userId, userCallSign);

			await lockoutService.recordLoginAttempt(userId, userCallSign, true, {
				ipAddress: req.ip,
				userAgent: req.get("user-agent"),
			});

			logger.info("User logged in successfully", {
				uid: userId,
				callSign: userCallSign,
			});

			// Audit: Successful login
			logger.audit("Login successful", {
				userId: userId,
				callSign: userCallSign,
				ipAddress: req.ip,
				userAgent: req.get("user-agent"),
			});

			// SECURITY: Set refresh token as HttpOnly cookie
			if (result.refreshToken) {
				res.cookie("refreshToken", result.refreshToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "strict",
					maxAge: 7 * 24 * 60 * 60 * 1000,
					path: "/api/v1/auth",
				});
			}

			const responsePayload = {
				user: result.user,
				tokens: {
					accessToken: result.accessToken,
				},
			};

			const response = responseFactory.createSuccessResponse(responsePayload, {
				callSign: userCallSign,
				requestId: req.id,
				flatten: true,
			});

			res.status(httpStatus.OK).json(response);
		} catch (loginError) {
			if (loginError.statusCode === 401) {
				// Only attempt Firebase-based lockout checking if Firebase is initialized
				if (req.app.locals.firebaseInitialized) {
					try {
						const { getAuth, getFirestore } = require("../config/firebase");
						const auth = getAuth();
						const db = getFirestore();

						const userRecord = await auth.getUserByEmail(email);

						if (userRecord) {
							const userDoc = await db
								.collection("users")
								.doc(userRecord.uid)
								.get();

							if (userDoc.exists) {
								const userData = userDoc.data();
								userId = userRecord.uid;
								userCallSign = userData.callSign;

								await lockoutService.recordLoginAttempt(
									userId,
									userCallSign,
									false,
									{
										ipAddress: req.ip,
										userAgent: req.get("user-agent"),
										errorMessage: loginError.message,
									},
								);

								await lockoutService.checkAccountLockout(userId, userCallSign);
							}
						}
					} catch (firebaseError) {
						logger.debug("Failed login attempt for unknown user", {
							email,
							firebaseError: firebaseError.message,
						});

						// Audit: Failed login for unknown user
						logger.audit("Login failed - unknown user", {
							email: email,
							ipAddress: req.ip,
							userAgent: req.get("user-agent"),
							reason: "user_not_found",
						});
					}
				} else {
					// Firebase not initialized - skip Firebase-based logging
					logger.debug(
						"Firebase not initialized - skipping Firebase-based login attempt logging",
						{ email },
					);
				}

				// Audit: Failed login
				logger.audit("Login failed", {
					email: email,
					userId: userId || "unknown",
					callSign: userCallSign || "unknown",
					ipAddress: req.ip,
					userAgent: req.get("user-agent"),
					reason: "invalid_credentials",
				});
			}

			throw loginError;
		}
	} catch (error) {
		// Handle Firebase auth errors specifically
		if (error.code && error.code.startsWith("auth/")) {
			return res
				.status(401)
				.json({ payload: { error: { message: "Invalid email or password" } } });
		} else if (
			error.message &&
			error.message.includes("Firebase not initialized")
		) {
			logger.error("Firebase unavailable during login", {
				error: error.message,
			});
			return res.status(503).json({
				payload: {
					error: { message: "Service unavailable - try again later" },
				},
			});
		}

		next(error);
	}
}

/**
 * Refresh access token
 * POST /auth/refresh
 */
async function refreshToken(req, res, next) {
	try {
		const validation = refreshTokenSchema.safeParse(req.body);
		if (!validation.success) {
			throw new ValidationError("Validation failed", validation.error.errors);
		}

		const { refreshToken } = validation.data;

		const result = await authService.refreshAccessToken(refreshToken);

		const decoded = require("../utils/jwt").decodeToken(refreshToken);
		if (decoded) {
			const auditEntry = auditFactory.createAuditEntry(
				"TOKEN_REFRESH",
				"auth",
				decoded.uid,
				result.callSign || "SYSTEM",
				"success",
				"INFO",
				{
					ipAddress: req.ip,
					userAgent: req.get("user-agent"),
				},
			);
			await auditRepository.logAudit(auditEntry);
		}

		logger.info("Token refreshed successfully", { callSign: result.callSign });

		const response = responseFactory.createSuccessResponse(
			{
				accessToken: result.accessToken,
				refreshToken: result.refreshToken,
			},
			{
				callSign: result.callSign,
				requestId: req.id,
				flatten: true,
			},
		);

		res.status(httpStatus.OK).json(response);
	} catch (error) {
		next(error);
	}
}

/**
 * Logout user
 * POST /auth/logout
 */
async function logout(req, res, next) {
	try {
		const accessToken = req.headers.authorization?.split(" ")[1];
		const refreshToken = req.body?.refreshToken;

		if (!accessToken) {
			throw new ValidationError("Access token required");
		}

		await authService.logout(accessToken, refreshToken);

		const auditEntry = auditFactory.createLogoutAudit(
			req.user.uid,
			req.callSign,
			{
				ipAddress: req.ip,
				userAgent: req.get("user-agent"),
			},
		);
		await auditRepository.logAudit(auditEntry);

		logger.info("User logged out", {
			uid: req.user.uid,
			callSign: req.callSign,
		});

		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			path: "/api/v1/auth",
		});

		const response = responseFactory.createSuccessResponse(
			{ message: "Logout successful" },
			{
				callSign: req.callSign,
				requestId: req.id,
			},
		);

		res.status(httpStatus.OK).json(response);
	} catch (error) {
		next(error);
	}
}

/**
 * Revoke token (admin only)
 * POST /auth/revoke
 */
async function revokeToken(req, res, next) {
	try {
		const validation = revokeTokenSchema.safeParse(req.body);
		if (!validation.success) {
			throw new ValidationError("Validation failed", validation.error.errors);
		}

		const { token, userId } = validation.data;

		const result = await authService.revokeToken(token, userId);

		const auditEntry = auditFactory.createAuditEntry(
			"TOKEN_REVOKE",
			"auth",
			req.user.uid,
			req.callSign,
			"success",
			"CRITICAL",
			{
				ipAddress: req.ip,
				userAgent: req.get("user-agent"),
				details: `Revoked ${result.revoked} token(s) of type: ${result.type}`,
				targetUserId: userId,
			},
		);
		await auditRepository.logAudit(auditEntry);

		logger.info("Token revoked by admin", {
			admin: req.callSign,
			revoked: result.revoked,
			type: result.type,
		});

		const response = responseFactory.createSuccessResponse(result, {
			callSign: req.callSign,
			requestId: req.id,
		});

		res.status(httpStatus.OK).json(response);
	} catch (error) {
		next(error);
	}
}

/**
 * Get current user info
 * GET /auth/me
 */
async function getCurrentUser(req, res, next) {
	try {
		const userId = req.user.uid;

		const user = await userRepository.getById(userId);

		if (!user) {
			throw new NotFoundError("User not found");
		}

		logger.info("Current user info retrieved", {
			uid: userId,
			callSign: req.callSign,
		});

		const response = responseFactory.createSuccessResponse(
			{ user },
			{
				callSign: req.callSign,
				requestId: req.id,
			},
		);

		res.status(httpStatus.OK).json(response);
	} catch (error) {
		next(error);
	}
}

/**
 * Bootstrap initial admin user (one-time use)
 * POST /auth/bootstrap-admin
 */
async function bootstrapAdmin(req, res, next) {
	try {
		const { email, password, callSign, displayName } = req.body;

		const result = await authService.bootstrapAdmin(
			email,
			password,
			callSign,
			displayName,
		);

		logger.info("Admin user bootstrapped successfully", {
			uid: result.user.uid,
			callSign: result.user.callSign,
		});

		if (result.refreshToken) {
			res.cookie("refreshToken", result.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000,
				path: "/api/v1/auth",
			});
		}

		const responsePayload = {
			user: result.user,
			tokens: {
				accessToken: result.accessToken,
			},
		};

		const response = responseFactory.createSuccessResponse(responsePayload, {
			callSign: result.user.callSign,
			requestId: req.id,
			statusCode: httpStatus.CREATED,
			flatten: true,
		});

		res.status(httpStatus.CREATED).json(response);
	} catch (error) {
		next(error);
	}
}

/**
 * Change password (authenticated user)
 * POST /auth/change-password
 */
async function changePassword(req, res, next) {
	try {
		const { currentPassword, newPassword } = req.body;
		const userId = req.user.uid;
		const callSign = req.callSign;

		const result = await authService.changePassword(
			userId,
			currentPassword,
			newPassword,
			callSign,
		);

		logger.info("Password changed successfully", { uid: userId, callSign });

		const response = responseFactory.createSuccessResponse(result, {
			callSign,
			requestId: req.id,
		});

		res.status(httpStatus.OK).json(response);
	} catch (error) {
		next(error);
	}
}

/**
 * Request password reset
 * POST /auth/forgot-password
 */
async function forgotPassword(req, res, next) {
	try {
		const { email } = req.body;

		const result = await authService.forgotPassword(email);

		logger.info("Password reset requested", { email });

		const response = responseFactory.createSuccessResponse(result, {
			callSign: "SYSTEM",
			requestId: req.id,
		});

		res.status(httpStatus.OK).json(response);
	} catch (error) {
		next(error);
	}
}

/**
 * Reset password with token
 * POST /auth/reset-password
 */
async function resetPassword(req, res, next) {
	try {
		const { token, newPassword } = req.body;

		const result = await authService.resetPassword(token, newPassword);

		logger.info("Password reset successfully", { userId: result.userId });

		const response = responseFactory.createSuccessResponse(result, {
			callSign: "SYSTEM",
			requestId: req.id,
		});

		res.status(httpStatus.OK).json(response);
	} catch (error) {
		next(error);
	}
}

/**
 * Exchange Firebase ID token for backend JWT tokens
 * POST /auth/exchange-token
 * SECURITY: Uses firebaseAuthMiddleware to verify Firebase ID token
 */
async function exchangeToken(req, res, next) {
	try {
		// Firebase UID is already verified by firebaseAuthMiddleware
		if (!req.user || !req.user.uid) {
			throw new ValidationError("Firebase authentication required");
		}

		const firebaseUid = req.user.uid;

		// Exchange Firebase token for backend JWT tokens
		const result = await authService.exchangeFirebaseToken(firebaseUid);

		logger.info("Firebase token exchanged", { uid: firebaseUid });

		// Set refresh token as HttpOnly cookie
		if (result.refreshToken) {
			res.cookie("refreshToken", result.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000,
				path: "/api/v1/auth",
			});
		}

		const responsePayload = {
			user: result.user,
			tokens: {
				accessToken: result.accessToken,
				refreshToken: result.refreshToken,
			},
		};

		const response = responseFactory.createSuccessResponse(responsePayload, {
			callSign: result.user.callSign,
			requestId: req.id,
			flatten: true,
		});

		res.status(httpStatus.OK).json(response);
	} catch (error) {
		next(error);
	}
}

module.exports = {
	register,
	syncOAuthProfile,
	login,
	refreshToken,
	logout,
	revokeToken,
	getCurrentUser,
	bootstrapAdmin,
	changePassword,
	forgotPassword,
	resetPassword,
	exchangeToken,
};
