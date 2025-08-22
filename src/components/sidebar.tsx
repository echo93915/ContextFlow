"use client";


import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  Link
} from "lucide-react";

interface UploadItem {
  id: string;
  type: 'pdf' | 'url';
  name: string;
  content: string;
  timestamp: Date;
}

interface SidebarProps {
  chatHistory: Array<{ id: string; title: string; timestamp: Date; messages?: unknown[] }>;
  uploadHistory: UploadItem[];
  showUploadInterface: boolean;
  onNewContext: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onFileUpload: (file: File) => void;
  onUrlUpload: (url: string) => void;
  onDeleteUpload: (uploadId: string) => void;
  collapsed?: boolean;
  onToggleCollapse: () => void;
  currentChatId?: string | null;
}

export function Sidebar({ 
  chatHistory,
  uploadHistory,
  showUploadInterface,
  onNewContext, 
  onSelectChat, 
  onDeleteChat,
  onFileUpload,
  onUrlUpload,
  onDeleteUpload,
  collapsed = false,
  onToggleCollapse,
  currentChatId 
}: SidebarProps) {

  const handleChatSelect = (chatId: string) => {
    onSelectChat(chatId);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    onDeleteChat(chatId);
  };

  const handleDeleteUpload = (e: React.MouseEvent, uploadId: string) => {
    e.stopPropagation();
    onDeleteUpload(uploadId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleUrlSubmit = () => {
    const url = prompt('Enter URL:');
    if (url) {
      onUrlUpload(url);
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-900">ContextFlow</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Context Section - Top Panel */}
      {!collapsed && (
        <div className="mb-4">
          <div className="p-3 text-sm font-medium text-gray-700">
            Context
          </div>
          
          {/* Upload Interface */}
          {showUploadInterface && (
            <div className="px-2 pb-2">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* PDF Upload Button */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                    <FileText className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">PDF</span>
                  </div>
                </div>

                {/* URL Upload Button */}
                <div
                  onClick={handleUrlSubmit}
                  className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <Link className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">URL</span>
                </div>
              </div>
            </div>
          )}

          {/* Upload History */}
          <div className="px-2 pb-2">
            {uploadHistory.length === 0 ? (
              <div className="text-sm text-gray-500 p-3 text-center">
                No Knowledge Base
              </div>
            ) : (
              <div className="space-y-1">
                {uploadHistory.slice(0, 5).map((upload) => (
                  <div
                    key={upload.id}
                    className="group relative flex items-center rounded-lg hover:bg-gray-50 p-2"
                  >
                    <div className="flex-1 flex items-center gap-2">
                      {upload.type === 'pdf' ? (
                        <FileText className="w-4 h-4 text-red-500" />
                      ) : (
                        <Link className="w-4 h-4 text-blue-500" />
                      )}
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-medium truncate">
                          {upload.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {upload.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                      onClick={(e) => handleDeleteUpload(e, upload.id)}
                      title="Delete Upload"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Context Button */}
      <div className="p-2 border-b border-gray-200 mt-2">
        <Button
          onClick={onNewContext}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white ${collapsed ? 'px-2' : ''}`}
          variant="default"
          title={collapsed ? "New Context" : undefined}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span className="ml-2">New Context</span>}
        </Button>
      </div>

      {/* Chat History */}
      {!collapsed && (
        <div className="flex-1 flex flex-col">
          <div className="p-3 text-sm font-medium text-gray-700">
            History
          </div>
          <ScrollArea className="flex-1 px-2">
            {chatHistory.length === 0 ? (
              <div className="text-sm text-gray-500 p-3 text-center">
                No chat history
              </div>
            ) : (
              <div className="space-y-1">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group relative flex items-center rounded-lg ${
                      currentChatId === chat.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start p-2 h-auto rounded-lg"
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      <div className="text-left overflow-hidden pr-8">
                        <div className="text-sm font-medium truncate">
                          {chat.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {chat.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </Button>
                    
                    {/* Delete Button - Shows on hover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      title="Delete Chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
