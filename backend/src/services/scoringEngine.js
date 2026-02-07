/**
 * Scoring Engine Service
 * 
 * Calculates multi-dimensional scores for scenario sessions.
 * Tracks achievements and maintains leaderboards.
 * 
 * Scoring Dimensions:
 * - Coverage: Objectives completed (40%)
 * - Efficiency: Resource usage optimization (30%)
 * - Safety: Violations avoided (20%)
 * - Timing: Precision and accuracy (10%)
 */

const logger = require('../utils/logger');

/**
 * @typedef {Object} ScoreBreakdown
 * @property {number} coverage - Objectives completed score (0-100)
 * @property {number} efficiency - Resource usage score (0-100)
 * @property {number} safety - Safety violations score (0-100)
 * @property {number} timing - Timing precision score (0-100)
 */

/**
 * @typedef {Object} Score
 * @property {number} total - Overall score (0-100)
 * @property {ScoreBreakdown} breakdown - Individual dimension scores
 * @property {Object} weights - Dimension weights used
 * @property {string[]} achievements - Special achievements earned
 * @property {Object} metrics - Raw metrics used for scoring
 */

class ScoringEngine {
  constructor() {
    /**
     * Default scoring weights
     * @type {Object}
     */
    this.defaultWeights = {
      coverageWeight: 0.40,
      efficiencyWeight: 0.30,
      safetyWeight: 0.20,
      timingWeight: 0.10
    };

    /**
     * Achievement definitions
     * @type {Array<Object>}
     */
    this.achievements = [
      {
        id: 'perfect_burn',
        name: 'Perfect Burn',
        description: 'Execute a burn with <1% delta-V error',
        check: (session) => {
          const burns = session.commandHistory?.filter(c => c.name === 'EXECUTE_BURN') || [];
          return burns.some(b => b.accuracy && b.accuracy > 0.99);
        }
      },
      {
        id: 'fuel_efficient',
        name: 'Fuel Efficient',
        description: 'Complete mission using <80% of fuel budget',
        check: (session) => {
          const used = session.deltaVUsed_ms || 0;
          const budget = session.deltaVBudget_ms || 300;
          return (used / budget) < 0.80;
        }
      },
      {
        id: 'no_alerts',
        name: 'Flawless Execution',
        description: 'Complete mission with zero critical alerts',
        check: (session) => {
          const criticalAlerts = session.alertsTriggered || 0;
          return criticalAlerts === 0;
        }
      },
      {
        id: 'speed_run',
        name: 'Speed Run',
        description: 'Complete mission in <80% of estimated time',
        check: (session) => {
          const actual = session.totalTime || 0;
          const estimated = session.estimatedTime || 600;
          return (actual / estimated) < 0.80;
        }
      },
      {
        id: 'perfect_score',
        name: 'Perfect Mission',
        description: 'Achieve 100% score',
        check: (session) => {
          return session.score?.total === 100;
        }
      },
      {
        id: 'hohmann_master',
        name: 'Hohmann Master',
        description: 'Execute perfect two-burn Hohmann transfer',
        check: (session) => {
          const burns = session.commandHistory?.filter(c => c.name === 'EXECUTE_BURN') || [];
          return burns.length === 2 && 
                 session.orbitalElements?.e < 0.01 &&
                 session.stepsCompleted >= 4;
        }
      }
    ];

    logger.info('ScoringEngine initialized');
  }

  /**
   * Calculate coverage score
   * Based on steps completed vs total steps
   * 
   * @param {Object} sessionData - Session data
   * @returns {number} Coverage score (0-100)
   */
  calculateCoverage(sessionData) {
    const completed = sessionData.stepsCompleted || 0;
    const total = sessionData.totalSteps || 1;
    
    const coverageScore = (completed / total) * 100;
    
    logger.debug('Coverage calculated', {
      completed,
      total,
      score: coverageScore.toFixed(1)
    });
    
    return Math.min(100, coverageScore);
  }

