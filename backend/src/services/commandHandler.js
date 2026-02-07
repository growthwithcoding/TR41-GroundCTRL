/**
 * Command Handler Service
 *
 * Validates and executes satellite commands with realistic physics.
 * Implements the Tsiolkovsky rocket equation for burn calculations.
 *
 * Key Features:
 * - Burn duration calculation using thrust/mass/Isp
 * - Orbital element updates using vis-viva equation
 * - Command validation (fuel, power, step constraints)
 * - Planned burn queue management
 */

const logger = require("../utils/logger");
const { v4: uuidv4 } = require("uuid");

/**
 * Physical constants
 */
const CONSTANTS = {
	G0: 9.80665, // Standard gravity (m/s²)
	MU_EARTH: 398600.4418, // Earth's gravitational parameter (km³/s²)
	EARTH_RADIUS: 6371, // km
};

/**
 * @typedef {Object} PlannedBurn
 * @property {string} id - Burn ID
 * @property {string} direction - 'prograde'|'retrograde'|'normal'|'anti-normal'|'radial_in'|'radial_out'
 * @property {number} deltaV_ms - Target delta-V (m/s)
 * @property {number} propellantUsed_kg - Calculated propellant consumption
 * @property {number} burnDuration_sec - Calculated burn duration
 * @property {number} scheduledTime - When to execute (sim seconds)
 * @property {string} status - 'queued'|'executing'|'completed'|'aborted'
 * @property {Object} orbitalElementsBefore - State before burn
 * @property {Object} orbitalElementsAfter - Predicted state after burn
 * @property {number} [targetTrueAnomaly] - Optional orbital position trigger
 */

class CommandHandler {
	constructor() {
		/**
		 * Queue of planned burns
		 * @type {PlannedBurn[]}
		 */
		this.burnQueue = [];

		logger.info("CommandHandler initialized");
	}

	/**
	 * Calculate propellant required for a given delta-V
	 * Uses Tsiolkovsky rocket equation
	 *
	 * Δv = Isp × g₀ × ln(m₀ / m₁)
	 * Solving for propellant: m_prop = m₀ - m₁ = m₀ × (1 - exp(-Δv / (Isp × g₀)))
	 *
	 * @param {Object} satellite - Satellite state
	 * @param {number} satellite.dryMass_kg - Dry mass
	 * @param {number} satellite.propellantMass_kg - Current propellant
	 * @param {Object} satellite.thruster - Thruster specs
	 * @param {number} satellite.thruster.Isp_sec - Specific impulse
	 * @param {number} deltaV_ms - Desired delta-V (m/s)
	 * @returns {number} Propellant required (kg)
	 */
	calculatePropellantRequired(satellite, deltaV_ms) {
		const { dryMass_kg, propellantMass_kg, thruster } = satellite;
		const { Isp_sec } = thruster;

		const m0 = dryMass_kg + propellantMass_kg; // Initial mass
		const deltaV_kmps = deltaV_ms / 1000; // Convert to km/s

		// m1 = m0 * exp(-Δv / (Isp * g0))
		const m1 = m0 * Math.exp(-deltaV_kmps / ((Isp_sec * CONSTANTS.G0) / 1000));
		const propellantUsed = m0 - m1;

		return propellantUsed;
	}

	/**
	 * Calculate burn duration
	 *
	 * @param {number} propellantUsed_kg - Propellant to be consumed
	 * @param {number} thrust_N - Thruster thrust
	 * @param {number} Isp_sec - Specific impulse
	 * @returns {number} Burn duration (seconds)
	 */
	calculateBurnDuration(propellantUsed_kg, thrust_N, Isp_sec) {
		// Mass flow rate: ṁ = F / (Isp × g₀)
		const massFlowRate = thrust_N / (Isp_sec * CONSTANTS.G0);

		// Duration: t = m_prop / ṁ
		const duration = propellantUsed_kg / massFlowRate;

		return duration;
	}

