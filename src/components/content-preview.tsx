"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Link } from "lucide-react";

interface UploadItem {
  id: string;
  type: 'pdf' | 'url';
  name: string;
  content: string;
  timestamp: Date;
}

interface ContentPreviewProps {
  item: UploadItem;
  onBack: () => void;
}

export function ContentPreview({ item, onBack }: ContentPreviewProps) {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Button>
          
          <div className="flex items-center gap-2">
            {item.type === 'pdf' ? (
              <FileText className="w-5 h-5 text-red-500" />
            ) : (
              <Link className="w-5 h-5 text-blue-500" />
            )}
            <div>
              <h2 className="font-semibold text-gray-900">{item.name}</h2>
              <p className="text-sm text-gray-600">
                {item.type === 'pdf' ? 'PDF Document' : 'Web Content'} • {item.timestamp.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4">
        <div className="w-full h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
          {item.type === 'url' ? (
            <iframe
              src={item.content}
              className="w-full h-full border-0"
              title="URL Preview"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          ) : item.type === 'pdf' ? (
            <iframe
              src={`${item.content}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
              className="w-full h-full border-0"
              title="PDF Preview"
              type="application/pdf"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
