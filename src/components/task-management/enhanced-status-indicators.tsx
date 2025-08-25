"use client";

import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  Play,
  Pause,
  Activity,
  Loader2,
  Zap,
  TrendingUp,
  Timer,
  Target,
  BarChart3
} from "lucide-react";

export interface EnhancedStatusData {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  throughput?: number;
  errorCount?: number;
  retryCount?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  resourceUtilization?: number;
  dependencies?: string[];
  isRealTime?: boolean;
}

interface EnhancedStatusIndicatorsProps {
  data: EnhancedStatusData;
  showDetailedMetrics?: boolean;
  enableAnimations?: boolean;
  className?: string;
}

export function EnhancedStatusIndicators({ 
  data, 
  showDetailedMetrics = true,
  enableAnimations = true,
  className = "" 
}: EnhancedStatusIndicatorsProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [pulseActive, setPulseActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Animate progress changes
  useEffect(() => {
    if (enableAnimations) {
      const duration = 500; // Animation duration in ms
      const steps = 20;
      const stepValue = (data.progress - animatedProgress) / steps;
      const stepDuration = duration / steps;

      const interval = setInterval(() => {
        setAnimatedProgress(prev => {
          const next = prev + stepValue;
          if (Math.abs(next - data.progress) < 0.1) {
            clearInterval(interval);
            return data.progress;
          }
          return next;
        });
      }, stepDuration);

      return () => clearInterval(interval);
    } else {
      setAnimatedProgress(data.progress);
    }
  }, [data.progress, enableAnimations]);

  // Real-time pulse effect for active tasks
  useEffect(() => {
    if (data.status === 'running' && data.isRealTime) {
      setPulseActive(true);
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setPulseActive(false);
    }
  }, [data.status, data.isRealTime]);

  const getStatusConfig = () => {
    switch (data.status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          badgeStyle: 'bg-yellow-100 text-yellow-800',
          progressColor: 'bg-yellow-500'
        };
      case 'running':
        return {
          icon: pulseActive ? Activity : Play,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badgeStyle: 'bg-blue-100 text-blue-800',
          progressColor: 'bg-blue-500'
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          badgeStyle: 'bg-green-100 text-green-800',
          progressColor: 'bg-green-500'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeStyle: 'bg-red-100 text-red-800',
          progressColor: 'bg-red-500'
        };
      case 'paused':
        return {
          icon: Pause,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeStyle: 'bg-gray-100 text-gray-800',
          progressColor: 'bg-gray-500'
        };
    }
  };

  const getPriorityConfig = () => {
    switch (data.priority) {
      case 'critical':
        return { style: 'bg-red-100 text-red-800 border-red-300', label: 'Critical' };
      case 'high':
        return { style: 'bg-orange-100 text-orange-800 border-orange-300', label: 'High' };
      case 'medium':
        return { style: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Medium' };
      case 'low':
        return { style: 'bg-green-100 text-green-800 border-green-300', label: 'Low' };
      default:
        return { style: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Normal' };
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const calculateETA = () => {
    if (!data.startTime || data.progress === 0) return null;
    
    const elapsed = Date.now() - data.startTime.getTime();
    const rate = data.progress / elapsed;
    const remaining = (100 - data.progress) / rate;
    
    return new Date(Date.now() + remaining);
  };

  const config = getStatusConfig();
  const priorityConfig = getPriorityConfig();
  const IconComponent = config.icon;
  const eta = calculateETA();

  return (
    <div className={`space-y-3 ${className} overflow-hidden`}>
      {/* Main Status Indicator */}
      <div className={`
        flex items-center space-x-3 p-3 rounded-lg border
        ${config.bgColor} ${config.borderColor}
        ${pulseActive ? 'animate-pulse' : ''}
        transition-all duration-300 min-w-0
      `}>
        <IconComponent 
          className={`
            w-5 h-5 flex-shrink-0 ${config.color}
            ${data.status === 'running' && pulseActive ? 'animate-spin' : ''}
          `} 
        />
        
        <div className="flex-1 space-y-2 min-w-0 overflow-hidden">
          {/* Status and Progress */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`${config.badgeStyle} truncate`}>
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </Badge>
            <span className="text-sm font-medium text-gray-700 flex-shrink-0">
              {Math.round(animatedProgress)}%
            </span>
          </div>
          
          {/* Animated Progress Bar */}
          <div className="relative">
            <Progress 
              value={animatedProgress} 
              className={`
                h-2 transition-all duration-300
                ${data.status === 'running' ? 'animate-pulse' : ''}
              `}
            />
            {data.status === 'running' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            )}
          </div>
        </div>

        {/* Priority Indicator */}
        {data.priority && (
          <Badge variant="outline" className={`text-xs flex-shrink-0 ${priorityConfig.style}`}>
            {priorityConfig.label}
          </Badge>
        )}
      </div>

      {/* Detailed Metrics */}
      {showDetailedMetrics && (
        <div className="grid grid-cols-2 gap-2 overflow-hidden">
          {/* Timing Metrics */}
          <Card className="p-2 min-w-0">
            <div className="flex items-center space-x-2">
              <Timer className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-xs font-medium text-gray-700 truncate">
                  Duration
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {formatDuration(data.actualDuration || 
                    (data.startTime ? Date.now() - data.startTime.getTime() : 0)
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* ETA */}
          {eta && data.status === 'running' && (
            <Card className="p-2 min-w-0">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-xs font-medium text-gray-700 truncate">
                    ETA
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Throughput */}
          {data.throughput !== undefined && (
            <Card className="p-2 min-w-0">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-xs font-medium text-gray-700 truncate">
                    Throughput
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {data.throughput.toFixed(1)}/sec
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Resource Utilization */}
          {data.resourceUtilization !== undefined && (
            <Card className="p-2 min-w-0">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-xs font-medium text-gray-700 truncate">
                    Resources
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {Math.round(data.resourceUtilization)}%
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Error/Retry Count */}
          {((data.errorCount ?? 0) > 0 || (data.retryCount ?? 0) > 0) && (
            <Card className="p-2 border-orange-200 bg-orange-50 min-w-0">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-xs font-medium text-orange-700 truncate">
                    Issues
                  </div>
                  <div className="text-xs text-orange-600 truncate">
                    {data.errorCount || 0}E / {data.retryCount || 0}R
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Real-time indicator */}
      {data.isRealTime && data.status === 'running' && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
          <span className="truncate">Live updates • Last: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}

// Utility component for batch status overview
export function BatchStatusOverview({ 
  statuses, 
  className = "" 
}: { 
  statuses: EnhancedStatusData[]; 
  className?: string; 
}) {
  const totals = statuses.reduce((acc, status) => {
    acc[status.status] = (acc[status.status] || 0) + 1;
    acc.totalProgress += status.progress;
    return acc;
  }, {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    paused: 0,
    totalProgress: 0
  });

  const overallProgress = totals.totalProgress / statuses.length;
  const isActive = totals.running > 0;

  return (
    <Card className={`${className} ${isActive ? 'border-blue-200 bg-blue-50' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-gray-900">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress 
            value={overallProgress} 
            className={`h-2 ${isActive ? 'animate-pulse' : ''}`}
          />
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-5 gap-1 text-xs">
          <div className="text-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
            <div className="font-medium">{totals.pending}</div>
            <div className="text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className={`w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1 ${isActive ? 'animate-pulse' : ''}`}></div>
            <div className="font-medium">{totals.running}</div>
            <div className="text-gray-600">Running</div>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
            <div className="font-medium">{totals.completed}</div>
            <div className="text-gray-600">Done</div>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
            <div className="font-medium">{totals.failed}</div>
            <div className="text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full mx-auto mb-1"></div>
            <div className="font-medium">{totals.paused}</div>
            <div className="text-gray-600">Paused</div>
          </div>
        </div>

        {/* Live indicator for active tasks */}
        {isActive && (
          <div className="flex items-center justify-center space-x-1 text-xs text-blue-600 pt-1">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Live execution in progress</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
