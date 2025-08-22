import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            ContextFlow Chatbot
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Powered by Google Gemini AI
          </p>
        </div>
        <ChatInterface />
      </div>
    </div>
  );
}
