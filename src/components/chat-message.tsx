import { ChatMessage } from "@/lib/gemini";
import { Bot, User, Brain } from "lucide-react";
import ReactMarkdown from 'react-markdown';

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
          <div className="text-sm leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                // Customize styling for different elements
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children }) => (
                  <code className={`px-1 py-0.5 rounded text-xs font-mono ${
                    isUser 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className={`p-2 rounded overflow-x-auto text-xs font-mono ${
                    isUser 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className={`border-l-4 pl-4 italic ${
                    isUser 
                      ? 'border-blue-400' 
                      : 'border-gray-300'
                  }`}>
                    {children}
                  </blockquote>
                ),
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
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
