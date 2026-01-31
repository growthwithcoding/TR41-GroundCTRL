/**
 * Performance Tracker Service
 * 
 * Tracks operator performance and mission metrics
 * Part of Mission Control Enhancement Plan - Phase 3
 * 
 * Features:
 * - Real-time performance scoring
 * - Command accuracy tracking
 * - Response time analysis
 * - Resource management evaluation
 * - Mission completion metrics
 */

const logger = require('../utils/logger');

/**
 * Performance Tracker Service
 * Monitors and scores operator performance during missions
 */
class PerformanceTracker {
  constructor() {
    this.sessionMetrics = new Map(); // sessionId -> metrics object
    
    // Scoring weights
    this.WEIGHTS = {
      COMMAND_ACCURACY: 0.30,      // 30% - correct commands
      RESPONSE_TIME: 0.20,         // 20% - timely responses
      RESOURCE_MANAGEMENT: 0.25,   // 25% - power/fuel efficiency
      COMPLETION_TIME: 0.15,       // 15% - mission duration
      ERROR_AVOIDANCE: 0.10        // 10% - avoiding errors
    };
    
    // Performance tiers
    this.TIERS = {
      EXCELLENT: { min: 90, label: 'Excellent', badge: '🌟' },
      GOOD: { min: 75, label: 'Good', badge: '✨' },
      SATISFACTORY: { min: 60, label: 'Satisfactory', badge: '👍' },
      NEEDS_IMPROVEMENT: { min: 0, label: 'Needs Improvement', badge: '📚' }
    };
  }

  /**
   * Initialize performance tracking for a session
   * @param {string} sessionId - Session ID
   * @param {object} scenario - Scenario configuration
   */
  initializeSession(sessionId, scenario) {
    const metrics = {
      sessionId,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      startTime: Date.now(),
      endTime: null,
      
      // Command metrics
      commands: {
        total: 0,
        correct: 0,
        incorrect: 0,
        redundant: 0,
        critical: 0
      },
      
      // Timing metrics
      timing: {
        firstCommandDelay: null,
        averageResponseTime: 0,
        responseTimes: [],
        stepCompletionTimes: []
      },
      
      // Resource metrics
      resources: {
        initialPower: 100,
        finalPower: 100,
        powerEfficiency: 100,
        initialFuel: 100,
        finalFuel: 100,
        fuelEfficiency: 100
      },
      
      // Error tracking
      errors: {
        count: 0,
        types: {},
        severity: {
          critical: 0,
          warning: 0,
          minor: 0
        }
      },
      
      // Step progress
      steps: {
        total: scenario.steps?.length || 0,
        completed: 0,
        skipped: 0,
        failed: 0
      },
      
      // Calculated scores
      scores: {
        commandAccuracy: 0,
        responseTime: 0,
        resourceManagement: 0,
        completionTime: 0,
        errorAvoidance: 0,
        overall: 0
      },
      
      // Performance tier
      tier: null,
      
      // Achievements
      achievements: []
    };
    
    this.sessionMetrics.set(sessionId, metrics);
    
    logger.info('Performance tracking initialized', {
      sessionId,
      scenarioName: scenario.name
    });
    
    return metrics;
  }

  /**
   * Record command execution
   * @param {string} sessionId - Session ID
   * @param {object} command - Command object
   * @param {boolean} wasCorrect - Whether command was appropriate
   * @param {boolean} wasRedundant - Whether command was redundant
   */
  recordCommand(sessionId, command, wasCorrect = true, wasRedundant = false) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return;
    
    metrics.commands.total++;
    
    if (wasCorrect) {
      metrics.commands.correct++;
    } else {
      metrics.commands.incorrect++;
    }
    
    if (wasRedundant) {
      metrics.commands.redundant++;
    }
    
    // Check if critical command
    const criticalCommands = ['SAFE_MODE', 'ABORT_BURN', 'SYSTEM_RESET'];
    if (criticalCommands.includes(command.commandName)) {
      metrics.commands.critical++;
    }
    
    // Record first command delay
    if (metrics.commands.total === 1) {
      metrics.timing.firstCommandDelay = Date.now() - metrics.startTime;
    }
    
