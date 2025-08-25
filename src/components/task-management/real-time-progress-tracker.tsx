"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  EnhancedStatusIndicators, 
  BatchStatusOverview,
  type EnhancedStatusData 
} from './enhanced-status-indicators';
import { 
  Activity,
  Clock,
  Zap,
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  BarChart3
} from "lucide-react";

export interface ProgressTrackingData {
  mainTask: {
    id: string;
    title: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    startTime?: Date;
    estimatedDuration?: number;
  };
  subtasks: EnhancedStatusData[];
  executionMetrics: {
    totalDuration: number;
    averageTaskTime: number;
    successRate: number;
    throughput: number;
    concurrentTasks: number;
    completedTasks: number;
    failedTasks: number;
    queueLength: number;
  };
  isRealTime?: boolean;
  lastUpdate?: Date;
}

interface RealTimeProgressTrackerProps {
  data: ProgressTrackingData;
  enableWebSocket?: boolean;
  updateInterval?: number;
  showDetailedView?: boolean;
  onTaskClick?: (taskId: string) => void;
  onRefresh?: () => void;
  className?: string;
}

export function RealTimeProgressTracker({
  data,
  enableWebSocket = false,
  updateInterval = 1000,
  showDetailedView = true,
  onTaskClick,
  onRefresh,
  className = ""
}: RealTimeProgressTrackerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [animatedMetrics, setAnimatedMetrics] = useState(data.executionMetrics);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  // Simulate real-time updates (in production, this would be WebSocket)
  useEffect(() => {
    if (data.isRealTime && !enableWebSocket) {
      const interval = setInterval(() => {
        setLastUpdateTime(new Date());
        onRefresh?.();
      }, updateInterval);
      
      setIsConnected(true);
      return () => {
        clearInterval(interval);
        setIsConnected(false);
      };
    }
  }, [data.isRealTime, enableWebSocket, updateInterval, onRefresh]);

  // Animate metrics changes
  useEffect(() => {
    const animationDuration = 500;
    const steps = 10;
    let currentStep = 0;
    
    const initialMetrics = animatedMetrics;
    const targetMetrics = data.executionMetrics;
    
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedMetrics({
        totalDuration: initialMetrics.totalDuration + 
          (targetMetrics.totalDuration - initialMetrics.totalDuration) * progress,
        averageTaskTime: initialMetrics.averageTaskTime + 
          (targetMetrics.averageTaskTime - initialMetrics.averageTaskTime) * progress,
        successRate: initialMetrics.successRate + 
          (targetMetrics.successRate - initialMetrics.successRate) * progress,
        throughput: initialMetrics.throughput + 
          (targetMetrics.throughput - initialMetrics.throughput) * progress,
        concurrentTasks: Math.round(initialMetrics.concurrentTasks + 
          (targetMetrics.concurrentTasks - initialMetrics.concurrentTasks) * progress),
        completedTasks: Math.round(initialMetrics.completedTasks + 
          (targetMetrics.completedTasks - initialMetrics.completedTasks) * progress),
        failedTasks: Math.round(initialMetrics.failedTasks + 
          (targetMetrics.failedTasks - initialMetrics.failedTasks) * progress),
        queueLength: Math.round(initialMetrics.queueLength + 
          (targetMetrics.queueLength - initialMetrics.queueLength) * progress)
      });
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedMetrics(targetMetrics);
      }
    }, animationDuration / steps);
    
    return () => clearInterval(interval);
  }, [data.executionMetrics]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getMainTaskStatus = () => {
    const { mainTask } = data;
    switch (mainTask.status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'running':
        return { icon: Play, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
      case 'failed':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' };
    }
  };

  const mainTaskConfig = getMainTaskStatus();
  const MainTaskIcon = mainTaskConfig.icon;
  const isActive = data.mainTask.status === 'running';
  const totalSubtasks = data.subtasks.length;
  const completedSubtasks = data.subtasks.filter(s => s.status === 'completed').length;
  const runningSubtasks = data.subtasks.filter(s => s.status === 'running').length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className={`w-6 h-6 text-blue-600 ${isActive ? 'animate-pulse' : ''}`} />
          <h2 className="text-xl font-semibold text-gray-900">Progress Tracker</h2>
          {data.isRealTime && (
            <Badge 
              variant="outline" 
              className={`${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
            >
              <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            Last update: {lastUpdateTime.toLocaleTimeString()}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Main Task Progress */}
      <Card className={`${mainTaskConfig.bg} border-l-4 ${mainTaskConfig.color.replace('text-', 'border-')}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MainTaskIcon className={`w-6 h-6 ${mainTaskConfig.color} ${isActive ? 'animate-pulse' : ''}`} />
              <div>
                <CardTitle className="text-lg text-gray-900">{data.mainTask.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {completedSubtasks}/{totalSubtasks} subtasks completed
                </p>
              </div>
            </div>
            <Badge variant="outline" className={mainTaskConfig.color.replace('text-', 'bg-').replace('-600', '-100 text-') + mainTaskConfig.color.replace('text-', '-800')}>
              {data.mainTask.status.charAt(0).toUpperCase() + data.mainTask.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Overall Progress</span>
              <span className="font-bold text-gray-900">{Math.round(data.mainTask.progress)}%</span>
            </div>
            <Progress 
              value={data.mainTask.progress} 
              className={`h-3 ${isActive ? 'animate-pulse' : ''}`}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 pt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{runningSubtasks}</div>
              <div className="text-xs text-gray-600">Running</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{completedSubtasks}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{animatedMetrics.concurrentTasks}</div>
              <div className="text-xs text-gray-600">Concurrent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{Math.round(animatedMetrics.successRate * 100)}%</div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Status Overview */}
      <BatchStatusOverview statuses={data.subtasks} />

      {/* Detailed Metrics */}
      {showDetailedView && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Performance Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Avg Time</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatDuration(animatedMetrics.averageTaskTime)}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Throughput</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {animatedMetrics.throughput.toFixed(1)}/sec
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Queue</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {animatedMetrics.queueLength}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Total Time</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatDuration(animatedMetrics.totalDuration)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subtask Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Subtask Status</span>
                </div>
                <button
                  onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showAdvancedMetrics ? 'Hide' : 'Show'} Details
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {data.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="cursor-pointer"
                  onClick={() => onTaskClick?.(subtask.id)}
                >
                  <EnhancedStatusIndicators
                    data={subtask}
                    showDetailedMetrics={showAdvancedMetrics}
                    enableAnimations={true}
                    className="border rounded-lg p-2 hover:bg-gray-50 transition-colors"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
