"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MainTaskCard, 
  SubtaskGrid, 
  TaskExecutionMonitor,
  type MainTaskData,
  type SubtaskData,
  type ExecutionMetrics
} from './task-management';
import { TaskDetailModal } from './task-management/task-detail-modal';
import { 
  Code2, 
  Eye, 
  Download,
  RefreshCw,
  Layers,
  Activity
} from "lucide-react";

interface CodeGenerationDisplayProps {
  agentInfo?: {
    workflow: string;
    confidence: number;
    metadata?: {
      workflow_parameters?: {
        type: string;
        codeAnalysis?: any;
        mainTask?: any;
        subtasks?: any[];
        executionMetrics?: any;
        integratedSolution?: any;
      };
    };
  };
  response?: string;
  className?: string;
}

export function CodeGenerationDisplay({ 
  agentInfo, 
  response,
  className = "" 
}: CodeGenerationDisplayProps) {
  const [selectedTask, setSelectedTask] = useState<MainTaskData | SubtaskData | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'subtasks' | 'monitor'>('overview');

  // Check if this is a code generation response
  if (!agentInfo || agentInfo.workflow !== 'code_generation') {
    return null;
  }

  const workflowParams = agentInfo.metadata?.workflow_parameters;
  if (!workflowParams || workflowParams.type !== 'parallel_execution') {
    return null;
  }

  // Extract task data
  const mainTaskData: MainTaskData = {
    id: workflowParams.mainTask?.id || 'main-task',
    title: workflowParams.mainTask?.title || 'Code Generation Task',
    description: workflowParams.mainTask?.description || 'Generated code solution',
    status: 'completed',
    progress: 100,
    startTime: workflowParams.mainTask?.created_at ? new Date(workflowParams.mainTask.created_at) : undefined,
    totalSubtasks: workflowParams.subtasks?.length || 0,
    completedSubtasks: workflowParams.subtasks?.filter((s: any) => s.status === 'completed').length || 0,
    codeType: workflowParams.codeAnalysis?.codeType,
    complexity: workflowParams.codeAnalysis?.complexity,
    languages: workflowParams.codeAnalysis?.languages,
    frameworks: workflowParams.codeAnalysis?.frameworks,
    qualityScore: workflowParams.integratedSolution?.qualityMetrics?.overallQuality,
    integrationType: workflowParams.integratedSolution?.integrationType,
    actualDuration: workflowParams.executionMetrics?.parallelExecutionTime
  };

  // Extract subtask data
  const subtasksData: SubtaskData[] = (workflowParams.subtasks || []).map((subtask: any) => ({
    id: subtask.id,
    title: subtask.title || 'Subtask',
    description: subtask.description || 'Implementation subtask',
    type: subtask.type || 'implementation',
    status: subtask.status || 'completed',
    progress: subtask.progress || 100,
    startTime: subtask.start_time ? new Date(subtask.start_time) : undefined,
    endTime: subtask.end_time ? new Date(subtask.end_time) : undefined,
    executionTime: subtask.execution_time,
    dependencies: subtask.dependencies,
    executionGroup: subtask.execution_group,
    parallelCompatible: subtask.parallel_compatible,
    criticalPath: subtask.critical_path,
    qualityScore: subtask.quality_score,
    resourceId: subtask.resource_id,
    retryCount: subtask.retry_count,
    result: subtask.result || subtask.llm_response,
    priority: subtask.priority,
    complexity: subtask.complexity_score
  }));

  // Extract execution metrics
  const executionMetrics: ExecutionMetrics = {
    totalTasks: workflowParams.executionMetrics?.totalSubtasks || 0,
    completedTasks: subtasksData.filter(s => s.status === 'completed').length,
    failedTasks: subtasksData.filter(s => s.status === 'failed').length,
    inProgressTasks: subtasksData.filter(s => s.status === 'in_progress').length,
    totalExecutionTime: workflowParams.executionMetrics?.parallelExecutionTime || 0,
    averageTaskTime: workflowParams.executionMetrics?.averageSubtaskTime || 0,
    successRate: workflowParams.executionMetrics?.successRate || 1,
    resourceUtilization: 75, // Mock data
    concurrentTasks: 0,
    maxConcurrency: 5,
    queueLength: 0,
    errorRate: 1 - (workflowParams.executionMetrics?.successRate || 1),
    throughput: (workflowParams.executionMetrics?.totalSubtasks || 0) / 
                 ((workflowParams.executionMetrics?.parallelExecutionTime || 1) / 1000)
  };

  const handleTaskClick = (task: MainTaskData | SubtaskData) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleCopyResult = () => {
    if (selectedTask && 'result' in selectedTask && selectedTask.result) {
      navigator.clipboard.writeText(selectedTask.result);
    }
  };

  const handleDownloadResult = () => {
    if (selectedTask && 'result' in selectedTask && selectedTask.result) {
      const blob = new Blob([selectedTask.result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTask.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Code2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Code Generation Results</h2>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {agentInfo.confidence.toFixed(1)} confidence
          </Badge>
        </div>
        
        {/* View Toggle */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setCurrentView('overview')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              currentView === 'overview' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4 mr-1 inline" />
            Overview
          </button>
          <button
            onClick={() => setCurrentView('subtasks')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              currentView === 'subtasks' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-4 h-4 mr-1 inline" />
            Subtasks
          </button>
          <button
            onClick={() => setCurrentView('monitor')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              currentView === 'monitor' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4 mr-1 inline" />
            Metrics
          </button>
        </div>
      </div>

      {/* Content based on current view */}
      {currentView === 'overview' && (
        <div className="space-y-6">
          {/* Main Task Card */}
          <MainTaskCard
            task={mainTaskData}
            onViewDetails={() => handleTaskClick(mainTaskData)}
            onViewSubtasks={() => setCurrentView('subtasks')}
          />

          {/* Integration Quality Summary */}
          {workflowParams.integratedSolution && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integration Quality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Overall Quality</span>
                    <div className="font-medium">
                      {(workflowParams.integratedSolution.qualityMetrics?.overallQuality * 100 || 0).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Maintainability</span>
                    <div className="font-medium">
                      {(workflowParams.integratedSolution.qualityMetrics?.maintainabilityIndex * 100 || 0).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Integration Type</span>
                    <div className="font-medium capitalize">
                      {workflowParams.integratedSolution.integrationType?.replace('_', ' ') || 'Standard'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Dependencies</span>
                    <div className="font-medium">
                      {workflowParams.integratedSolution.integrationMetrics?.dependenciesResolved || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {currentView === 'subtasks' && (
        <SubtaskGrid
          subtasks={subtasksData}
          onSubtaskClick={handleTaskClick}
          showExecutionGroups={true}
          showDependencies={true}
        />
      )}

      {currentView === 'monitor' && (
        <TaskExecutionMonitor
          metrics={executionMetrics}
          isRealTime={false}
        />
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={showTaskDetail}
        onClose={() => setShowTaskDetail(false)}
        onCopyResult={handleCopyResult}
        onDownloadResult={handleDownloadResult}
      />
    </div>
  );
}