	/**
	 * Validate burn command preconditions
	 *
	 * @param {Object} satellite - Satellite state
	 * @param {Object} burnParams - Burn parameters
	 * @param {Object} currentStep - Current scenario step
	 * @returns {Object} Validation result
	 */
	validateBurnCommand(satellite, burnParams, currentStep = {}) {
		const checks = [];

		// 1. Fuel availability check
		const propellantNeeded = this.calculatePropellantRequired(
			satellite,
			burnParams.deltaV_ms,
		);

		const fuelAvailable = satellite.propellantMass_kg >= propellantNeeded;
		checks.push({
			name: "fuel_available",
			passed: fuelAvailable,
			message: fuelAvailable
				? `Sufficient fuel: ${propellantNeeded.toFixed(2)} kg required, ${satellite.propellantMass_kg.toFixed(2)} kg available`
				: `Insufficient fuel: ${propellantNeeded.toFixed(2)} kg required, ${satellite.propellantMass_kg.toFixed(2)} kg available`,
		});

		// 2. Step allows burns
		const burnsAllowed = currentStep.allowsBurns !== false;
		checks.push({
			name: "step_allows_burns",
			passed: burnsAllowed,
			message: burnsAllowed ? "Maneuvers permitted" : "Wait for burn window",
		});

		// 3. Thruster status check
		const thrusterReady = satellite.thrusterStatus !== "failed";
		checks.push({
			name: "thruster_ready",
			passed: thrusterReady,
			message: `Thruster status: ${satellite.thrusterStatus || "nominal"}`,
		});

		// 4. Power check (burns require power)
		const _powerRequired = 100; // Watts
		const powerAvailable = (satellite.power_percent || 100) > 20;
		checks.push({
			name: "power_available",
			passed: powerAvailable,
			message: powerAvailable
				? "Sufficient power for burn"
				: "Low power - burn may fail",
		});

		const allPassed = checks.every((c) => c.passed);

		return {
			valid: allPassed,
			checks,
			propellantNeeded,
		};
	}

	/**
	 * Execute burn command
	 * Calculates burn effects and updates orbital elements
	 *
	 * @param {Object} satellite - Current satellite state
	 * @param {Object} burnParams - Burn parameters
	 * @param {string} burnParams.direction - Burn direction
	 * @param {number} burnParams.deltaV_ms - Target delta-V (m/s)
	 * @param {number} [burnParams.targetTime] - Optional scheduled time
	 * @param {number} [burnParams.targetTrueAnomaly] - Optional position trigger
	 * @param {Object} currentStep - Current scenario step
	 * @returns {Object} Burn result with updated state
	 */
	async executeBurn(satellite, burnParams, currentStep = {}) {
		// Validate preconditions
		const validation = this.validateBurnCommand(
			satellite,
			burnParams,
			currentStep,
		);

		if (!validation.valid) {
			logger.warn("Burn validation failed", {
				checks: validation.checks.filter((c) => !c.passed),
			});

			return {
				success: false,
				error: "Burn preconditions not met",
				validation,
			};
		}

		const { direction, deltaV_ms, targetTime, targetTrueAnomaly } = burnParams;
		const { thruster, dryMass_kg, propellantMass_kg } = satellite;

		// Calculate burn parameters
		const propellantUsed = validation.propellantNeeded;
		const burnDuration = this.calculateBurnDuration(
			propellantUsed,
			thruster.thrust_N,
			thruster.Isp_sec,
		);

		// Apply burn to orbital elements
		const orbitalChange = this.applyBurnToOrbit(
			satellite.orbitalElements,
			direction,
			deltaV_ms,
		);

		// Create burn record
		const burn = {
			id: uuidv4(),
			direction,
			deltaV_ms,
			propellantUsed_kg: propellantUsed,
			burnDuration_sec: burnDuration,
			scheduledTime: targetTime || Date.now(),
			targetTrueAnomaly,
			status: targetTime ? "queued" : "completed",
			orbitalElementsBefore: { ...satellite.orbitalElements },
			orbitalElementsAfter: orbitalChange,
			executedAt: Date.now(),
		};

		// Add to queue if scheduled
		if (targetTime) {
			this.burnQueue.push(burn);
			logger.info("Burn queued", {
				burnId: burn.id,
				direction,
				deltaV_ms,
				scheduledTime: targetTime,
			});
		}

		// Update satellite state
		const updatedSatellite = {
			...satellite,
			orbitalElements: orbitalChange,
			propellantMass_kg: propellantMass_kg - propellantUsed,
			lastBurn: burn,
		};

		// Calculate remaining delta-V capability
		const m0_remaining = dryMass_kg + (propellantMass_kg - propellantUsed);
		const m1_min = dryMass_kg;
		const deltaVRemaining_ms =
			thruster.Isp_sec * CONSTANTS.G0 * Math.log(m0_remaining / m1_min);

		updatedSatellite.deltaVRemaining_ms = deltaVRemaining_ms;

		logger.info("Burn executed", {
			burnId: burn.id,
			direction,
			deltaV_ms,
			propellantUsed: propellantUsed.toFixed(2),
			burnDuration: burnDuration.toFixed(1),
			deltaVRemaining: deltaVRemaining_ms.toFixed(1),
		});

		return {
			success: true,
			burn,
			satellite: updatedSatellite,
			validation,
		};
	}