  /**
   * Calculate efficiency score
   * Based on delta-V budget utilization
   * 
   * Formula: Efficiency = (1 - (Delta-V Used / Delta-V Budget)) × 100
   * 
   * @param {Object} sessionData - Session data
   * @returns {number} Efficiency score (0-100)
   */
  calculateEfficiency(sessionData) {
    const used = sessionData.deltaVUsed_ms || 0;
    const budget = sessionData.deltaVBudget_ms || 300;
    
    // Efficiency score: less usage = higher score
    const efficiencyScore = Math.max(0, (1 - (used / budget))) * 100;
    
    logger.debug('Efficiency calculated', {
      used: used.toFixed(1),
      budget: budget.toFixed(1),
      utilization: ((used / budget) * 100).toFixed(1) + '%',
      score: efficiencyScore.toFixed(1)
    });
    
    return Math.min(100, efficiencyScore);
  }

  /**
   * Calculate safety score
   * Based on alerts triggered (exponential penalty)
   * 
   * Formula: Safety = e^(-violations × penalty_factor) × 100
   * 
   * @param {Object} sessionData - Session data
   * @returns {number} Safety score (0-100)
   */
  calculateSafety(sessionData) {
    const violations = sessionData.alertsTriggered || 0;
    const penaltyFactor = 0.2; // Each violation reduces score by ~18%
    
    // Exponential decay for violations
    const safetyScore = Math.exp(-violations * penaltyFactor) * 100;
    
    logger.debug('Safety calculated', {
      violations,
      score: safetyScore.toFixed(1)
    });
    
    return Math.min(100, safetyScore);
  }

  /**
   * Calculate timing score
   * Based on precision of burn execution timing
   * 
   * Formula: Timing = (1 - (Average Time Error / Average Window)) × 100
   * 
   * @param {Object} sessionData - Session data
   * @returns {number} Timing score (0-100)
   */
  calculateTiming(sessionData) {
    const timingErrors = sessionData.timingErrors || [];
    
    if (timingErrors.length === 0) {
      return 100; // Perfect timing if no data
    }
    
    // Calculate average error
    const avgError = timingErrors.reduce((sum, error) => 
      sum + Math.abs(error.actual - error.optimal), 0
    ) / timingErrors.length;
    
    // Calculate average acceptable window
    const avgWindow = timingErrors.reduce((sum, error) => 
      sum + error.window, 0
    ) / timingErrors.length;
    
    // Timing score: smaller error relative to window = higher score
    const timingScore = Math.max(0, (1 - (avgError / avgWindow))) * 100;
    
    logger.debug('Timing calculated', {
      errors: timingErrors.length,
      avgError: avgError.toFixed(1),
      avgWindow: avgWindow.toFixed(1),
      score: timingScore.toFixed(1)
    });
    
    return Math.min(100, timingScore);
  }

  /**
   * Calculate total score with weighted dimensions
   * 
   * @param {Object} scenario - Scenario configuration
   * @param {Object} sessionData - Session performance data
   * @returns {Score} Complete score object
   */
  calculateTotalScore(scenario, sessionData) {
    // Calculate individual dimension scores
    const coverage = this.calculateCoverage(sessionData);
    const efficiency = this.calculateEfficiency(sessionData);
    const safety = this.calculateSafety(sessionData);
    const timing = this.calculateTiming(sessionData);

    // Get weights (use scenario-specific or defaults)
    const weights = scenario.scoring || this.defaultWeights;

    // Calculate weighted total
    const total = (
      (coverage / 100) * weights.coverageWeight +
      (efficiency / 100) * weights.efficiencyWeight +
      (safety / 100) * weights.safetyWeight +
      (timing / 100) * weights.timingWeight
    ) * 100;

    // Check for achievements
    const achievements = this.checkAchievements(sessionData);

    // Prepare score object
    const score = {
      total: Math.round(total),
      breakdown: {
        coverage: Math.round(coverage),
        efficiency: Math.round(efficiency),
        safety: Math.round(safety),
        timing: Math.round(timing)
      },
      weights,
      achievements,
      metrics: {
        stepsCompleted: sessionData.stepsCompleted || 0,
        totalSteps: sessionData.totalSteps || 0,
        deltaVUsed_ms: sessionData.deltaVUsed_ms || 0,
        deltaVBudget_ms: sessionData.deltaVBudget_ms || 0,
        alertsTriggered: sessionData.alertsTriggered || 0,
        timingErrorCount: (sessionData.timingErrors || []).length
      }
    };

    logger.info('Total score calculated', {
      total: score.total,
      breakdown: score.breakdown,
      achievements: achievements.length
    });

    return score;
  }

