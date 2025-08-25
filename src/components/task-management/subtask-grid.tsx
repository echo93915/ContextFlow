"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Code2,
  Link,
  Zap,
  Timer,
  Target,
  PlayCircle,
  PauseCircle,
  FileText,
  Settings
} from "lucide-react";

export interface SubtaskData {
  id: string;
  title: string;
  description: string;
  type: 'implementation' | 'testing' | 'documentation' | 'configuration';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  executionTime?: number;
  dependencies?: string[];
  executionGroup?: number;
  parallelCompatible?: boolean;
  criticalPath?: boolean;
  qualityScore?: number;
  resourceId?: string;
  retryCount?: number;
  result?: string;
  priority?: 'low' | 'medium' | 'high';
  complexity?: number;
}

interface SubtaskGridProps {
  subtasks: SubtaskData[];
  onSubtaskClick?: (subtask: SubtaskData) => void;
  showExecutionGroups?: boolean;
  showDependencies?: boolean;
  className?: string;
}

export function SubtaskGrid({ 
  subtasks, 
  onSubtaskClick,
  showExecutionGroups = true,
  showDependencies = true,
  className = "" 
}: SubtaskGridProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-l-green-400 bg-green-50';
      case 'in_progress':
        return 'border-l-blue-400 bg-blue-50';
      case 'failed':
        return 'border-l-red-400 bg-red-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'implementation':
        return <Code2 className="w-4 h-4 text-purple-500" />;
      case 'testing':
        return <Target className="w-4 h-4 text-orange-500" />;
      case 'documentation':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'configuration':
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <Code2 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const groupSubtasksByExecutionGroup = () => {
    if (!showExecutionGroups) return { 0: subtasks };
    
    return subtasks.reduce((groups, subtask) => {
      const group = subtask.executionGroup || 0;
      if (!groups[group]) groups[group] = [];
      groups[group].push(subtask);
      return groups;
    }, {} as Record<number, SubtaskData[]>);
  };

  const subtaskGroups = groupSubtasksByExecutionGroup();

  const renderSubtaskCard = (subtask: SubtaskData) => (
    <Card 
      key={subtask.id}
      className={`
        ${getStatusColor(subtask.status)} 
        border-l-4 cursor-pointer transition-all duration-200 
        hover:shadow-md hover:scale-[1.02]
        ${subtask.criticalPath ? 'ring-2 ring-orange-200' : ''}
      `}
      onClick={() => onSubtaskClick?.(subtask)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            {getStatusIcon(subtask.status)}
            <div className="flex-1">
              <CardTitle className="text-sm font-medium text-gray-900 mb-1">
                {subtask.title}
              </CardTitle>
              <p className="text-xs text-gray-600 line-clamp-2">
                {subtask.description}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {subtask.priority && (
              <Badge 
                variant="outline" 
                className={`text-xs px-1 py-0 ${getPriorityColor(subtask.priority)}`}
              >
                {subtask.priority}
              </Badge>
            )}
            {subtask.criticalPath && (
              <Badge variant="outline" className="text-xs px-1 py-0 bg-orange-100 text-orange-800">
                Critical
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700">Progress</span>
            <span className="text-gray-600">{Math.round(subtask.progress)}%</span>
          </div>
          <Progress value={subtask.progress} className="h-1.5" />
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Type */}
          <div className="flex items-center space-x-1">
            {getTypeIcon(subtask.type)}
            <span className="text-gray-600 capitalize">{subtask.type}</span>
          </div>

          {/* Execution Time */}
          <div className="flex items-center space-x-1">
            <Timer className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">
              {formatExecutionTime(subtask.executionTime)}
            </span>
          </div>

          {/* Quality Score */}
          {subtask.qualityScore && (
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">
                Q: {(subtask.qualityScore * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {/* Resource ID */}
          {subtask.resourceId && (
            <div className="flex items-center space-x-1">
              <PlayCircle className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600 text-xs">
                {subtask.resourceId}
              </span>
            </div>
          )}
        </div>

        {/* Dependencies */}
        {showDependencies && subtask.dependencies && subtask.dependencies.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Link className="w-3 h-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">Dependencies</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {subtask.dependencies.slice(0, 2).map((dep, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                  {dep}
                </Badge>
              ))}
              {subtask.dependencies.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{subtask.dependencies.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Parallel Execution Indicator */}
        {subtask.parallelCompatible && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-xs text-blue-600">Parallel Compatible</span>
          </div>
        )}

        {/* Retry Count */}
        {subtask.retryCount && subtask.retryCount > 0 && (
          <div className="flex items-center space-x-1">
            <PauseCircle className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-yellow-600">
              Retried {subtask.retryCount} time{subtask.retryCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {Object.keys(subtaskGroups).map((groupKey) => {
        const group = parseInt(groupKey);
        const groupSubtasks = subtaskGroups[group];
        
        return (
          <div key={group} className="space-y-3">
            {showExecutionGroups && Object.keys(subtaskGroups).length > 1 && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                    {group + 1}
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Execution Group {group + 1}
                  </h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {groupSubtasks.length} task{groupSubtasks.length > 1 ? 's' : ''}
                </Badge>
                {groupSubtasks.some(s => s.parallelCompatible) && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Parallel Execution
                  </Badge>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupSubtasks.map(renderSubtaskCard)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
