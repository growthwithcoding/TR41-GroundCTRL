/**
 * Time Manager Service
 *
 * Manages simulation time, auto time-warp, and key event detection
 * for the game mechanics layer. Implements hybrid real/arcade time system.
 *
 * Key Features:
 * - Auto time-warp during coasts (20-60x)
 * - Automatic slowdown near key events
 * - Key event registration and tracking
 * - Time scale calculation based on proximity to events
 */

const logger = require("../utils/logger");

/**
 * @typedef {Object} KeyEvent
 * @property {string} id - Unique event ID
 * @property {string} type - 'burn'|'gs_pass'|'step_deadline'|'eclipse'|'periapsis'|'apoapsis'
 * @property {number} time - Event time (simulation seconds)
 * @property {number} warningWindow - Seconds before event to slow down (default: 60)
 * @property {string} description - Human-readable description
 * @property {boolean} active - Whether event is still upcoming
 */

/**
 * @typedef {Object} TimeState
 * @property {number} simulationTime - Seconds since scenario start
 * @property {number} realTime - Real-world milliseconds elapsed
 * @property {number} timeScale - Current speed multiplier (1x to 60x)
 * @property {number} baseTimeScale - Default scale (1.0)
 * @property {number} coastTimeScale - Warp during coasts (30.0)
 * @property {KeyEvent[]} keyEvents - Registered upcoming events
 * @property {KeyEvent|null} nearestEvent - Next upcoming event
 */

class TimeManager {
	constructor() {
		/**
		 * Base time scale (real-time)
		 * @type {number}
		 */
		this.baseTimeScale = 1.0;

		/**
		 * Current time scale multiplier
		 * @type {number}
		 */
		this.currentTimeScale = 1.0;

		/**
		 * Coast time scale (auto-warp during empty periods)
		 * @type {number}
		 */
		this.coastTimeScale = 30.0;

		/**
		 * Registered key events
		 * @type {KeyEvent[]}
		 */
		this.keyEvents = [];

		/**
		 * Event ID counter
		 * @type {number}
		 */
		this.eventIdCounter = 0;

		logger.info("TimeManager initialized", {
			baseTimeScale: this.baseTimeScale,
			coastTimeScale: this.coastTimeScale,
		});
	}

	/**
	 * Register a new key event
	 *
	 * @param {Object} event - Event to register
	 * @param {string} event.type - Event type
	 * @param {number} event.time - Event time (sim seconds)
	 * @param {number} [event.warningWindow=60] - Warning window in seconds
	 * @param {string} [event.description] - Description
	 * @returns {string} Event ID
	 */
	registerKeyEvent(event) {
		const eventId = `event_${++this.eventIdCounter}_${Date.now()}`;

		const keyEvent = {
			id: eventId,
			type: event.type,
			time: event.time,
			warningWindow: event.warningWindow || 60,
			description: event.description || `${event.type} at t=${event.time}s`,
			active: true,
		};

		this.keyEvents.push(keyEvent);

		// Sort by time
		this.keyEvents.sort((a, b) => a.time - b.time);

		logger.debug("Key event registered", {
			eventId,
			type: event.type,
			time: event.time,
			totalEvents: this.keyEvents.length,
		});

		return eventId;
	}

	/**
	 * Remove a key event by ID
	 *
	 * @param {string} eventId - Event ID to remove
	 * @returns {boolean} Success
	 */
	removeKeyEvent(eventId) {
		const initialLength = this.keyEvents.length;
		this.keyEvents = this.keyEvents.filter((e) => e.id !== eventId);
		const removed = this.keyEvents.length < initialLength;

		if (removed) {
			logger.debug("Key event removed", { eventId });
		}

		return removed;
	}

	/**
	 * Mark event as completed and remove it
	 *
	 * @param {string} eventId - Event ID
	 */
	completeEvent(eventId) {
		this.removeKeyEvent(eventId);
		logger.debug("Key event completed", { eventId });
	}

	/**
	 * Clear all events
	 */
	clearAllEvents() {
		const count = this.keyEvents.length;
		this.keyEvents = [];
		logger.info("All key events cleared", { count });
	}

