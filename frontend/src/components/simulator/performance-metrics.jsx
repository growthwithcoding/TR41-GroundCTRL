/**
 * Performance Metrics Component
 * 
 * Mission Control Enhancement - Phase 6
 * 
 * Displays live performance dashboard:
 * - Overall score with animated progress ring
 * - 5 metric breakdown bars
 * - Current tier badge
 * - Achievements earned
 */

import { useState, useEffect } from 'react';
import { TrendingUp, Star, Target, Clock, Zap } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function PerformanceMetrics({ sessionId, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch performance metrics from backend
  const fetchMetrics = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/performance`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch metrics when opened
  useEffect(() => {
    if (isOpen && sessionId) {
      fetchMetrics();
    }
  }, [isOpen, sessionId]);
  
  // Get tier color
  const getTierColor = (tierName) => {
    switch (tierName?.toUpperCase()) {
      case 'EXCELLENT':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'GOOD':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'SATISFACTORY':
        return 'text-green-500 bg-green-500/10 border-green-500/30';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };
  
  // Get tier badge
  const getTierBadge = (tierName) => {
    switch (tierName?.toUpperCase()) {
      case 'EXCELLENT':
        return '⭐';
      case 'GOOD':
        return '✨';
      case 'SATISFACTORY':
        return '👍';
      default:
        return '📊';
    }
  };
  
  if (!isOpen) {
    // Collapsed button
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`${className}`}
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        Performance
      </Button>
    );
  }
  
  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Performance Metrics</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>
        <CardDescription>Live mission performance tracking</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading metrics...
          </div>
        ) : metrics ? (
          <>
            {/* Overall Score */}
            <div className="text-center space-y-2">
              <div className="relative inline-flex">
                <div className="text-4xl font-bold text-primary">
                  {Math.round(metrics.scores?.overall || 0)}
                </div>
                <span className="text-lg text-muted-foreground ml-1">/100</span>
              </div>
              
              <Badge 
                variant="outline" 
                className={`${getTierColor(metrics.tier?.name)}`}
              >
                {getTierBadge(metrics.tier?.name)} {metrics.tier?.label || 'In Progress'}
              </Badge>
            </div>
            
            {/* Score Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                Score Breakdown
              </h4>
              
              <MetricBar
                label="Command Accuracy"
                value={metrics.scores?.commandAccuracy || 0}
                icon={<Target className="w-3 h-3" />}
                weight={30}
              />
              
              <MetricBar
                label="Response Time"
                value={metrics.scores?.responseTime || 0}
                icon={<Clock className="w-3 h-3" />}
                weight={20}
              />
              
              <MetricBar
                label="Resource Management"
                value={metrics.scores?.resourceManagement || 0}
                icon={<Zap className="w-3 h-3" />}
                weight={25}
              />
              
              <MetricBar
                label="Completion Time"
                value={metrics.scores?.completionTime || 0}
                icon={<Clock className="w-3 h-3" />}
                weight={15}
              />
              
              <MetricBar
                label="Error Avoidance"
                value={metrics.scores?.errorAvoidance || 0}
                icon={<Star className="w-3 h-3" />}
                weight={10}
              />
            </div>
            
            {/* Achievements */}
            {metrics.achievements && metrics.achievements.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                    Achievements
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {metrics.achievements.length}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {metrics.achievements.map((achievement, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs"
                      title={achievement.description}
                    >
                      {achievement.badge} {achievement.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Commands</div>
                <div className="text-sm font-semibold">{metrics.commands?.total || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Accuracy</div>
                <div className="text-sm font-semibold">
                  {metrics.commands?.total > 0 
                    ? Math.round((metrics.commands?.correct / metrics.commands?.total) * 100)
                    : 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Errors</div>
                <div className="text-sm font-semibold">{metrics.errors?.count || 0}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No metrics available yet.
            <br />
            <span className="text-xs">Complete some steps to see your score.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBar({ label, value, icon, weight }) {
  const getColor = (val) => {
    if (val >= 90) return 'bg-green-500';
    if (val >= 75) return 'bg-blue-500';
    if (val >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span>{label}</span>
          <span className="text-[10px]">({weight}%)</span>
        </div>
        <span className="font-mono font-semibold text-foreground">
          {Math.round(value)}/100
        </span>
      </div>
      <Progress value={value} className="h-1.5" indicatorClassName={getColor(value)} />
    </div>
  );
}
