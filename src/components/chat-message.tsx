import { ChatMessage } from "@/lib/gemini";
import { Bot, User, Brain } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-blue-600' : 'bg-black'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      
      {/* Message Content */}
      <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`rounded-2xl p-4 shadow-sm ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-white text-gray-900'
        }`}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1 px-2">
          <span className="text-xs text-gray-500">
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          {message.contextUsed && message.role === 'assistant' && (
            <div className="flex items-center gap-1">
              <Brain className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600">Context</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
