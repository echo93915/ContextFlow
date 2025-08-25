"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Code, 
  Layers,
  Target,
  TrendingUp,
  FileText,
  Zap
} from "lucide-react";

export interface MainTaskData {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  totalSubtasks: number;
  completedSubtasks: number;
  codeType?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  estimatedDuration?: number;
  actualDuration?: number;
  languages?: string[];
  frameworks?: string[];
  qualityScore?: number;
  integrationType?: string;
}

interface MainTaskCardProps {
  task: MainTaskData;
  onViewDetails?: () => void;
  onViewSubtasks?: () => void;
  className?: string;
}

export function MainTaskCard({ 
  task, 
  onViewDetails, 
  onViewSubtasks,
  className = "" 
}: MainTaskCardProps) {
  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Zap className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getComplexityColor = () => {
    switch (task.complexity) {
      case 'simple':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'complex':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getExecutionTime = () => {
    if (task.actualDuration) return formatDuration(task.actualDuration);
    if (task.startTime && task.endTime) {
      return formatDuration(task.endTime.getTime() - task.startTime.getTime());
    }
    if (task.estimatedDuration) return `~${formatDuration(task.estimatedDuration)}`;
    return 'N/A';
  };

  return (
    <Card className={`${getStatusColor()} transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getStatusIcon()}
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                {task.title}
              </CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2">
                {task.description}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={getComplexityColor()}>
            {task.complexity || 'unknown'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Progress</span>
            <span className="text-gray-600">
              {task.completedSubtasks}/{task.totalSubtasks} subtasks
            </span>
          </div>
          <Progress 
            value={task.progress} 
            className="h-2"
            style={{
              background: task.status === 'completed' ? '#10b981' : 
                         task.status === 'failed' ? '#ef4444' : '#3b82f6'
            }}
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{Math.round(task.progress)}% complete</span>
            <span>{getExecutionTime()}</span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Code Type */}
          {task.codeType && (
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 capitalize">
                {task.codeType.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Languages */}
          {task.languages && task.languages.length > 0 && (
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {task.languages.slice(0, 2).map((lang, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                    {lang}
                  </Badge>
                ))}
                {task.languages.length > 2 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    +{task.languages.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Quality Score */}
          {task.qualityScore && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                Quality: {(task.qualityScore * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {/* Integration Type */}
          {task.integrationType && (
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 text-xs">
                {task.integrationType.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Frameworks */}
        {task.frameworks && task.frameworks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Frameworks</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {task.frameworks.map((framework, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {framework}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              View Details
            </button>
          )}
          {onViewSubtasks && (
            <button
              onClick={onViewSubtasks}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
            >
              View Subtasks
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
