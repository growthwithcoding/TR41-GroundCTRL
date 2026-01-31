/**
 * Certificate Generator Service
 * 
 * Generates mission completion certificates and achievement badges
 * Part of Mission Control Enhancement Plan - Phase 5
 * 
 * Features:
 * - Mission completion certificates
 * - Achievement badges
 * - Performance summaries
 * - Shareable certificate data
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Certificate Generator Service
 * Creates certificates and badges for mission accomplishments
 */
class CertificateGenerator {
  constructor() {
    // Certificate templates
    this.TEMPLATES = {
      MISSION_COMPLETE: 'mission_complete',
      EXCELLENT_PERFORMANCE: 'excellent_performance',
      FIRST_MISSION: 'first_mission',
      SCENARIO_MASTER: 'scenario_master'
    };
    
    // Badge definitions
    this.BADGES = {
      // Performance tiers
      EXCELLENT: { id: 'excellent', name: 'Excellent Operator', icon: '🌟', color: '#FFD700' },
      GOOD: { id: 'good', name: 'Good Operator', icon: '✨', color: '#C0C0C0' },
      SATISFACTORY: { id: 'satisfactory', name: 'Satisfactory Operator', icon: '👍', color: '#CD7F32' },
      
      // Achievements
      PERFECT_COMMANDER: { id: 'perfect_commander', name: 'Perfect Commander', icon: '🏆', color: '#FFD700' },
      SPEED_RUNNER: { id: 'speed_runner', name: 'Speed Runner', icon: '⚡', color: '#FFA500' },
      RESOURCE_MASTER: { id: 'resource_master', name: 'Resource Master', icon: '💎', color: '#00CED1' },
      QUICK_RESPONDER: { id: 'quick_responder', name: 'Quick Responder', icon: '🚀', color: '#FF4500' },
      COMMAND_EFFICIENCY: { id: 'command_efficiency', name: 'Command Efficiency', icon: '🎯', color: '#32CD32' },
      
      // Milestones
      FIRST_MISSION: { id: 'first_mission', name: 'First Mission', icon: '🎓', color: '#4169E1' },
      VETERAN_OPERATOR: { id: 'veteran_operator', name: 'Veteran Operator', icon: '⭐', color: '#800080' },
      MISSION_SPECIALIST: { id: 'mission_specialist', name: 'Mission Specialist', icon: '🛰️', color: '#008080' }
    };
  }

  /**
   * Generate mission completion certificate
   * @param {string} userId - User ID
   * @param {string} userName - User's name
   * @param {object} sessionMetrics - Performance metrics from performanceTracker
   * @param {object} scenario - Scenario information
   * @returns {object} Certificate data
   */
  generateMissionCertificate(userId, userName, sessionMetrics, scenario) {
    const certificateId = this.generateCertificateId(userId, sessionMetrics.sessionId);
    const completionDate = new Date(sessionMetrics.endTime);
    
    // Determine certificate template based on performance
    let template = this.TEMPLATES.MISSION_COMPLETE;
    if (sessionMetrics.tier?.name === 'EXCELLENT') {
      template = this.TEMPLATES.EXCELLENT_PERFORMANCE;
    }
    
    const certificate = {
      id: certificateId,
      userId,
      userName,
      type: 'mission_completion',
      template,
      
      // Mission details
      mission: {
        name: scenario.name,
        description: scenario.description,
        difficulty: scenario.difficulty || 'intermediate',
        sessionId: sessionMetrics.sessionId
      },
      
      // Performance summary
      performance: {
        overallScore: sessionMetrics.scores.overall,
        tier: sessionMetrics.tier,
        duration: this.formatDuration(sessionMetrics.endTime - sessionMetrics.startTime),
        commandsIssued: sessionMetrics.commands.total,
        stepsCompleted: `${sessionMetrics.steps.completed}/${sessionMetrics.steps.total}`,
        achievements: sessionMetrics.achievements
      },
      
      // Metadata
      completionDate: completionDate.toISOString(),
      completionDateFormatted: completionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      generatedAt: Date.now(),
      
      // Shareable data
      shareableText: this.generateShareableText(userName, scenario.name, sessionMetrics),
      shareableUrl: null // Could be populated with a URL to view certificate
    };
    
    logger.info('Mission certificate generated', {
      certificateId,
      userId,
      scenarioName: scenario.name,
      overallScore: sessionMetrics.scores.overall
    });
    
    return certificate;
  }

