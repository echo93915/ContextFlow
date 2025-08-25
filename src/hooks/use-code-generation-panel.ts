"use client";

import { useState, useCallback } from 'react';

export function useCodeGenerationPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentAgentInfo, setCurrentAgentInfo] = useState<any>(null);
  const [currentResponse, setCurrentResponse] = useState<string>('');

  // Show panel when code generation starts
  const showPanel = useCallback(() => {
    setIsVisible(true);
    setIsMinimized(false);
    setCurrentAgentInfo(null);
    setCurrentResponse('');
  }, []);

  // Update panel with agent results
  const updatePanel = useCallback((agentInfo: any, response: string) => {
    setCurrentAgentInfo(agentInfo);
    setCurrentResponse(response);
  }, []);

  // Hide panel
  const hidePanel = useCallback(() => {
    setIsVisible(false);
    setCurrentAgentInfo(null);
    setCurrentResponse('');
  }, []);

  // Minimize panel
  const minimizePanel = useCallback(() => {
    setIsMinimized(true);
  }, []);

  // Maximize panel
  const maximizePanel = useCallback(() => {
    setIsMinimized(false);
  }, []);

  return {
    isVisible,
    isMinimized,
    currentAgentInfo,
    currentResponse,
    showPanel,
    updatePanel,
    hidePanel,
    minimizePanel,
    maximizePanel
  };
}
