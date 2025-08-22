"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, Settings, User, Plus } from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  onNewChat: () => void;
}

export function Header({ onNewChat }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - New Chat Button */}
        <div className="flex items-center">
          <Button
            onClick={onNewChat}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </Button>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center space-x-4">
          {/* Settings */}
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="w-4 h-4 text-gray-600" />
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-100">
                <User className="w-4 h-4 text-gray-600" />
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" className="p-1">
              <span className="text-sm text-gray-700 mr-1">User</span>
              <ChevronDown className="w-3 h-3 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
