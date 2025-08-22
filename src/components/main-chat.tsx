"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/lib/gemini";
import { ChatMessageComponent } from "./chat-message";
import { 
  Send, 
  Mic, 
  ChevronDown,
  Bot,
  Sparkles
} from "lucide-react";

interface MainChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export function MainChat({ messages, isLoading, onSendMessage }: MainChatProps) {
  const [input, setInput] = useState("");
  const [autoMode, setAutoMode] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {messages.length === 0 ? (
          /* Empty State - Grok-style centered layout */
          <div className="w-full max-w-2xl">
            {/* Logo and Title */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ContextFlow</h1>
              <p className="text-gray-600">What would you like to know?</p>
            </div>

            {/* Search Input */}
            <div className="relative mb-8">
              <form onSubmit={handleSubmit} className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="What would you like to know?"
                  className="w-full h-14 pl-6 pr-32 text-lg border-2 border-gray-200 rounded-full focus:border-blue-500 focus:ring-0"
                  disabled={isLoading}
                />
                
                {/* Voice Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-20 top-1/2 -translate-y-1/2 rounded-full p-2"
                  disabled={isLoading}
                >
                  <Mic className="w-5 h-5 text-gray-400" />
                </Button>

                {/* Auto Dropdown */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-2 flex items-center gap-1"
                  onClick={() => setAutoMode(!autoMode)}
                >
                  <Sparkles className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Auto</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </Button>

                {/* Send Button */}
                {input.trim() && (
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </form>
            </div>

            {/* Bottom Links */}
            <div className="flex justify-center space-x-8 text-sm">
              <button className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                DeepSearch
              </button>
              <button className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                Recent News
              </button>
              <button className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                Features
              </button>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="w-full max-w-4xl flex flex-col h-full">
            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
              <div className="space-y-6 pb-4">
                {messages.map((message) => (
                  <ChatMessageComponent key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area for Chat Mode */}
            <div className="mt-4 relative">
              <form onSubmit={handleSubmit} className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full h-12 pl-4 pr-20 border-2 border-gray-200 rounded-full focus:border-blue-500 focus:ring-0"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-blue-600 hover:bg-blue-700"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
