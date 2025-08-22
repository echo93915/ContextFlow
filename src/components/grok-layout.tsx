"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MainChat } from "./main-chat";
import { ChatMessage } from "@/lib/gemini";

export function GrokLayout() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; timestamp: Date; messages?: ChatMessage[] }>>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatbot-messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        const messagesWithDates = parsed.map((msg: Omit<ChatMessage, 'timestamp'> & { timestamp: string }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading saved messages:', error);
      }
    }

    // Load chat history
    const savedHistory = localStorage.getItem('chat-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const historyWithDates = parsed.map((chat: { id: string; title: string; timestamp: string; messages?: any[] }) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
          messages: chat.messages?.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatHistory(historyWithDates);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatbot-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>, updateHistory = true) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Only update chat history order when new messages are actually added (not when loading)
    if (updateHistory && currentChatId) {
      const updatedMessages = [...messages, newMessage];
      const chatTitle = updatedMessages[0]?.content.slice(0, 50) + (updatedMessages[0]?.content.length > 50 ? '...' : '');
      
      setChatHistory(prev => {
        // Remove existing entry and add updated one at the top
        const updated = prev.filter(chat => chat.id !== currentChatId);
        updated.unshift({
          id: currentChatId,
          title: chatTitle,
          timestamp: new Date(),
          messages: updatedMessages
        });
        const trimmed = updated.slice(0, 20);
        localStorage.setItem('chat-history', JSON.stringify(trimmed));
        return trimmed;
      });
    }
    
    return newMessage;
  };

  const handleSendMessage = async (content: string) => {
    // Generate a new chat ID if this is the first message
    if (messages.length === 0 && currentChatId === null) {
      setCurrentChatId(crypto.randomUUID());
    }
    
    // Add user message
    addMessage({ role: 'user', content });
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Add assistant message
      addMessage({ role: 'assistant', content: data.response });
    } catch (error) {
      console.error('Error:', error);
      addMessage({ 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please make sure your Gemini API key is configured correctly.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    // Save current conversation to history before clearing
    if (messages.length > 0 && currentChatId !== null) {
      const chatTitle = messages[0]?.content.slice(0, 50) + (messages[0]?.content.length > 50 ? '...' : '');
      const newChatEntry = {
        id: currentChatId,
        title: chatTitle,
        timestamp: new Date(),
        messages: messages // Store the actual messages
      };
      
      setChatHistory(prev => {
        // Remove any existing entry with the same ID and add the updated chat
        const updated = prev.filter(chat => chat.id !== currentChatId);
        updated.unshift(newChatEntry);
        
        // Keep only the last 20 chats to prevent storage overflow
        const trimmed = updated.slice(0, 20);
        localStorage.setItem('chat-history', JSON.stringify(trimmed));
        return trimmed;
      });
    }
    
    // Clear current messages and start fresh
    setMessages([]);
    setCurrentChatId(null);
    localStorage.removeItem('chatbot-messages');
  };

  const handleSelectChat = (chatId: string) => {
    // Don't do anything if we're already viewing this chat
    if (chatId === currentChatId) {
      return;
    }
    
    // Find the selected chat in history
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    if (selectedChat && selectedChat.messages) {
      // Save current conversation to history first if it has messages and a valid ID
      if (messages.length > 0 && currentChatId !== null) {
        const currentChatTitle = messages[0]?.content.slice(0, 50) + (messages[0]?.content.length > 50 ? '...' : '');
        const currentChatEntry = {
          id: currentChatId,
          title: currentChatTitle,
          timestamp: new Date(),
          messages: messages
        };
        
        setChatHistory(prev => {
          const updated = prev.filter(chat => chat.id !== currentChatId);
          updated.unshift(currentChatEntry);
          const trimmed = updated.slice(0, 20);
          localStorage.setItem('chat-history', JSON.stringify(trimmed));
          return trimmed;
        });
      }
      
      // Load the selected chat messages WITHOUT changing its position in history
      setMessages(selectedChat.messages);
      setCurrentChatId(chatId);
      localStorage.setItem('chatbot-messages', JSON.stringify(selectedChat.messages));
    }
  };

  const handleDeleteChat = (chatId: string) => {
    // If we're deleting the currently active chat, clear the messages
    if (chatId === currentChatId) {
      setMessages([]);
      setCurrentChatId(null);
      localStorage.removeItem('chatbot-messages');
    }
    
    // Remove from chat history
    setChatHistory(prev => {
      const updated = prev.filter(chat => chat.id !== chatId);
      localStorage.setItem('chat-history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header />
      
      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          chatHistory={chatHistory}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          currentChatId={currentChatId}
        />
        
        {/* Main Content */}
        <MainChat
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