  /**
   * Check which achievements were earned
   * 
   * @param {Object} sessionData - Session data
   * @returns {string[]} Array of earned achievement IDs
   */
  checkAchievements(sessionData) {
    const earned = [];

    for (const achievement of this.achievements) {
      try {
        if (achievement.check(sessionData)) {
          earned.push(achievement.id);
          logger.info('Achievement earned', {
            id: achievement.id,
            name: achievement.name
          });
        }
      } catch (error) {
        logger.warn('Achievement check failed', {
          id: achievement.id,
          error: error.message
        });
      }
    }

    return earned;
  }

  /**
   * Get achievement details by ID
   * 
   * @param {string} achievementId - Achievement ID
   * @returns {Object|null} Achievement details or null
   */
  getAchievement(achievementId) {
    return this.achievements.find(a => a.id === achievementId) || null;
  }

  /**
   * Get all available achievements
   * 
   * @returns {Array<Object>} All achievement definitions
   */
  getAllAchievements() {
    return this.achievements.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description
    }));
  }

  /**
   * Calculate score for partial completion (mid-mission)
   * Uses current progress to estimate final score
   * 
   * @param {Object} scenario - Scenario configuration
   * @param {Object} currentState - Current session state
   * @returns {Score} Current score projection
   */
  calculatePartialScore(scenario, currentState) {
    // Use current state as session data
    const sessionData = {
      stepsCompleted: currentState.currentStep?.stepOrder || 0,
      totalSteps: scenario.steps?.length || 1,
      deltaVUsed_ms: currentState.deltaVUsed_ms || 0,
      deltaVBudget_ms: currentState.deltaVBudget_ms || 300,
      alertsTriggered: (currentState.activeAlerts || []).length,
      timingErrors: currentState.timingErrors || []
    };

    return this.calculateTotalScore(scenario, sessionData);
  }

  /**
   * Compare scores (for leaderboards)
   * 
   * @param {Score} scoreA - First score
   * @param {Score} scoreB - Second score
   * @returns {number} -1 if A > B, 1 if B > A, 0 if equal
   */
  compareScores(scoreA, scoreB) {
    if (scoreA.total > scoreB.total) return -1;
    if (scoreA.total < scoreB.total) return 1;

    // If totals are equal, compare achievements
    if (scoreA.achievements.length > scoreB.achievements.length) return -1;
    if (scoreA.achievements.length < scoreB.achievements.length) return 1;

    // If still equal, compare efficiency
    if (scoreA.breakdown.efficiency > scoreB.breakdown.efficiency) return -1;
    if (scoreA.breakdown.efficiency < scoreB.breakdown.efficiency) return 1;

    return 0;
  }

  /**
   * Get score grade/rating
   * 
   * @param {number} totalScore - Total score (0-100)
   * @returns {Object} Grade info
   */
  getScoreGrade(totalScore) {
    if (totalScore >= 95) {
      return {
        grade: 'S',
        label: 'Outstanding',
        color: '#FFD700' // Gold
      };
    } else if (totalScore >= 85) {
      return {
        grade: 'A',
        label: 'Excellent',
        color: '#22c55e' // Green
      };
    } else if (totalScore >= 75) {
      return {
        grade: 'B',
        label: 'Good',
        color: '#3b82f6' // Blue
      };
    } else if (totalScore >= 60) {
      return {
        grade: 'C',
        label: 'Satisfactory',
        color: '#eab308' // Yellow
      };
    } else if (totalScore >= 50) {
      return {
        grade: 'D',
        label: 'Needs Improvement',
        color: '#f97316' // Orange
      };
    } else {
      return {
        grade: 'F',
        label: 'Unsuccessful',
        color: '#ef4444' // Red
      };
    }
  }

  /**
   * Format score for display
   * 
   * @param {Score} score - Score object
   * @returns {Object} Formatted score data
   */
  formatScore(score) {
    const grade = this.getScoreGrade(score.total);

    return {
      total: score.total,
      grade: grade.grade,
      gradeLabel: grade.label,
      gradeColor: grade.color,
      breakdown: score.breakdown,
      achievements: score.achievements.map(id => {
        const achievement = this.getAchievement(id);
        return achievement ? {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description
        } : null;
      }).filter(a => a !== null),
      metrics: score.metrics
    };
  }
}

module.exports = ScoringEngine;
