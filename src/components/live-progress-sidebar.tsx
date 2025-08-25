"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  RealTimeProgressTracker,
  EnhancedStatusIndicators,
  type ProgressTrackingData,
  type EnhancedStatusData 
} from './task-management';
import { 
  X,
  Minimize2,
  Maximize2,
  Activity,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
  Code2,
  Eye
} from "lucide-react";

export interface LiveProgressData {
  isActive: boolean;
  requestId: string;
  mainTask: {
    id: string;
    title: string;
    description: string;
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
  lastUpdate: Date;
}

interface LiveProgressSidebarProps {
  progressData: LiveProgressData | null;
  isVisible: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMinimized: boolean;
  className?: string;
}

export function LiveProgressSidebar({
  progressData,
  isVisible,
  onClose,
  onMinimize,
  onMaximize,
  isMinimized,
  className = ""
}: LiveProgressSidebarProps) {
  const [localProgressData, setLocalProgressData] = useState<LiveProgressData | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Load saved width from localStorage, default to 384px
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('progress-sidebar-width');
      return saved ? parseInt(saved, 10) : 384;
    }
    return 384;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(sidebarWidth);

  // Update local data when new progress data arrives
  useEffect(() => {
    if (progressData) {
      setLocalProgressData(progressData);
    }
  }, [progressData]);

