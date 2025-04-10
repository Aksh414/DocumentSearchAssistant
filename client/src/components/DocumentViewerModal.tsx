import React, { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Dialog } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";

const DocumentViewerModal: React.FC = () => {
  const { 
    isDocumentViewerOpen, 
    closeDocumentViewer, 
    selectedDocument, 
    documentSummary,
    summaryLength,
    setSummaryLength,
    apiLimitExceeded,
    relatedDocuments,
    loadingRelatedDocuments,
    openDocumentViewer
  } = useApp();
  
  if (!selectedDocument) {
    return null;
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <Dialog open={isDocumentViewerOpen} onOpenChange={closeDocumentViewer}>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 mx-4 flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <span className="material-icons text-gray-500 mr-2">description</span>
              <h3 className="text-lg font-medium text-gray-900">{selectedDocument.title}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Download">
                <span className="material-icons">download</span>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Print">
                <span className="material-icons">print</span>
              </button>
              <button 
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500" 
                onClick={closeDocumentViewer}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
          </div>
          
          {/* Document Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Document Display */}
            <div className="flex-1 overflow-auto p-6 bg-gray-100">
              {/* Placeholder for document content */}
              <div className="bg-white shadow-sm rounded-lg p-8 mx-auto max-w-4xl min-h-full">
                <h1 className="text-2xl font-bold mb-6">
                  {selectedDocument.title.split('.')[0]}
                </h1>
                
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
                  
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5 mb-8"></div>
                  
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                </div>
                
                <p className="text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
                  Page 1 of {selectedDocument.metadata.pageCount || 1}
                </p>
              </div>
            </div>
            
            {/* Right Sidebar - Document Insights */}
            <div className="w-80 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Document Insights</h4>
                <div className="flex text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <span className="material-icons text-gray-400 text-sm mr-1">calendar_today</span>
                    <span>{formatDate(selectedDocument.uploadedAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="material-icons text-gray-400 text-sm mr-1">description</span>
                    <span>{selectedDocument.metadata.pageCount || 1} pages</span>
                  </div>
                </div>
              </div>
              
              {/* Document Summary */}
              <div className="p-4 border-b border-gray-200 flex-1 overflow-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-800">Summary</h4>
                    {apiLimitExceeded && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">Limited Mode</span>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Length:</span>
                    <select 
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                      value={summaryLength}
                      onChange={(e) => setSummaryLength(e.target.value as any)}
                    >
                      <option value="brief">Brief</option>
                      <option value="medium">Medium</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>
                </div>
                
                {apiLimitExceeded && (
                  <div className="mb-4 py-2 px-3 bg-amber-50 border border-amber-100 rounded-md text-xs text-amber-800">
                    <div className="flex items-center mb-1">
                      <span className="material-icons text-amber-600 mr-1 text-sm">info</span>
                      <span className="font-medium">AI Service Limited</span>
                    </div>
                    <p>Using simplified summarization due to API limits. Results may be less precise.</p>
                  </div>
                )}
                
                {documentSummary ? (
                  <>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p>{documentSummary.summary}</p>
                    </div>
                    
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-800 mb-2 text-sm">Key Points</h5>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {documentSummary.keyPoints.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600 mb-2"></div>
                    <p className="text-sm">Generating summary...</p>
                  </div>
                )}
              </div>
              
              {/* Related Documents */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">Related Documents</h4>
                  {apiLimitExceeded && (
                    <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">Limited Mode</span>
                  )}
                </div>
                
                {loadingRelatedDocuments ? (
                  <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600 mb-2"></div>
                    <p className="text-xs">Finding related content...</p>
                  </div>
                ) : relatedDocuments.length > 0 ? (
                  <ul className="space-y-3">
                    {relatedDocuments.map(doc => (
                      <li key={doc.id}>
                        <button 
                          onClick={() => openDocumentViewer(doc)}
                          className="flex items-center text-sm hover:bg-gray-50 p-2 rounded w-full text-left"
                        >
                          <span className="material-icons text-gray-400 text-sm mr-2">description</span>
                          <span className="text-gray-700">{doc.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-gray-500 py-4 text-sm">
                    <p>No related documents found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default DocumentViewerModal;
