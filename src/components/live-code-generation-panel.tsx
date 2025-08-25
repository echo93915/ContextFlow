"use client";

import React, { useState, useEffect } from 'react';
import { CodeGenerationDisplay } from './code-generation-display';
import { 
  X, 
  Minimize2, 
  Maximize2,
  Activity,
  Clock,
  Code2
} from "lucide-react";

interface LiveCodeGenerationPanelProps {
  agentInfo?: {
    workflow: string;
    confidence: number;
    metadata?: {
      workflow_parameters?: any;
    };
  };
  response?: string;
  isVisible: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  className?: string;
}

export function LiveCodeGenerationPanel({
  agentInfo,
  response,
  isVisible,
  isMinimized,
  onClose,
  onMinimize,
  onMaximize,
  className = ""
}: LiveCodeGenerationPanelProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingStage, setProcessingStage] = useState(0);

  // Simulate processing stages for better UX
  useEffect(() => {
    if (isProcessing && isVisible) {
      const stages = [
        'Analyzing requirements...',
        'Planning architecture...',
        'Decomposing into subtasks...',
        'Generating code in parallel...',
        'Integrating components...',
        'Finalizing solution...'
      ];
      
      const interval = setInterval(() => {
        setProcessingStage(prev => {
          if (prev < stages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000); // Change stage every 2 seconds
      
      return () => clearInterval(interval);
    }
  }, [isProcessing, isVisible]);

  // Check if we have completed agent data
  useEffect(() => {
    if (agentInfo?.workflow === 'code_generation' && agentInfo.metadata?.workflow_parameters) {
      setIsProcessing(false);
      setProcessingStage(0);
    }
  }, [agentInfo]);

  if (!isVisible) {
    return null;
  }

  const hasData = agentInfo?.workflow === 'code_generation' && agentInfo.metadata?.workflow_parameters;

  return (
    <div className={`
      ${className}
      ${isMinimized ? 'w-16' : 'w-96'}
      bg-white border-l border-gray-200 flex flex-col transition-all duration-300
      ${isProcessing ? 'border-blue-300 shadow-lg' : 'border-gray-200'}
    `}>
      {/* Header */}
      <div className={`
        p-4 border-b border-gray-200 flex items-center justify-between
        ${isProcessing 
          ? 'bg-blue-50 text-blue-800 border-blue-200' 
          : hasData 
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-gray-50 text-gray-800'
        }
      `}>
        {!isMinimized && (
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {isProcessing ? (
              <Activity className="w-5 h-5 animate-pulse" />
            ) : hasData ? (
              <Code2 className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {isProcessing 
                  ? 'Generating Code...' 
                  : hasData 
                    ? 'Code Generation Complete'
                    : 'Code Generation'
                }
              </h3>
              <p className="text-xs opacity-75 truncate">
                {isProcessing 
                  ? 'Please wait while we process your request'
                  : 'View detailed results and task breakdown'
                }
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-1">
          {!isMinimized ? (
            <>
              <button
                onClick={onMinimize}
                className="p-1 hover:bg-black/10 rounded transition-colors"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className={`p-1 rounded transition-colors ${
                  !isProcessing
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
              className="p-1 hover:bg-black/10 rounded transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto">
          {isProcessing ? (
            /* Processing State */
            <div className="p-6 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Processing Your Request</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Our AI agent is working on your code generation...
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  {[
                    'Analyzing requirements...',
                    'Planning architecture...',
                    'Decomposing into subtasks...',
                    'Generating code in parallel...',
                    'Integrating components...',
                    'Finalizing solution...'
                  ].map((stage, index) => (
                    <div key={index} className="flex items-center justify-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index <= processingStage 
                          ? 'bg-blue-500 animate-pulse' 
                          : index === processingStage + 1 
                            ? 'bg-blue-300 animate-pulse' 
                            : 'bg-gray-300'
                      }`}></div>
                      <span className={`${
                        index <= processingStage 
                          ? 'text-blue-700 font-medium' 
                          : index === processingStage + 1 
                            ? 'text-blue-600' 
                            : 'text-gray-400'
                      }`}>
                        {stage}
                      </span>
                      {index <= processingStage && (
                        <span className="text-green-600 text-xs">✓</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((processingStage + 1) / 6) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Step {processingStage + 1} of 6
                </p>
              </div>
            </div>
          ) : hasData ? (
            /* Show Real Code Generation Results */
            <div className="p-2">
              <CodeGenerationDisplay
                agentInfo={agentInfo}
                response={response}
                className="border-0 shadow-none bg-transparent"
              />
            </div>
          ) : (
            /* Waiting State */
            <div className="p-6 text-center text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-3 text-gray-400" />
              <p>Waiting for code generation to start...</p>
            </div>
          )}
        </div>
      )}

      {/* Minimized State */}
      {isMinimized && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-2 p-2">
          {isProcessing ? (
            <>
              <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
              <div className="text-xs font-bold text-center text-blue-600">
                Step {processingStage + 1}/6
              </div>
              <div className="w-8 bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${((processingStage + 1) / 6) * 100}%` }}
                ></div>
              </div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </>
          ) : hasData ? (
            <>
              <Code2 className="w-6 h-6 text-green-600" />
              <div className="text-xs font-bold text-center text-green-600">
                Complete
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </>
          ) : (
            <>
              <Clock className="w-6 h-6 text-gray-400" />
              <div className="text-xs font-bold text-center text-gray-500">
                Waiting
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
