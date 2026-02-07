/**
 * TutorialMenu - Tutorial selection and management UI
 * 
 * Features:
 * - List all available tutorials
 * - Show completion status
 * - Start/restart tutorials
 * - Tutorial settings
 * - Progress statistics
 * 
 * @component
 */

import React, { useState } from 'react';
import { useTutorial } from '../../contexts/TutorialContext';
import { 
  Book, 
  CheckCircle, 
  Circle, 
  Play, 
  RotateCcw, 
  Settings, 
  X,
  Award,
  TrendingUp
} from 'lucide-react';

export default function TutorialMenu({ isOpen, onClose }) {
  const { state, actions, config } = useTutorial();
  const [activeTab, setActiveTab] = useState('all');

  if (!isOpen) return null;

  // Get all tutorials
  const allTutorials = [
    config.globalIntro,
    ...Object.values(config.scenarios)
  ];

  // Calculate statistics
  const stats = {
    total: allTutorials.length,
    completed: state.completedFlows.length,
    dismissed: state.dismissedFlows.length,
    available: allTutorials.length - state.completedFlows.length - state.dismissedFlows.length
  };

  const completionPercentage = Math.round((stats.completed / stats.total) * 100);

  // Filter tutorials based on active tab
  const filteredTutorials = allTutorials.filter(tutorial => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return state.completedFlows.includes(tutorial.id);
    if (activeTab === 'available') return !state.completedFlows.includes(tutorial.id) && !state.dismissedFlows.includes(tutorial.id);
    return true;
  });

  const handleStartTutorial = (tutorialId) => {
    actions.startFlow(tutorialId);
    onClose();
  };

  const handleRestartTutorial = (tutorialId) => {
    // Remove from completed/dismissed
    const newCompleted = state.completedFlows.filter(id => id !== tutorialId);
    const newDismissed = state.dismissedFlows.filter(id => id !== tutorialId);
    
    // Start fresh
    actions.startFlow(tutorialId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Book className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Training Tutorials
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Learn GroundCTRL features step-by-step
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.completed}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Completed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.available}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Available
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {completionPercentage}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Progress
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Tutorials
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'available'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Available ({stats.available})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Completed ({stats.completed})
          </button>
        </div>

        {/* Tutorial List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {filteredTutorials.map((tutorial) => {
              const isCompleted = state.completedFlows.includes(tutorial.id);
              const isDismissed = state.dismissedFlows.includes(tutorial.id);
              const isActive = state.activeFlowId === tutorial.id;

              return (
                <div
                  key={tutorial.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="shrink-0 mt-1">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {tutorial.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {tutorial.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                            <span>{tutorial.steps.length} steps</span>
                            {isCompleted && (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <Award className="w-3 h-3" />
                                Completed
                              </span>
                            )}
                            {isActive && (
                              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <TrendingUp className="w-3 h-3" />
                                In Progress
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {isCompleted ? (
                            <button
                              onClick={() => handleRestartTutorial(tutorial.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              title="Restart tutorial"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Replay
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartTutorial(tutorial.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                              title="Start tutorial"
                            >
                              <Play className="w-4 h-4" />
                              {isActive ? 'Continue' : 'Start'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTutorials.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Book className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                No tutorials found in this category
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Settings className="w-4 h-4" />
            <button
              onClick={() => actions.setEnabled(!state.enabled)}
              className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              {state.enabled ? 'Disable' : 'Enable'} tutorials
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all tutorial progress?')) {
                  actions.resetProgress();
                }
              }}
              className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              Reset Progress
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tutorial Menu Button - Floating action button to open menu
 */
export function TutorialMenuButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        title="Open tutorial menu"
      >
        <Book className="w-6 h-6" />
      </button>

      <TutorialMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
