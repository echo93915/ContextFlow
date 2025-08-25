"use client";

import { useState, useCallback, useRef } from 'react';
import type { LiveProgressData } from '../components/live-progress-sidebar';
import type { EnhancedStatusData } from '../components/task-management';

export interface ProgressUpdate {
  requestId: string;
  type: 'start' | 'progress' | 'complete' | 'error';
  mainTask?: {
    title: string;
    description: string;
    progress: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
  };
  subtasks?: Partial<EnhancedStatusData>[];
  executionMetrics?: {
    totalDuration: number;
    averageTaskTime: number;
    successRate: number;
    throughput: number;
    concurrentTasks: number;
    completedTasks: number;
    failedTasks: number;
    queueLength: number;
  };
}

export function useLiveProgress() {
  const [progressData, setProgressData] = useState<LiveProgressData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const currentRequestId = useRef<string | null>(null);

  // Start tracking a new code generation request
  const startProgress = useCallback((requestId: string, title: string, description: string) => {
    const newProgressData: LiveProgressData = {
      isActive: true,
      requestId,
      mainTask: {
        id: requestId,
        title,
        description,
        status: 'pending',
        progress: 0,
        startTime: new Date()
      },
      subtasks: [],
      executionMetrics: {
        totalDuration: 0,
        averageTaskTime: 0,
        successRate: 1,
        throughput: 0,
        concurrentTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        queueLength: 0
      },
      lastUpdate: new Date()
    };

    setProgressData(newProgressData);
    setIsVisible(true);
    setIsMinimized(false);
    currentRequestId.current = requestId;
  }, []);

  // Update progress data
  const updateProgress = useCallback((update: ProgressUpdate) => {
    // Only update if this is for the current request
    if (update.requestId !== currentRequestId.current) {
      return;
    }

    setProgressData(prev => {
      if (!prev || prev.requestId !== update.requestId) {
        return prev;
      }

      const updated: LiveProgressData = {
        ...prev,
        lastUpdate: new Date()
      };

      // Update main task
      if (update.mainTask) {
        updated.mainTask = {
          ...prev.mainTask,
          ...update.mainTask
        };
      }

      // Update subtasks
      if (update.subtasks) {
        updated.subtasks = update.subtasks.map((subtaskUpdate, index) => {
          const existingSubtask = prev.subtasks[index] || {
            id: `subtask-${index}`,
            status: 'pending' as const,
            progress: 0,
            isRealTime: true
          };

          return {
            ...existingSubtask,
            ...subtaskUpdate
          } as EnhancedStatusData;
        });
      }

      // Update execution metrics
      if (update.executionMetrics) {
        updated.executionMetrics = {
          ...prev.executionMetrics,
          ...update.executionMetrics
        };
      }

      // Update active status
      if (update.type === 'complete' || update.type === 'error') {
        updated.isActive = false;
        updated.mainTask.status = update.type === 'complete' ? 'completed' : 'failed';
        updated.mainTask.progress = update.type === 'complete' ? 100 : updated.mainTask.progress;
      }

      return updated;
    });
  }, []);

  // Complete the progress tracking
  const completeProgress = useCallback((requestId: string, success: boolean = true) => {
    if (requestId !== currentRequestId.current) {
      return;
    }

    updateProgress({
      requestId,
      type: success ? 'complete' : 'error',
      mainTask: {
        title: '',
        description: '',
        status: success ? 'completed' : 'failed',
        progress: success ? 100 : 0
      }
    });

    // Keep sidebar visible after completion - user must manually close
    // No auto-hide - sidebar stays open until user clicks close button
  }, [updateProgress]);

  // Simulate progress updates for demo purposes
  const simulateProgress = useCallback((requestId: string, subtaskTitles: string[]) => {
    if (requestId !== currentRequestId.current) {
      return;
    }

    // Initialize subtasks
    const initialSubtasks = subtaskTitles.map((title, index) => ({
      id: `subtask-${index}`,
      status: 'pending' as const,
      progress: 0,
      isRealTime: true
    }));

    updateProgress({
      requestId,
      type: 'progress',
      mainTask: {
        title: '',
        description: '',
        status: 'running',
        progress: 0
      },
      subtasks: initialSubtasks
    });

    // Simulate subtask execution
    let completedCount = 0;
    subtaskTitles.forEach((title, index) => {
      setTimeout(() => {
        if (currentRequestId.current !== requestId) return;

        // Start subtask
        const updatedSubtasks = [...initialSubtasks];
        updatedSubtasks[index] = {
          ...updatedSubtasks[index],
          status: 'running',
          progress: 0,
          startTime: new Date()
        };

        updateProgress({
          requestId,
          type: 'progress',
          subtasks: updatedSubtasks,
          executionMetrics: {
            totalDuration: Date.now(),
            averageTaskTime: 2000,
            successRate: 1,
            throughput: 0.5,
            concurrentTasks: 1,
            completedTasks: completedCount,
            failedTasks: 0,
            queueLength: subtaskTitles.length - index - 1
          }
        });

        // Simulate progress
        const progressInterval = setInterval(() => {
          if (currentRequestId.current !== requestId) {
            clearInterval(progressInterval);
            return;
          }

          updatedSubtasks[index].progress += 20;
          
          if (updatedSubtasks[index].progress >= 100) {
            updatedSubtasks[index].progress = 100;
            updatedSubtasks[index].status = 'completed';
            updatedSubtasks[index].endTime = new Date();
            completedCount++;
            clearInterval(progressInterval);

            const overallProgress = (completedCount / subtaskTitles.length) * 100;
            
            updateProgress({
              requestId,
              type: 'progress',
              mainTask: {
                title: '',
                description: '',
                status: completedCount === subtaskTitles.length ? 'completed' : 'running',
                progress: overallProgress
              },
              subtasks: updatedSubtasks,
              executionMetrics: {
                totalDuration: Date.now(),
                averageTaskTime: 2000,
                successRate: 1,
                throughput: 0.5,
                concurrentTasks: completedCount === subtaskTitles.length ? 0 : 1,
                completedTasks: completedCount,
                failedTasks: 0,
                queueLength: Math.max(0, subtaskTitles.length - index - 1)
              }
            });

            if (completedCount === subtaskTitles.length) {
              completeProgress(requestId, true);
            }
          } else {
            updateProgress({
              requestId,
              type: 'progress',
              subtasks: updatedSubtasks
            });
          }
        }, 500);

      }, index * 1000); // Stagger subtask starts
    });
  }, [updateProgress, completeProgress]);

  // Control functions
  const hideProgress = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showProgress = useCallback(() => {
    setIsVisible(true);
  }, []);

  const minimizeProgress = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizeProgress = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const closeProgress = useCallback(() => {
    setIsVisible(false);
    setProgressData(null);
    currentRequestId.current = null;
  }, []);

  return {
    progressData,
    isVisible,
    isMinimized,
    startProgress,
    updateProgress,
    completeProgress,
    simulateProgress,
    hideProgress,
    showProgress,
    minimizeProgress,
    maximizeProgress,
    closeProgress
  };
}