  /**
   * Generate achievement badge
   * @param {string} userId - User ID
   * @param {string} achievementId - Achievement ID
   * @param {object} context - Additional context
   * @returns {object} Badge data
   */
  generateAchievementBadge(userId, achievementId, context = {}) {
    const badge = this.getBadgeDefinition(achievementId);
    
    if (!badge) {
      logger.warn('Unknown achievement ID', { achievementId });
      return null;
    }
    
    const badgeData = {
      id: `${userId}_${achievementId}_${Date.now()}`,
      userId,
      achievementId,
      badge,
      earnedAt: Date.now(),
      earnedAtFormatted: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      context
    };
    
    logger.info('Achievement badge generated', {
      userId,
      achievementId,
      badgeName: badge.name
    });
    
    return badgeData;
  }

  /**
   * Generate performance summary report
   * @param {object} sessionMetrics - Performance metrics
   * @returns {object} Summary report
   */
  generatePerformanceSummary(sessionMetrics) {
    const duration = sessionMetrics.endTime - sessionMetrics.startTime;
    
    return {
      // Overview
      overview: {
        overallScore: sessionMetrics.scores.overall,
        tier: sessionMetrics.tier,
        duration: this.formatDuration(duration),
        completionRate: `${Math.round((sessionMetrics.steps.completed / sessionMetrics.steps.total) * 100)}%`
      },
      
      // Detailed scores
      scores: {
        commandAccuracy: {
          score: sessionMetrics.scores.commandAccuracy,
          details: `${sessionMetrics.commands.correct}/${sessionMetrics.commands.total} commands correct`
        },
        responseTime: {
          score: sessionMetrics.scores.responseTime,
          details: `${Math.round(sessionMetrics.timing.averageResponseTime / 1000)}s average response time`
        },
        resourceManagement: {
          score: sessionMetrics.scores.resourceManagement,
          details: `Power: ${Math.round(sessionMetrics.resources.powerEfficiency)}%, Fuel: ${Math.round(sessionMetrics.resources.fuelEfficiency)}%`
        },
        completionTime: {
          score: sessionMetrics.scores.completionTime,
          details: `${sessionMetrics.steps.completed}/${sessionMetrics.steps.total} steps completed`
        },
        errorAvoidance: {
          score: sessionMetrics.scores.errorAvoidance,
          details: `${sessionMetrics.errors.count} total errors`
        }
      },
      
      // Strengths and improvements
      analysis: this.analyzePerformance(sessionMetrics),
      
      // Achievements
      achievements: sessionMetrics.achievements.map(a => ({
        name: a.name,
        description: a.description,
        badge: a.badge
      }))
    };
  }

  /**
   * Analyze performance and provide feedback
   * @param {object} metrics - Performance metrics
   * @returns {object} Analysis with strengths and improvements
   */
  analyzePerformance(metrics) {
    const strengths = [];
    const improvements = [];
    
    // Analyze command accuracy
    if (metrics.scores.commandAccuracy >= 90) {
      strengths.push('Excellent command accuracy - you issued the right commands at the right time');
    } else if (metrics.scores.commandAccuracy < 70) {
      improvements.push('Review command procedures to improve accuracy');
    }
    
    // Analyze response time
    if (metrics.scores.responseTime >= 90) {
      strengths.push('Optimal response time - balanced speed with careful decision-making');
    } else if (metrics.scores.responseTime < 70) {
      const avgSeconds = metrics.timing.averageResponseTime / 1000;
      if (avgSeconds < 5) {
        improvements.push('Take more time to consider each decision carefully');
      } else {
        improvements.push('Try to respond more quickly to mission events');
      }
    }
    
    // Analyze resource management
    if (metrics.scores.resourceManagement >= 85) {
      strengths.push('Excellent resource management - maintained power and fuel efficiently');
    } else if (metrics.scores.resourceManagement < 70) {
      improvements.push('Focus on conserving power and fuel resources');
    }
    
    // Analyze error rate
    if (metrics.errors.count === 0) {
      strengths.push('Perfect execution - no errors during the mission');
    } else if (metrics.errors.severity.critical > 0) {
      improvements.push('Avoid critical errors by double-checking commands before execution');
    }
    
    // Analyze completion
    const completionRate = metrics.steps.completed / metrics.steps.total;
    if (completionRate === 1.0) {
      strengths.push('Mission fully completed - all objectives achieved');
    } else if (completionRate < 0.8) {
      improvements.push('Work on completing all mission objectives');
    }
    
    return {
      strengths,
      improvements,
      overallFeedback: this.generateOverallFeedback(metrics)
    };
  }

