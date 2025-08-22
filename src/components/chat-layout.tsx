"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MainChat } from "./main-chat";
import { ContentPreview } from "./content-preview";
import { ChatMessage } from "@/lib/gemini";

export interface UploadItem {
  id: string;
  type: 'pdf' | 'url';
  name: string;
  content: string; // file path or URL
  timestamp: Date;
}

export function ChatLayout() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; timestamp: Date; messages?: ChatMessage[] }>>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadItem[]>([]);
  const [previewItem, setPreviewItem] = useState<UploadItem | null>(null);


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
        const historyWithDates = parsed.map((chat: { id: string; title: string; timestamp: string; messages?: Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }> }) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
          messages: chat.messages?.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatHistory(historyWithDates);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }

    // Load upload history
    const savedUploads = localStorage.getItem('upload-history');
    if (savedUploads) {
      try {
        const parsed = JSON.parse(savedUploads);
        const uploadsWithDates = parsed.map((upload: Omit<UploadItem, 'timestamp'> & { timestamp: string }) => ({
          ...upload,
          timestamp: new Date(upload.timestamp)
        }));
        setUploadHistory(uploadsWithDates);
      } catch (error) {
        console.error('Error loading upload history:', error);
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
    
    // Only update chat history order when new messages are actually added AND it's a new message to an existing chat
    if (updateHistory && currentChatId) {
      const updatedMessages = [...messages, newMessage];
      const chatTitle = updatedMessages[0]?.content.slice(0, 50) + (updatedMessages[0]?.content.length > 50 ? '...' : '');
      
      setChatHistory(prev => {
        // Find the existing chat and update it in place (preserve order)
        const existingChatIndex = prev.findIndex(chat => chat.id === currentChatId);
        
        if (existingChatIndex !== -1) {
          // Update existing chat in its current position
          const updated = [...prev];
          updated[existingChatIndex] = {
            ...updated[existingChatIndex],
            title: chatTitle,
            timestamp: new Date(),
            messages: updatedMessages
          };
          localStorage.setItem('chat-history', JSON.stringify(updated));
          return updated;
        } else {
          // If chat doesn't exist in history, add it at the top (new chat)
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
        }
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
      
      // Add assistant message with context information
      addMessage({ 
        role: 'assistant', 
        content: data.response,
        contextUsed: data.contextUsed 
      });
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
      // Simply load the selected chat messages without any history updates
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

  const handleNewContext = () => {
    // Clear current session but preserve chat history
    setMessages([]);
    setCurrentChatId(null);
    localStorage.removeItem('chatbot-messages');
  };

  const handleFileUpload = async (file: File) => {
    const uploadId = crypto.randomUUID();
    
    try {
      // Extract text from PDF
      console.log('🔄 Starting PDF text extraction for:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'pdf');
      
      console.log('📤 Sending request to /api/extract-text');
      console.log('📋 FormData contents:', {
        file: file.name,
        type: 'pdf',
        fileSize: file.size,
        fileType: file.type
      });
      
      let extractResponse: Response;
      try {
        extractResponse = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData,
        });
        console.log('📡 Response received:', {
          ok: extractResponse.ok,
          status: extractResponse.status,
          statusText: extractResponse.statusText,
          url: extractResponse.url,
          headers: Object.fromEntries(extractResponse.headers.entries())
        });
      } catch (fetchError) {
        console.error('❌ Fetch request failed:', fetchError);
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'}`);
      }
      
      if (!extractResponse.ok) {
        let responseText: string;
        try {
          responseText = await extractResponse.text();
          console.log('📄 Response text:', responseText);
        } catch (textError) {
          console.error('❌ Failed to read response text:', textError);
          responseText = 'Could not read response text';
        }
        
        console.error('❌ PDF extraction failed:', {
          status: extractResponse.status,
          statusText: extractResponse.statusText,
          responseText,
          url: extractResponse.url
        });
        
        let errorData: any = {};
        try {
          if (responseText) {
            errorData = JSON.parse(responseText);
          }
        } catch (jsonError) {
          console.log('📝 Response is not JSON, using as plain text');
          errorData = { details: responseText || `HTTP ${extractResponse.status}: ${extractResponse.statusText}` };
        }
        
        throw new Error(`Failed to extract text from PDF: ${errorData.details || errorData.error || 'Unknown error'}`);
      }
      
      const { text, metadata } = await extractResponse.json();
      
      // Process document for RAG
      const processResponse = await fetch('/api/process-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          source: file.name,
          sourceType: 'pdf',
          title: file.name,
          uploadId,
        }),
      });
      
      if (!processResponse.ok) {
        throw new Error('Failed to process document');
      }
      
      // Create upload item
      const newUpload: UploadItem = {
        id: uploadId,
        type: 'pdf',
        name: file.name,
        content: file.name, // Store filename for display
        timestamp: new Date()
      };
      
      setUploadHistory(prev => {
        const updated = [newUpload, ...prev].slice(0, 20);
        localStorage.setItem('upload-history', JSON.stringify(updated));
        return updated;
      });
      
      console.log('PDF processed successfully for RAG system');
    } catch (error) {
      console.error('Error processing PDF:', error);
      // Still add to upload history even if processing fails
      const newUpload: UploadItem = {
        id: uploadId,
        type: 'pdf',
        name: file.name,
        content: file.name,
        timestamp: new Date()
      };
      
      setUploadHistory(prev => {
        const updated = [newUpload, ...prev].slice(0, 20);
        localStorage.setItem('upload-history', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleUrlUpload = async (url: string) => {
    const uploadId = crypto.randomUUID();
    let title = 'Web Document'; // Default fallback
    
    try {
      // Generate title using Gemini API
      const titleResponse = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (titleResponse.ok) {
        const data = await titleResponse.json();
        title = data.title;
      }

      // Extract text from URL
      const formData = new FormData();
      formData.append('url', url);
      formData.append('type', 'url');
      
      const extractResponse = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });
      
      if (!extractResponse.ok) {
        const responseText = await extractResponse.text().catch(() => 'No response text');
        console.error('❌ URL extraction failed:', {
          status: extractResponse.status,
          statusText: extractResponse.statusText,
          responseText,
          url: extractResponse.url
        });
        
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { details: responseText || `HTTP ${extractResponse.status}` };
        }
        
        throw new Error(`Failed to extract text from URL: ${errorData.details || errorData.error || 'Unknown error'}`);
      }
      
      const { text, metadata } = await extractResponse.json();
      
      // Use extracted title if available
      if (metadata.title) {
        title = metadata.title.slice(0, 50) + (metadata.title.length > 50 ? '...' : '');
      }
      
      // Process document for RAG
      const processResponse = await fetch('/api/process-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          source: url,
          sourceType: 'url',
          title,
          uploadId,
        }),
      });
      
      if (!processResponse.ok) {
        throw new Error('Failed to process document');
      }
      
      console.log('URL processed successfully for RAG system');
    } catch (error) {
      console.error('Error processing URL:', error);
      // Continue with title generation fallback
    }

    const newUpload: UploadItem = {
      id: uploadId,
      type: 'url',
      name: title,
      content: url,
      timestamp: new Date()
    };
    
    setUploadHistory(prev => {
      const updated = [newUpload, ...prev].slice(0, 20);
      localStorage.setItem('upload-history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteUpload = (uploadId: string) => {
    setUploadHistory(prev => {
      const updated = prev.filter(upload => upload.id !== uploadId);
      localStorage.setItem('upload-history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handlePreviewItem = (item: UploadItem) => {
    setPreviewItem(item);
  };

  const handleBackToChat = () => {
    setPreviewItem(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header onNewChat={handleNewChat} />
      
      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          chatHistory={chatHistory}
          uploadHistory={uploadHistory}
          onNewContext={handleNewContext}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onFileUpload={handleFileUpload}
          onUrlUpload={handleUrlUpload}
          onDeleteUpload={handleDeleteUpload}
          onPreviewItem={handlePreviewItem}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          currentChatId={currentChatId}
        />
        
        {/* Main Content */}
        {previewItem ? (
          <ContentPreview
            item={previewItem}
            onBack={handleBackToChat}
          />
        ) : (
          <MainChat
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
}