	/**
	 * Find the nearest upcoming event
	 *
	 * @param {number} currentSimTime - Current simulation time
	 * @returns {KeyEvent|null} Nearest event or null
	 */
	findNearestEvent(currentSimTime) {
		// Filter active events that haven't occurred yet
		const upcomingEvents = this.keyEvents.filter(
			(e) => e.active && e.time > currentSimTime,
		);

		if (upcomingEvents.length === 0) {
			return null;
		}

		// Return the first (earliest) event
		return upcomingEvents[0];
	}

	/**
	 * Update time scale based on proximity to key events
	 *
	 * This is the core time management algorithm:
	 * - Far from events: Use coast time-warp (20-60x)
	 * - Moderate distance: Medium speed (10x)
	 * - Near events: Slow to real-time (1x)
	 * - During critical phases: Force real-time
	 *
	 * @param {number} currentSimTime - Current simulation time
	 * @param {Object} [options] - Additional options
	 * @param {boolean} [options.forcedRealTime] - Force 1x time scale
	 * @param {number} [options.maxTimeScale] - Maximum allowed time scale
	 * @returns {number} New time scale
	 */
	updateTimeScale(currentSimTime, options = {}) {
		// Check for forced real-time (e.g., during burns)
		if (options.forcedRealTime) {
			this.currentTimeScale = 1.0;
			return this.currentTimeScale;
		}

		// Find nearest upcoming event
		const nearestEvent = this.findNearestEvent(currentSimTime);

		if (!nearestEvent) {
			// No upcoming events - use coast time-warp
			this.currentTimeScale = Math.min(
				this.coastTimeScale,
				options.maxTimeScale || this.coastTimeScale,
			);
			return this.currentTimeScale;
		}

		// Calculate time until event
		const timeUntilEvent = nearestEvent.time - currentSimTime;

		// Determine appropriate time scale
		let newTimeScale;

		if (timeUntilEvent <= nearestEvent.warningWindow) {
			// Within warning window - slow to real-time
			newTimeScale = 1.0;

			logger.debug("Approaching key event - slowing to real-time", {
				eventType: nearestEvent.type,
				timeUntilEvent: timeUntilEvent.toFixed(1),
				description: nearestEvent.description,
			});
		} else if (timeUntilEvent <= 300) {
			// 5 minutes away - moderate speed
			newTimeScale = 10.0;
		} else if (timeUntilEvent <= 600) {
			// 10 minutes away - faster
			newTimeScale = 20.0;
		} else {
			// Far from event - full coast speed
			newTimeScale = this.coastTimeScale;
		}

		// Apply maximum time scale limit if specified
		if (options.maxTimeScale) {
			newTimeScale = Math.min(newTimeScale, options.maxTimeScale);
		}

		// Only log if scale changed significantly
		if (Math.abs(this.currentTimeScale - newTimeScale) > 0.1) {
			logger.debug("Time scale updated", {
				from: this.currentTimeScale,
				to: newTimeScale,
				reason: nearestEvent ? `Near ${nearestEvent.type}` : "Coast phase",
			});
		}

		this.currentTimeScale = newTimeScale;
		return this.currentTimeScale;
	}

	/**
	 * Get current time state
	 *
	 * @param {number} currentSimTime - Current simulation time
	 * @returns {TimeState} Current time state
	 */
	getTimeState(currentSimTime) {
		const nearestEvent = this.findNearestEvent(currentSimTime);

		return {
			simulationTime: currentSimTime,
			timeScale: this.currentTimeScale,
			baseTimeScale: this.baseTimeScale,
			coastTimeScale: this.coastTimeScale,
			keyEvents: this.keyEvents.filter((e) => e.active),
			nearestEvent: nearestEvent,
		};
	}

	/**
	 * Calculate simulation time step
	 *
	 * @param {number} deltaRealTime_ms - Real-world time elapsed (ms)
	 * @returns {number} Simulation time step (seconds)
	 */
	calculateSimulationTimeStep(deltaRealTime_ms) {
		return (deltaRealTime_ms / 1000) * this.currentTimeScale;
	}