  // Save sidebar width to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('progress-sidebar-width', sidebarWidth.toString());
    }
  }, [sidebarWidth]);

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(sidebarWidth);
  }, [sidebarWidth]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = startX - e.clientX; // Subtract because we're dragging from the right
    const newWidth = Math.max(280, Math.min(600, startWidth + deltaX)); // Min 280px, Max 600px
    setSidebarWidth(newWidth);
  }, [isResizing, startX, startWidth]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global mouse events when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Animate main progress
  useEffect(() => {
    if (localProgressData) {
      const targetProgress = localProgressData.mainTask.progress;
      const duration = 500;
      const steps = 20;
      const stepValue = (targetProgress - animatedProgress) / steps;
      const stepDuration = duration / steps;

      const interval = setInterval(() => {
        setAnimatedProgress(prev => {
          const next = prev + stepValue;
          if (Math.abs(next - targetProgress) < 0.1) {
            clearInterval(interval);
            return targetProgress;
          }
          return next;
        });
      }, stepDuration);

      return () => clearInterval(interval);
    }
  }, [localProgressData?.mainTask.progress]);

  // Don't render if not visible or no data
  if (!isVisible || !localProgressData) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'running': return Activity;
      case 'completed': return CheckCircle;
      case 'failed': return AlertTriangle;
      default: return Clock;
    }
  };

  const StatusIcon = getStatusIcon(localProgressData.mainTask.status);
  const isActive = localProgressData.mainTask.status === 'running';
  const completedTasks = localProgressData.subtasks.filter(s => s.status === 'completed').length;
  const totalTasks = localProgressData.subtasks.length;

  return (
    <div 
      className={`
        ${className}
        bg-white border-l border-gray-200 flex flex-col
        ${isActive ? 'border-blue-300 shadow-lg' : ''}
        overflow-hidden flex-shrink-0 relative
        ${!isResizing ? 'transition-all duration-300' : ''}
      `}
      style={{
        width: isMinimized ? '64px' : `${sidebarWidth}px`,
        minWidth: isMinimized ? '64px' : `${sidebarWidth}px`,
        maxWidth: isMinimized ? '64px' : `${sidebarWidth}px`
      }}
    >
      {/* Header */}
      <div className={`
        px-4 py-3 border-b border-gray-200 flex items-center justify-between
        ${getStatusColor(localProgressData.mainTask.status)}
      `}>
        {!isMinimized && (
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <StatusIcon className={`
              w-5 h-5 flex-shrink-0 ${isActive ? 'animate-pulse' : ''}
            `} />
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="font-semibold text-sm truncate leading-tight">
                {localProgressData.mainTask.status === 'completed' ? 'Task Completed' : 
                 localProgressData.mainTask.status === 'failed' ? 'Task Failed' : 
                 'Live Progress'}
              </h3>
              <p className="text-xs opacity-75 truncate leading-tight">
                {localProgressData.mainTask.title}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          {!isMinimized ? (
            <>
              <button
                onClick={onMinimize}
                className="p-1.5 hover:bg-black/10 rounded transition-colors flex-shrink-0"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                  localProgressData.mainTask.status === 'completed' || localProgressData.mainTask.status === 'failed'
                    ? 'hover:bg-red-100 text-red-600 hover:text-red-800' 
                    : 'hover:bg-black/10'
                }`}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onMaximize}
              className="p-1.5 hover:bg-black/10 rounded transition-colors flex-shrink-0"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      {!isMinimized && (
        <div
          className={`
            absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize
            hover:bg-blue-400/30 transition-colors duration-200
            ${isResizing ? 'bg-blue-500/50' : 'bg-transparent'}
            z-10 group
          `}
          onMouseDown={handleMouseDown}
          title="Drag to resize sidebar"
        >
          {/* Visible resize indicator */}
          <div className={`
            absolute left-0 top-1/2 transform -translate-y-1/2 
            w-1 h-12 bg-gray-300 rounded-r
            group-hover:bg-blue-400 transition-colors duration-200
            ${isResizing ? 'bg-blue-500' : ''}
          `} />
          
          {/* Resize dots indicator */}
          <div className={`
            absolute left-0.5 top-1/2 transform -translate-y-1/2
            flex flex-col space-y-0.5 opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            ${isResizing ? 'opacity-100' : ''}
          `}>
            <div className="w-0.5 h-0.5 bg-white rounded-full" />
            <div className="w-0.5 h-0.5 bg-white rounded-full" />
            <div className="w-0.5 h-0.5 bg-white rounded-full" />
            <div className="w-0.5 h-0.5 bg-white rounded-full" />
            <div className="w-0.5 h-0.5 bg-white rounded-full" />
          </div>
          
          {/* Width indicator during resize */}
          {isResizing && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono">
              {sidebarWidth}px
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Quick Status */}
          <div className="p-3 space-y-3">
            {/* Main Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Overall Progress</span>
                <span className="font-bold text-gray-900">
                  {Math.round(animatedProgress)}%
                </span>
              </div>
              <Progress 
                value={animatedProgress} 
                className={`h-3 ${isActive ? 'animate-pulse' : ''}`}
              />
              <div className="text-xs text-gray-600">
                {completedTasks}/{totalTasks} subtasks completed
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded min-w-0">
                <div className="font-medium text-gray-700 truncate">Running</div>
                <div className="text-blue-600 font-bold truncate">
                  {localProgressData.subtasks.filter(s => s.status === 'running').length}
                </div>
              </div>
              <div className="bg-gray-50 p-2 rounded min-w-0">
                <div className="font-medium text-gray-700 truncate">Completed</div>
                <div className="text-green-600 font-bold truncate">{completedTasks}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded min-w-0">
                <div className="font-medium text-gray-700 truncate">Success Rate</div>
                <div className="text-blue-600 font-bold truncate">
                  {Math.round(localProgressData.executionMetrics.successRate * 100)}%
                </div>
              </div>
              <div className="bg-gray-50 p-2 rounded min-w-0">
                <div className="font-medium text-gray-700 truncate">Throughput</div>
                <div className="text-purple-600 font-bold truncate">
                  {localProgressData.executionMetrics.throughput.toFixed(1)}/s
                </div>
              </div>
            </div>

            {/* Status Message */}
            <div className="border-t pt-2">
              {localProgressData.mainTask.status === 'completed' ? (
                <div className="flex items-start space-x-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">Task completed successfully!</div>
                    <div className="text-green-600 break-words">Check the chat for your generated code</div>
                  </div>
                </div>
              ) : localProgressData.mainTask.status === 'failed' ? (
                <div className="flex items-start space-x-2 text-xs text-red-700 bg-red-50 p-2 rounded">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">Task failed</div>
                    <div className="text-red-600 break-words">Please try again or check the error</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="truncate">Last update: {localProgressData.lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subtask List */}
          <div className="border-t border-gray-200 p-3 space-y-3">
            <h4 className="font-medium text-sm text-gray-700 flex items-center space-x-2">
              <Code2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Subtasks</span>
            </h4>
            
            <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden custom-scrollbar">
              {localProgressData.subtasks.map((subtask) => (
                <EnhancedStatusIndicators
                  key={subtask.id}
                  data={subtask}
                  showDetailedMetrics={false}
                  enableAnimations={true}
                  className="text-xs"
                />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex space-x-2">
              <button
                className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1 min-w-0"
                onClick={() => {
                  // Open detailed view
                  console.log('Open detailed view');
                }}
              >
                <Eye className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Details</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-2 p-2">
          <StatusIcon className={`
            w-6 h-6 ${getStatusColor(localProgressData.mainTask.status).split(' ')[0]}
            ${isActive ? 'animate-pulse' : ''}
          `} />
          <div className="text-xs font-bold text-center">
            {Math.round(animatedProgress)}%
          </div>
          <div className="text-xs text-gray-500 text-center">
            {completedTasks}/{totalTasks}
          </div>
          {isActive && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </div>
      )}
    </div>
  );
}