    this.updateScores(sessionId);
  }

  /**
   * Record response time for a step or action
   * @param {string} sessionId - Session ID
   * @param {number} responseTime - Response time in milliseconds
   */
  recordResponseTime(sessionId, responseTime) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return;
    
    metrics.timing.responseTimes.push(responseTime);
    
    // Calculate average
    const sum = metrics.timing.responseTimes.reduce((a, b) => a + b, 0);
    metrics.timing.averageResponseTime = sum / metrics.timing.responseTimes.length;
    
    this.updateScores(sessionId);
  }

  /**
   * Record step completion
   * @param {string} sessionId - Session ID
   * @param {object} step - Step object
   * @param {number} completionTime - Time taken to complete step (ms)
   * @param {boolean} wasSuccessful - Whether step was completed successfully
   */
  recordStepCompletion(sessionId, step, completionTime, wasSuccessful = true) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return;
    
    if (wasSuccessful) {
      metrics.steps.completed++;
      metrics.timing.stepCompletionTimes.push(completionTime);
    } else {
      metrics.steps.failed++;
    }
    
    this.updateScores(sessionId);
    this.checkAchievements(sessionId);
  }

  /**
   * Record error occurrence
   * @param {string} sessionId - Session ID
   * @param {string} errorType - Type of error
   * @param {string} severity - Error severity (critical, warning, minor)
   */
  recordError(sessionId, errorType, severity = 'minor') {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return;
    
    metrics.errors.count++;
    metrics.errors.types[errorType] = (metrics.errors.types[errorType] || 0) + 1;
    metrics.errors.severity[severity]++;
    
    this.updateScores(sessionId);
  }

  /**
   * Update resource metrics
   * @param {string} sessionId - Session ID
   * @param {object} telemetry - Current telemetry data
   */
  updateResources(sessionId, telemetry) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return;
    
    // Update final values
    metrics.resources.finalPower = telemetry.power?.currentCharge_percent || 0;
    metrics.resources.finalFuel = telemetry.propulsion?.fuel_percent || 0;
    
    // Calculate efficiency (higher is better)
    metrics.resources.powerEfficiency = (metrics.resources.finalPower / metrics.resources.initialPower) * 100;
    metrics.resources.fuelEfficiency = (metrics.resources.finalFuel / metrics.resources.initialFuel) * 100;
    
    this.updateScores(sessionId);
  }

  /**
   * Complete session and calculate final scores
   * @param {string} sessionId - Session ID
   * @returns {object} Final metrics
   */
  completeSession(sessionId) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return null;
    
    metrics.endTime = Date.now();
    
    // Final score calculation
    this.updateScores(sessionId);
    
    // Determine tier
    const overallScore = metrics.scores.overall;
    for (const [tierName, tierInfo] of Object.entries(this.TIERS)) {
      if (overallScore >= tierInfo.min) {
        metrics.tier = {
          name: tierName,
          label: tierInfo.label,
          badge: tierInfo.badge
        };
        break;
      }
    }
    
    // Final achievement check
    this.checkAchievements(sessionId);
    
    logger.info('Session performance tracking completed', {
      sessionId,
      overallScore: metrics.scores.overall,
      tier: metrics.tier?.label
    });
    
    return metrics;
  }

  /**
   * Update all performance scores
   * @param {string} sessionId - Session ID
   */
  updateScores(sessionId) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return;
    
    // Command accuracy score
    if (metrics.commands.total > 0) {
      const accuracyRate = metrics.commands.correct / metrics.commands.total;
      const redundancyPenalty = Math.min(0.2, metrics.commands.redundant * 0.05);
      metrics.scores.commandAccuracy = Math.max(0, (accuracyRate - redundancyPenalty) * 100);
    }
    
    // Response time score (faster is better, but not too fast)
    if (metrics.timing.averageResponseTime > 0) {
      const avgSeconds = metrics.timing.averageResponseTime / 1000;
      // Optimal response time: 5-15 seconds
      if (avgSeconds >= 5 && avgSeconds <= 15) {
        metrics.scores.responseTime = 100;
      } else if (avgSeconds < 5) {
        metrics.scores.responseTime = 80; // Too hasty
      } else {
        // Penalty for slow response (linear decay after 15s)
        metrics.scores.responseTime = Math.max(0, 100 - ((avgSeconds - 15) * 2));
      }
    } else {
      metrics.scores.responseTime = 100; // Default if no data
    }
    
    // Resource management score (average of power and fuel efficiency)
    metrics.scores.resourceManagement = (
      (metrics.resources.powerEfficiency + metrics.resources.fuelEfficiency) / 2
    );
    
    // Completion time score (based on steps completed vs expected time)
    if (metrics.steps.total > 0) {
      const completionRate = metrics.steps.completed / metrics.steps.total;
      const elapsedTime = (metrics.endTime || Date.now()) - metrics.startTime;
      const elapsedMinutes = elapsedTime / 60000;
      
      // Base score on completion rate
      let timeScore = completionRate * 100;
      
      // Bonus for fast completion (but not too fast)
      if (elapsedMinutes < 30 && completionRate > 0.9) {
        timeScore = Math.min(100, timeScore + 10);
      }
      
      metrics.scores.completionTime = timeScore;
    }
    
    // Error avoidance score
    const criticalErrorPenalty = metrics.errors.severity.critical * 20;
    const warningErrorPenalty = metrics.errors.severity.warning * 10;
    const minorErrorPenalty = metrics.errors.severity.minor * 5;
    
    metrics.scores.errorAvoidance = Math.max(0, 
      100 - criticalErrorPenalty - warningErrorPenalty - minorErrorPenalty
    );
    
    // Calculate weighted overall score
    metrics.scores.overall = (
      (metrics.scores.commandAccuracy * this.WEIGHTS.COMMAND_ACCURACY) +
      (metrics.scores.responseTime * this.WEIGHTS.RESPONSE_TIME) +
      (metrics.scores.resourceManagement * this.WEIGHTS.RESOURCE_MANAGEMENT) +
      (metrics.scores.completionTime * this.WEIGHTS.COMPLETION_TIME) +
      (metrics.scores.errorAvoidance * this.WEIGHTS.ERROR_AVOIDANCE)
    );
    
    // Round scores
    Object.keys(metrics.scores).forEach(key => {
      metrics.scores[key] = Math.round(metrics.scores[key] * 10) / 10;
    });
  }

  /**
   * Check for achievements
   * @param {string} sessionId - Session ID
   */
  checkAchievements(sessionId) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return;
    
    const achievements = [];
    
    // Perfect Commander - No errors
    if (metrics.errors.count === 0 && metrics.commands.total >= 10) {
      achievements.push({
        id: 'perfect_commander',
        name: 'Perfect Commander',
        description: 'Complete mission with zero errors',
        badge: '🏆'
      });
    }
    
    // Speed Runner - Complete in under 15 minutes
    const duration = (metrics.endTime || Date.now()) - metrics.startTime;
    if (duration < 900000 && metrics.steps.completed === metrics.steps.total) {
      achievements.push({
        id: 'speed_runner',
        name: 'Speed Runner',
        description: 'Complete mission in under 15 minutes',
        badge: '⚡'
      });
    }
    
    // Resource Master - >90% efficiency on both power and fuel
    if (metrics.resources.powerEfficiency > 90 && metrics.resources.fuelEfficiency > 90) {
      achievements.push({
        id: 'resource_master',
        name: 'Resource Master',
        description: 'Maintain >90% power and fuel efficiency',
        badge: '💎'
      });
    }
    
    // Quick Responder - Average response time under 10 seconds
    if (metrics.timing.averageResponseTime < 10000 && metrics.timing.responseTimes.length >= 5) {
      achievements.push({
        id: 'quick_responder',
        name: 'Quick Responder',
        description: 'Maintain average response time under 10 seconds',
        badge: '🚀'
      });
    }
    
    // Command Efficiency - >95% command accuracy
    if (metrics.commands.total > 0 && (metrics.commands.correct / metrics.commands.total) > 0.95) {
      achievements.push({
        id: 'command_efficiency',
        name: 'Command Efficiency',
        description: 'Achieve >95% command accuracy',
        badge: '🎯'
      });
    }
    
    // Add new achievements that weren't already awarded
    achievements.forEach(achievement => {
      if (!metrics.achievements.find(a => a.id === achievement.id)) {
        metrics.achievements.push(achievement);
        
        logger.info('Achievement unlocked', {
          sessionId,
          achievementId: achievement.id,
          achievementName: achievement.name
        });
      }
    });
  }

  /**
   * Get current metrics for a session
   * @param {string} sessionId - Session ID
   * @returns {object} Current metrics
   */
  getMetrics(sessionId) {
    return this.sessionMetrics.get(sessionId) || null;
  }

  /**
   * Get performance summary
   * @param {string} sessionId - Session ID
   * @returns {object} Performance summary
   */
  getSummary(sessionId) {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return null;
    
    const duration = (metrics.endTime || Date.now()) - metrics.startTime;
    
    return {
      overallScore: metrics.scores.overall,
      tier: metrics.tier,
      duration: Math.round(duration / 1000), // seconds
      commandsIssued: metrics.commands.total,
      commandAccuracy: ((metrics.commands.correct / metrics.commands.total) * 100).toFixed(1),
      stepsCompleted: `${metrics.steps.completed}/${metrics.steps.total}`,
      errorCount: metrics.errors.count,
      achievements: metrics.achievements.length,
      breakdown: metrics.scores
    };
  }

  /**
   * Cleanup session
   * @param {string} sessionId - Session ID
   */
  cleanupSession(sessionId) {
    this.sessionMetrics.delete(sessionId);
    logger.info('Performance tracking session cleaned up', { sessionId });
  }

  /**
   * Get all active sessions
   * @returns {Array} Array of session IDs
   */
  getActiveSessions() {
    return Array.from(this.sessionMetrics.keys());
  }
}

module.exports = PerformanceTracker;
