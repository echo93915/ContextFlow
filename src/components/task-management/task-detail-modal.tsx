"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  Code2,
  Timer,
  Zap,
  Link,
  Target,
  Copy,
  Download,
  ExternalLink
} from "lucide-react";
import { MainTaskData } from './main-task-card';
import { SubtaskData } from './subtask-grid';

interface TaskDetailModalProps {
  task?: MainTaskData | SubtaskData;
  isOpen: boolean;
  onClose: () => void;
  onCopyResult?: () => void;
  onDownloadResult?: () => void;
  onViewCode?: () => void;
}

export function TaskDetailModal({ 
  task, 
  isOpen, 
  onClose,
  onCopyResult,
  onDownloadResult,
  onViewCode 
}: TaskDetailModalProps) {
  if (!task) return null;

  const isMainTask = 'totalSubtasks' in task;
  const subtask = task as SubtaskData;
  const mainTask = task as MainTaskData;

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Timer className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'N/A';
    return date.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>{task.title}</span>
            <Badge variant="outline" className={
              task.status === 'completed' ? 'bg-green-50 text-green-800' :
              task.status === 'in_progress' ? 'bg-blue-50 text-blue-800' :
              task.status === 'failed' ? 'bg-red-50 text-red-800' :
              'bg-gray-50 text-gray-800'
            }>
              {task.status.replace('_', ' ')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                {task.description}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Progress */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Progress</label>
                <div className="text-sm text-gray-900">{Math.round(task.progress)}%</div>
              </div>

              {/* Execution Time */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Execution Time</label>
                <div className="text-sm text-gray-900">
                  {isMainTask ? 
                    formatDuration(mainTask.actualDuration) : 
                    formatDuration(subtask.executionTime)
                  }
                </div>
              </div>

              {/* Start Time */}
              {task.startTime && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Start Time</label>
                  <div className="text-sm text-gray-900">{formatTime(task.startTime)}</div>
                </div>
              )}

              {/* End Time */}
              {task.endTime && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">End Time</label>
                  <div className="text-sm text-gray-900">{formatTime(task.endTime)}</div>
                </div>
              )}

              {/* Quality Score */}
              {task.qualityScore && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Quality Score</label>
                  <div className="text-sm text-gray-900">
                    {(task.qualityScore * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              {/* Complexity */}
              {task.complexity && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Complexity</label>
                  <Badge variant="outline" className={
                    typeof task.complexity === 'string' ? (
                      task.complexity === 'simple' ? 'bg-green-100 text-green-800' :
                      task.complexity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    ) : 'bg-blue-100 text-blue-800'
                  }>
                    {typeof task.complexity === 'string' ? 
                      task.complexity : 
                      `${task.complexity}/10`
                    }
                  </Badge>
                </div>
              )}
            </div>

            {/* Main Task Specific */}
            {isMainTask && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Task Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Subtasks</label>
                    <div className="text-sm text-gray-900">
                      {mainTask.completedSubtasks}/{mainTask.totalSubtasks}
                    </div>
                  </div>

                  {mainTask.codeType && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Code Type</label>
                      <div className="text-sm text-gray-900 capitalize">
                        {mainTask.codeType.replace('_', ' ')}
                      </div>
                    </div>
                  )}

                  {mainTask.languages && mainTask.languages.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Languages</label>
                      <div className="flex flex-wrap gap-1">
                        {mainTask.languages.map((lang, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {mainTask.frameworks && mainTask.frameworks.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Frameworks</label>
                      <div className="flex flex-wrap gap-1">
                        {mainTask.frameworks.map((framework, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {framework}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subtask Specific */}
            {!isMainTask && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Subtask Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Type</label>
                    <Badge variant="outline" className="text-xs">
                      {subtask.type}
                    </Badge>
                  </div>

                  {subtask.priority && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Priority</label>
                      <Badge variant="outline" className={`text-xs ${
                        subtask.priority === 'high' ? 'bg-red-100 text-red-800' :
                        subtask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {subtask.priority}
                      </Badge>
                    </div>
                  )}

                  {subtask.executionGroup !== undefined && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Execution Group</label>
                      <div className="text-sm text-gray-900">Group {subtask.executionGroup + 1}</div>
                    </div>
                  )}

                  {subtask.resourceId && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Resource</label>
                      <div className="text-sm text-gray-900">{subtask.resourceId}</div>
                    </div>
                  )}

                  {subtask.retryCount && subtask.retryCount > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Retry Count</label>
                      <div className="text-sm text-gray-900">{subtask.retryCount}</div>
                    </div>
                  )}
                </div>

                {/* Dependencies */}
                {subtask.dependencies && subtask.dependencies.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">Dependencies</label>
                    <div className="flex flex-wrap gap-1">
                      {subtask.dependencies.map((dep, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flags */}
                <div className="flex flex-wrap gap-2">
                  {subtask.parallelCompatible && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      Parallel Compatible
                    </Badge>
                  )}
                  {subtask.criticalPath && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                      Critical Path
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Result */}
            {subtask?.result && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Result</h3>
                  <div className="flex space-x-2">
                    {onCopyResult && (
                      <button
                        onClick={onCopyResult}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy result"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    {onDownloadResult && (
                      <button
                        onClick={onDownloadResult}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Download result"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    {onViewCode && (
                      <button
                        onClick={onViewCode}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View in code editor"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-md text-xs font-mono overflow-x-auto max-h-40">
                  <pre>{subtask.result}</pre>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
