"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Activity,
  Clock,
  Zap,
  TrendingUp,
  Server,
  Cpu,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export interface ExecutionMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  inProgressTasks: number;
  totalExecutionTime: number;
  averageTaskTime: number;
  successRate: number;
  resourceUtilization: number;
  concurrentTasks: number;
  maxConcurrency: number;
  queueLength: number;
  errorRate: number;
  throughput: number; // tasks per second
  estimatedCompletion?: Date;
}

export interface ResourceMetrics {
  id: string;
  name: string;
  utilization: number;
  tasksCompleted: number;
  averageResponseTime: number;
  errorCount: number;
  status: 'active' | 'idle' | 'error';
}

interface TaskExecutionMonitorProps {
  metrics: ExecutionMetrics;
  resources?: ResourceMetrics[];
  isRealTime?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function TaskExecutionMonitor({ 
  metrics, 
  resources = [],
  isRealTime = false,
  onRefresh,
  className = "" 
}: TaskExecutionMonitorProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (isRealTime) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
        onRefresh?.();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRealTime, onRefresh]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString();
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-red-600';
    if (utilization >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Execution Monitor</h2>
          {isRealTime && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              Live
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>Last updated: {formatTime(lastUpdate)}</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Progress</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round((metrics.completedTasks / metrics.totalTasks) * 100)}%
            </div>
            <div className="text-xs text-gray-500">
              {metrics.completedTasks}/{metrics.totalTasks} tasks
            </div>
            <Progress 
              value={(metrics.completedTasks / metrics.totalTasks) * 100} 
              className="h-1 mt-2" 
            />
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Success Rate</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round(metrics.successRate * 100)}%
            </div>
            <div className="text-xs text-gray-500">
              {metrics.failedTasks} failed
            </div>
          </CardContent>
        </Card>

        {/* Execution Time */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avg Time</span>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatDuration(metrics.averageTaskTime)}
            </div>
            <div className="text-xs text-gray-500">
              Total: {formatDuration(metrics.totalExecutionTime)}
            </div>
          </CardContent>
        </Card>

        {/* Concurrency */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Concurrency</span>
              <Cpu className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metrics.concurrentTasks}/{metrics.maxConcurrency}
            </div>
            <div className="text-xs text-gray-500">
              Queue: {metrics.queueLength}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
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
            {/* Resource Utilization */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Resource Utilization</span>
                <span className={`font-semibold ${getUtilizationColor(metrics.resourceUtilization)}`}>
                  {Math.round(metrics.resourceUtilization)}%
                </span>
              </div>
              <Progress value={metrics.resourceUtilization} className="h-2" />
            </div>

            {/* Throughput */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Throughput</span>
              <span className="text-sm text-gray-600">
                {metrics.throughput.toFixed(2)} tasks/sec
              </span>
            </div>

            {/* Error Rate */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Error Rate</span>
              <span className={`text-sm font-medium ${
                metrics.errorRate > 0.1 ? 'text-red-600' : 'text-green-600'
              }`}>
                {(metrics.errorRate * 100).toFixed(1)}%
              </span>
            </div>

            {/* Estimated Completion */}
            {metrics.estimatedCompletion && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Est. Completion</span>
                <span className="text-sm text-gray-600">
                  {formatTime(metrics.estimatedCompletion)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resource Status */}
        {resources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="w-5 h-5" />
                <span>Resource Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resources.map((resource) => (
                <div key={resource.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        {resource.name}
                      </span>
                      <Badge variant="outline" className={getStatusColor(resource.status)}>
                        {resource.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {resource.tasksCompleted} tasks
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Utilization</span>
                      <span className={getUtilizationColor(resource.utilization)}>
                        {Math.round(resource.utilization)}%
                      </span>
                    </div>
                    <Progress value={resource.utilization} className="h-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Avg Response</span>
                      <span className="text-gray-700">
                        {formatDuration(resource.averageResponseTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Errors</span>
                      <span className={resource.errorCount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {resource.errorCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Completed: {metrics.completedTasks}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">In Progress: {metrics.inProgressTasks}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Failed: {metrics.failedTasks}</span>
          </div>
        </div>
        
        {metrics.errorRate > 0.05 && (
          <div className="flex items-center space-x-1 text-yellow-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">High error rate detected</span>
          </div>
        )}
      </div>
    </div>
  );
}