	/**
	 * Predict next time scale change
	 * Useful for UI to show warnings
	 *
	 * @param {number} currentSimTime - Current simulation time
	 * @returns {Object|null} Next scale change info
	 */
	predictNextScaleChange(currentSimTime) {
		const nearestEvent = this.findNearestEvent(currentSimTime);

		if (!nearestEvent) {
			return null;
		}

		const timeUntilEvent = nearestEvent.time - currentSimTime;
		const timeUntilSlowdown = timeUntilEvent - nearestEvent.warningWindow;

		if (timeUntilSlowdown > 0 && this.currentTimeScale > 1.0) {
			return {
				event: nearestEvent,
				timeUntilChange: timeUntilSlowdown,
				currentScale: this.currentTimeScale,
				nextScale: 1.0,
				reason: `Approaching ${nearestEvent.type}`,
			};
		}

		return null;
	}

	/**
	 * Auto-register orbital events based on orbital elements
	 * Convenience method to register periapsis/apoapsis events
	 *
	 * @param {number} currentSimTime - Current simulation time
	 * @param {Object} orbitalElements - Current orbital elements
	 * @param {number} orbitalElements.a - Semi-major axis (km)
	 * @param {number} orbitalElements.e - Eccentricity
	 * @param {number} orbitalElements.trueAnomaly - Current true anomaly (degrees)
	 */
	registerOrbitalEvents(currentSimTime, orbitalElements) {
		const { a, _e, trueAnomaly } = orbitalElements;
		const MU = 398600.4418; // Earth's gravitational parameter (km³/s²)

		// Calculate orbital period
		const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / MU);

		// Calculate time to next apoapsis (true anomaly = 180°)
		let angleToApoapsis = (180 - trueAnomaly + 360) % 360;
		if (angleToApoapsis > 180) angleToApoapsis -= 360;

		const timeToApoapsis = (angleToApoapsis / 360) * period;

		if (timeToApoapsis > 0 && timeToApoapsis < period) {
			this.registerKeyEvent({
				type: "apoapsis",
				time: currentSimTime + timeToApoapsis,
				warningWindow: 60,
				description: "Apoapsis - optimal burn point",
			});
		}

		// Calculate time to next periapsis (true anomaly = 0°)
		let angleToPeriapsis = (360 - trueAnomaly) % 360;
		if (angleToPeriapsis > 180) angleToPeriapsis -= 360;

		const timeToPeriapsis = (angleToPeriapsis / 360) * period;

		if (timeToPeriapsis > 0 && timeToPeriapsis < period) {
			this.registerKeyEvent({
				type: "periapsis",
				time: currentSimTime + timeToPeriapsis,
				warningWindow: 60,
				description: "Periapsis - optimal burn point",
			});
		}

		logger.debug("Orbital events registered", {
			timeToApoapsis: timeToApoapsis.toFixed(1),
			timeToPeriapsis: timeToPeriapsis.toFixed(1),
			period: period.toFixed(1),
		});
	}

	/**
	 * Register ground station pass event
	 *
	 * @param {number} passStartTime - Pass start time (sim seconds)
	 * @param {number} passDuration - Pass duration (seconds)
	 * @param {string} stationName - Ground station name
	 */
	registerGroundStationPass(passStartTime, passDuration, stationName) {
		return this.registerKeyEvent({
			type: "gs_pass",
			time: passStartTime,
			warningWindow: 30,
			description: `Ground station pass: ${stationName} (${passDuration.toFixed(0)}s)`,
		});
	}

	/**
	 * Register scenario step deadline
	 *
	 * @param {number} deadlineTime - Deadline time (sim seconds)
	 * @param {string} stepTitle - Step title
	 */
	registerStepDeadline(deadlineTime, stepTitle) {
		return this.registerKeyEvent({
			type: "step_deadline",
			time: deadlineTime,
			warningWindow: 30,
			description: `Step deadline: ${stepTitle}`,
		});
	}

	/**
	 * Reset time manager (for new scenarios)
	 */
	reset() {
		this.currentTimeScale = 1.0;
		this.keyEvents = [];
		this.eventIdCounter = 0;
		logger.info("TimeManager reset");
	}
}

module.exports = TimeManager;
