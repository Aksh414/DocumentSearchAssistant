import React from "react";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@/types";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const RecentDocuments: React.FC = () => {
  const { openDocumentViewer } = useApp();
  
  const { data: documents, isLoading } = useQuery<Document[]>({ 
    queryKey: ["/api/documents/recent"],
  });
  
  const getFileTypeColor = (fileType: string) => {
    switch (fileType.toUpperCase()) {
      case "PDF":
        return "bg-blue-100 text-blue-800";
      case "DOCX":
        return "bg-indigo-100 text-indigo-800";
      case "TXT":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Recent Documents</h2>
        <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All
        </a>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-32 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="flex space-x-2">
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents && documents.length > 0 ? (
            documents.map((document) => (
              <div key={document.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden document-card hover:shadow-md transition-shadow">
                {/* Document Preview Area */}
                <div className="h-32 bg-gray-100 relative p-3 flex items-center justify-center">
                  <span className="material-icons text-5xl text-gray-400">description</span>
                  <div className={`absolute top-2 right-2 ${getFileTypeColor(document.fileType)} text-xs px-2 py-1 rounded-full`}>
                    {document.fileType}
                  </div>
                </div>
                
                {/* Document Details */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-800 mb-1">{document.title}</h3>
                  <p className="text-gray-500 text-sm mb-2">
                    Last opened {formatDate(document.uploadedAt)}
                  </p>
                  
                  {/* Document Actions */}
                  <div className="flex items-center justify-between document-actions">
                    <div className="flex space-x-2">
                      <button 
                        className="p-1 rounded-full hover:bg-gray-100" 
                        title="View Document"
                        onClick={() => openDocumentViewer(document)}
                      >
                        <span className="material-icons text-gray-600 text-sm">visibility</span>
                      </button>
                      <button 
                        className="p-1 rounded-full hover:bg-gray-100" 
                        title="Summarize"
                        onClick={() => openDocumentViewer(document)}
                      >
                        <span className="material-icons text-gray-600 text-sm">summarize</span>
                      </button>
                      <button className="p-1 rounded-full hover:bg-gray-100" title="Download">
                        <span className="material-icons text-gray-600 text-sm">download</span>
                      </button>
                    </div>
                    <button className="p-1 rounded-full hover:bg-gray-100" title="More Options">
                      <span className="material-icons text-gray-600 text-sm">more_vert</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
              <div className="flex flex-col items-center">
                <span className="material-icons text-4xl mb-2">description</span>
                <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                <p className="mb-4">Upload your first document to get started</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentDocuments;