	/**
	 * Apply burn delta-V to orbital elements
	 * Uses vis-viva equation and simplified orbital mechanics
	 *
	 * @param {Object} elements - Current orbital elements
	 * @param {string} direction - Burn direction
	 * @param {number} deltaV_ms - Delta-V magnitude (m/s)
	 * @returns {Object} Updated orbital elements
	 */
	applyBurnToOrbit(elements, direction, deltaV_ms) {
		const { a, e, i, raan, argP, trueAnomaly } = elements;
		const deltaV_kmps = deltaV_ms / 1000; // Convert to km/s

		// Current orbital radius
		const r =
			(a * (1 - e * e)) / (1 + e * Math.cos((trueAnomaly * Math.PI) / 180));

		// Current velocity from vis-viva equation: v = sqrt(μ(2/r - 1/a))
		const v_current = Math.sqrt(CONSTANTS.MU_EARTH * (2 / r - 1 / a));

		let v_new, a_new, e_new;
		let i_new = i;
		let raan_new = raan;
		let argP_new = argP;

		switch (direction) {
			case "prograde":
				// Increase velocity in direction of motion
				v_new = v_current + deltaV_kmps;
				a_new = 1 / (2 / r - (v_new * v_new) / CONSTANTS.MU_EARTH);

				// For prograde at periapsis (ν ≈ 0), apoapsis increases
				// For prograde at apoapsis (ν ≈ 180), periapsis increases
				// Simplified: calculate new eccentricity
				if (Math.abs(trueAnomaly) < 10) {
					// Near periapsis - raise apoapsis
					const r_apo_new = 2 * a_new - r;
					e_new = (r_apo_new - r) / (r_apo_new + r);
				} else if (Math.abs(trueAnomaly - 180) < 10) {
					// Near apoapsis - raise periapsis (circularize)
					const r_peri_new = 2 * a_new - r;
					e_new = (r - r_peri_new) / (r + r_peri_new);
				} else {
					// General case
					e_new = Math.abs((a_new - r) / a_new);
				}
				break;

			case "retrograde":
				// Decrease velocity
				v_new = Math.max(0, v_current - deltaV_kmps);
				a_new = 1 / (2 / r - (v_new * v_new) / CONSTANTS.MU_EARTH);
				e_new = Math.abs((a_new - r) / a_new);
				break;

			case "normal":
				// Change inclination (perpendicular to orbital plane)
				// Simplified: small change to inclination
				i_new = i + (deltaV_kmps / v_current) * (180 / Math.PI);
				a_new = a;
				e_new = e;
				break;

			case "anti-normal":
				i_new = i - (deltaV_kmps / v_current) * (180 / Math.PI);
				a_new = a;
				e_new = e;
				break;

			case "radial_in":
			case "radial_out":
				// Radial burns are inefficient, mainly change eccentricity
				a_new = a;
				e_new =
					e + (direction === "radial_out" ? 0.01 : -0.01) * (deltaV_kmps / 0.1);
				e_new = Math.max(0, Math.min(0.9, e_new));
				break;

			default:
				logger.warn("Unknown burn direction", { direction });
				a_new = a;
				e_new = e;
		}

		// Ensure valid orbital elements
		e_new = Math.max(0, Math.min(0.99, e_new));
		i_new = Math.max(0, Math.min(180, i_new));

		const newElements = {
			a: a_new,
			e: e_new,
			i: i_new,
			raan: raan_new,
			argP: argP_new,
			trueAnomaly: trueAnomaly, // Will be updated by propagator
		};

		logger.debug("Orbital elements updated", {
			before: { a: a.toFixed(1), e: e.toFixed(4) },
			after: { a: a_new.toFixed(1), e: e_new.toFixed(4) },
			direction,
			deltaV_ms,
		});

		return newElements;
	}

