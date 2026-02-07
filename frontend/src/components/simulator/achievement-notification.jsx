/**
 * Achievement Notification Component
 * Toast-style notifications for achievements earned during missions
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, Star, Zap } from 'lucide-react';

const ACHIEVEMENT_DETAILS = {
  perfect_burn: {
    name: 'Perfect Burn',
    description: 'Execute a burn with <1% delta-V error',
    icon: Zap,
    color: 'from-yellow-400 to-orange-500'
  },
  fuel_efficient: {
    name: 'Fuel Efficient',
    description: 'Complete mission using <80% of fuel budget',
    icon: Star,
    color: 'from-green-400 to-emerald-500'
  },
  no_alerts: {
    name: 'Flawless Execution',
    description: 'Complete mission with zero critical alerts',
    icon: Sparkles,
    color: 'from-blue-400 to-cyan-500'
  },
  speed_run: {
    name: 'Speed Run',
    description: 'Complete mission in <80% of estimated time',
    icon: Zap,
    color: 'from-purple-400 to-pink-500'
  },
  perfect_score: {
    name: 'Perfect Mission',
    description: 'Achieve 100% score',
    icon: Trophy,
    color: 'from-yellow-300 to-yellow-600'
  },
  hohmann_master: {
    name: 'Hohmann Master',
    description: 'Execute perfect two-burn Hohmann transfer',
    icon: Star,
    color: 'from-indigo-400 to-purple-500'
  }
};

export function AchievementNotification({ achievementId, onClose }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const achievement = ACHIEVEMENT_DETAILS[achievementId] || {
    name: achievementId.replace(/_/g, ' '),
    description: 'Achievement unlocked!',
    icon: Trophy,
    color: 'from-gray-400 to-gray-600'
  };

  const Icon = achievement.icon;

  useEffect(() => {
    // Slide in
    setTimeout(() => setVisible(true), 100);

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-20 right-4 z-50 transition-all duration-500 ${
        visible && !exiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className="relative bg-card border-2 border-yellow-500 rounded-lg shadow-2xl overflow-hidden">
        {/* Gradient Background */}
        <div
          className={`absolute inset-0 bg-linear-to-br ${achievement.color} opacity-10`}
        />

        {/* Content */}
        <div className="relative p-4 flex items-start gap-3 min-w-[320px] max-w-100">
          {/* Icon */}
          <div className={`p-3 rounded-full bg-linear-to-br ${achievement.color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">
                Achievement Unlocked
              </span>
            </div>
            <h3 className="font-bold text-foreground mb-1">{achievement.name}</h3>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              setExiting(true);
              setTimeout(() => {
                if (onClose) onClose();
              }, 500);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ×
          </button>
        </div>

        {/* Sparkle Animation */}
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-2 right-2 w-4 h-4 text-yellow-400 animate-pulse" />
          <Sparkles className="absolute bottom-2 left-2 w-3 h-3 text-yellow-300 animate-pulse delay-150" />
          <Sparkles className="absolute top-1/2 right-4 w-3 h-3 text-yellow-500 animate-pulse delay-300" />
        </div>
      </div>
    </div>
  );
}

/**
 * Achievement Manager Component
 * Manages queue of achievement notifications
 */
export function AchievementManager({ achievements = [] }) {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    // Add new achievements to queue
    const newAchievements = achievements.filter(
      (a) => !queue.includes(a) && a !== current
    );
    
    if (newAchievements.length > 0) {
      setQueue((prev) => [...prev, ...newAchievements]);
    }
  }, [achievements, queue, current]);

  useEffect(() => {
    // Show next achievement if none is currently showing
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [current, queue]);

  const handleClose = () => {
    setCurrent(null);
  };

  if (!current) {
    return null;
  }

  return <AchievementNotification achievementId={current} onClose={handleClose} />;
}