  /**
   * Generate overall feedback message
   * @param {object} metrics - Performance metrics
   * @returns {string} Feedback message
   */
  generateOverallFeedback(metrics) {
    const score = metrics.scores.overall;
    
    if (score >= 90) {
      return 'Outstanding performance! You demonstrated exceptional skills as a satellite operator. Your decision-making, resource management, and execution were all top-tier.';
    } else if (score >= 75) {
      return 'Good job! You showed solid competence in satellite operations. With some refinement in a few areas, you could achieve excellent performance.';
    } else if (score >= 60) {
      return 'Satisfactory work. You completed the mission but there are several areas where you can improve. Review the feedback and try the mission again to improve your score.';
    } else {
      return 'This mission was challenging, and there are important skills to develop. Take time to review the training materials and practice the fundamentals before attempting again.';
    }
  }

  /**
   * Generate shareable text for social media
   * @param {string} userName - User's name
   * @param {string} scenarioName - Scenario name
   * @param {object} metrics - Performance metrics
   * @returns {string} Shareable text
   */
  generateShareableText(userName, scenarioName, metrics) {
    const emoji = metrics.tier?.badge || '🚀';
    const score = Math.round(metrics.scores.overall);
    
    let text = `${emoji} ${userName} just completed "${scenarioName}" on GroundCTRL!\n\n`;
    text += `Score: ${score}/100 (${metrics.tier?.label || 'Complete'})\n`;
    text += `Commands: ${metrics.commands.total}\n`;
    text += `Achievements: ${metrics.achievements.length}\n`;
    
    if (metrics.achievements.length > 0) {
      const achievementIcons = metrics.achievements.map(a => a.badge).join(' ');
      text += `\nBadges earned: ${achievementIcons}`;
    }
    
    return text;
  }

  /**
   * Generate certificate ID
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID (ensures uniqueness per session)
   * @returns {string} Certificate ID
   */
  generateCertificateId(userId, sessionId) {
    // Generate a guaranteed unique certificate ID using:
    // 1. userId (first 8 chars) - identifies the user
    // 2. sessionId (first 12 chars) - each session is unique
    // 3. crypto.randomUUID() - cryptographically secure UUID v4
    //
    // This ensures no collisions even if:
    // - Same user completes multiple missions
    // - Multiple certificates generated in same millisecond
    // - System clock is adjusted
    const userPrefix = userId.substring(0, 8);
    const sessionPrefix = sessionId.substring(0, 12);
    const uniqueId = crypto.randomUUID();
    
    return `CERT-${userPrefix}-${sessionPrefix}-${uniqueId}`;
  }

  /**
   * Format duration in human-readable format
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get badge definition by ID
   * @param {string} badgeId - Badge ID
   * @returns {object|null} Badge definition
   */
  getBadgeDefinition(badgeId) {
    const badgeKey = badgeId.toUpperCase().replace(/-/g, '_');
    return this.BADGES[badgeKey] || null;
  }

  /**
   * Get all available badges
   * @returns {Array} Array of badge definitions
   */
  getAllBadges() {
    return Object.values(this.BADGES);
  }

  /**
   * Validate certificate
   * @param {string} certificateId - Certificate ID
   * @param {object} certificateData - Certificate data to validate
   * @returns {boolean} Whether certificate is valid
   */
  validateCertificate(certificateId, certificateData) {
    // Basic validation
    if (!certificateData || certificateData.id !== certificateId) {
      return false;
    }
    
    // Check required fields
    const requiredFields = ['userId', 'userName', 'type', 'mission', 'performance', 'completionDate'];
    for (const field of requiredFields) {
      if (!certificateData[field]) {
        return false;
      }
    }
    
    return true;
  }
}

module.exports = CertificateGenerator;