	/**
	 * Get queued burns
	 *
	 * @returns {PlannedBurn[]} Array of queued burns
	 */
	getQueuedBurns() {
		return this.burnQueue.filter((b) => b.status === "queued");
	}

	/**
	 * Cancel queued burn
	 *
	 * @param {string} burnId - Burn ID to cancel
	 * @returns {boolean} Success
	 */
	cancelBurn(burnId) {
		const burn = this.burnQueue.find((b) => b.id === burnId);

		if (burn && burn.status === "queued") {
			burn.status = "aborted";
			logger.info("Burn cancelled", { burnId });
			return true;
		}

		return false;
	}

	/**
	 * Execute queued burns that have reached their scheduled time
	 *
	 * @param {number} currentSimTime - Current simulation time
	 * @param {Object} satellite - Current satellite state
	 * @returns {Array<Object>} Executed burns
	 */
	processQueuedBurns(currentSimTime, satellite) {
		const executed = [];

		for (const burn of this.burnQueue) {
			if (burn.status === "queued" && currentSimTime >= burn.scheduledTime) {
				// Check true anomaly trigger if specified
				if (burn.targetTrueAnomaly !== undefined) {
					const currentAnomaly = satellite.orbitalElements.trueAnomaly;
					const tolerance = 5; // degrees

					if (Math.abs(currentAnomaly - burn.targetTrueAnomaly) > tolerance) {
						continue; // Wait for correct orbital position
					}
				}

				// Execute the burn
				burn.status = "executing";

				logger.info("Executing queued burn", {
					burnId: burn.id,
					direction: burn.direction,
					deltaV_ms: burn.deltaV_ms,
				});

				// Apply to satellite
				satellite.orbitalElements = burn.orbitalElementsAfter;
				satellite.propellantMass_kg -= burn.propellantUsed_kg;

				burn.status = "completed";
				burn.completedAt = currentSimTime;

				executed.push(burn);
			}
		}

		// Remove completed burns from queue
		this.burnQueue = this.burnQueue.filter((b) => b.status === "queued");

		return executed;
	}

	/**
	 * Calculate optimal burn time for Hohmann transfer
	 *
	 * @param {Object} currentElements - Current orbital elements
	 * @param {number} targetAltitude - Target altitude (km)
	 * @param {string} phase - 'raise_apoapsis'|'circularize'
	 * @returns {Object} Optimal burn info
	 */
	calculateHohmannBurnTiming(
		currentElements,
		targetAltitude,
		phase = "raise_apoapsis",
	) {
		const { a, e, trueAnomaly } = currentElements;

		const _periapsis = a * (1 - e) - CONSTANTS.EARTH_RADIUS;
		const _apoapsis = a * (1 + e) - CONSTANTS.EARTH_RADIUS;

		if (phase === "raise_apoapsis") {
			// Burn at periapsis (true anomaly = 0)
			const targetAnomaly = 0;
			const currentAnomaly = trueAnomaly;

			// Calculate angle to periapsis
			let angleToPeriapsis = (360 + targetAnomaly - currentAnomaly) % 360;

			// Calculate orbital period
			const period =
				2 * Math.PI * Math.sqrt(Math.pow(a, 3) / CONSTANTS.MU_EARTH);

			// Time to periapsis
			const timeToPeriapsis = (angleToPeriapsis / 360) * period;

			return {
				targetAnomaly,
				currentAnomaly,
				timeToPeriapsis,
				message: `Burn at periapsis to raise apoapsis to ${targetAltitude} km`,
			};
		} else {
			// Burn at apoapsis (true anomaly = 180)
			const targetAnomaly = 180;
			const currentAnomaly = trueAnomaly;

			let angleToApoapsis = (360 + targetAnomaly - currentAnomaly) % 360;

			const period =
				2 * Math.PI * Math.sqrt(Math.pow(a, 3) / CONSTANTS.MU_EARTH);
			const timeToApoapsis = (angleToApoapsis / 360) * period;

			return {
				targetAnomaly,
				currentAnomaly,
				timeToApoapsis,
				message: `Burn at apoapsis to circularize at ${targetAltitude} km`,
			};
		}
	}

	/**
	 * Reset command handler (for new scenarios)
	 */
	reset() {
		this.burnQueue = [];
		logger.info("CommandHandler reset");
	}
}

module.exports = CommandHandler;
