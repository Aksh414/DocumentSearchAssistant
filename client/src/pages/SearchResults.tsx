import React, { useState } from "react";
import { useLocation } from "wouter";
import { useApp } from "@/context/AppContext";
import DocumentViewerModal from "@/components/DocumentViewerModal";

const SearchResults: React.FC = () => {
  const [, setLocation] = useLocation();
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    isSearching, 
    search, 
    openDocumentViewer,
    aiAnswer,
    apiLimitExceeded
  } = useApp();
  
  const [selectedFileType, setSelectedFileType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const handleBackToHome = () => {
    setLocation("/");
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };
  
  // Filter results by file type
  const filteredResults = selectedFileType === "all" 
    ? searchResults 
    : searchResults.filter(doc => doc.fileType.toLowerCase() === selectedFileType.toLowerCase());
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + itemsPerPage);
  
  const handleHighlight = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} className="bg-yellow-100">{part}</span> 
        : part
    );
  };
  
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Search Results Header */}
      <header className="bg-white border-b border-gray-200 flex items-center p-4 shadow-sm">
        <button 
          className="mr-3 p-1 rounded-full hover:bg-gray-100"
          onClick={handleBackToHome}
        >
          <span className="material-icons">arrow_back</span>
        </button>
        
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input 
                type="text" 
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons text-gray-400">search</span>
              </div>
            </div>
          </form>
        </div>
        
        <div className="ml-4 text-sm text-gray-500">
          <span>{filteredResults.length} results</span>
        </div>
      </header>
      
      {/* Search Results Content */}
      <div className="flex-1 overflow-auto">
        {/* Results Loading State */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mb-4"></div>
            <p>Searching documents...</p>
          </div>
        )}
        
        {/* Results Content */}
        {!isSearching && (
          <div className="p-6 max-w-5xl mx-auto">
            {/* API Limit Warning */}
            {apiLimitExceeded && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-5">
                <div className="flex items-start mb-3">
                  <span className="material-icons text-amber-600 mr-2">warning</span>
                  <h3 className="text-lg font-medium text-gray-800">AI Service Limited</h3>
                </div>
                
                <div className="text-gray-700">
                  <p className="mb-3">
                    The OpenAI API quota has been exceeded. The app is currently using fallback mechanisms for search, 
                    summarization, and answer generation. Results may be less accurate or comprehensive.
                  </p>
                  <p className="text-sm text-gray-500 mt-4">
                    This is a temporary limitation. Basic search functionality will continue to work.
                  </p>
                </div>
              </div>
            )}
            
            {/* AI Generated Answer */}
            {aiAnswer && (
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-start mb-3">
                  <span className="material-icons text-blue-600 mr-2">auto_awesome</span>
                  <h3 className="text-lg font-medium text-gray-800">AI-Generated Answer</h3>
                  {apiLimitExceeded && (
                    <span className="ml-3 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">Limited Mode</span>
                  )}
                </div>
                
                <div className="text-gray-700">
                  <p className="mb-3">{aiAnswer}</p>
                  <p className="text-sm text-gray-500 mt-4">
                    This answer was generated from documents in your collection.
                    {apiLimitExceeded && " Using simplified analysis due to API limitations."}
                  </p>
                </div>
              </div>
            )}
            
            {/* Search Results List */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Document Results</h3>
              
              {/* Results Filters */}
              <div className="flex items-center mb-4 space-x-2 text-sm">
                <span className="text-gray-500">Filter by:</span>
                <button 
                  className={`px-3 py-1 ${selectedFileType === "all" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} rounded-full`}
                  onClick={() => setSelectedFileType("all")}
                >
                  All
                </button>
                <button 
                  className={`px-3 py-1 ${selectedFileType === "pdf" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} rounded-full`}
                  onClick={() => setSelectedFileType("pdf")}
                >
                  PDF
                </button>
                <button 
                  className={`px-3 py-1 ${selectedFileType === "docx" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} rounded-full`}
                  onClick={() => setSelectedFileType("docx")}
                >
                  DOCX
                </button>
                <button 
                  className={`px-3 py-1 ${selectedFileType === "txt" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} rounded-full`}
                  onClick={() => setSelectedFileType("txt")}
                >
                  TXT
                </button>
              </div>
              
              {/* Results List */}
              {paginatedResults.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {paginatedResults.map((result) => (
                    <li key={result.id} className="py-4 hover:bg-gray-50 transition-colors rounded-lg p-3">
                      <div className="flex items-start mb-2">
                        <span className={`material-icons ${result.fileType === "PDF" ? "text-blue-600" : "text-indigo-600"} mr-2 mt-1`}>description</span>
                        <div>
                          <h4 
                            className="font-medium text-gray-800 hover:text-primary-600 cursor-pointer"
                            onClick={() => openDocumentViewer(result)}
                          >
                            {result.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {result.metadata.pageCount ? `Page 1 • ` : ""} 
                            {new Date(result.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="pl-8">
                        <p className="text-gray-700 text-sm mb-2">
                          {/* Show snippet if available, or fallback text */}
                          {result.snippet ? 
                            handleHighlight(result.snippet, searchQuery) : 
                            "Click to view document content..."}
                        </p>
                        
                        <div className="mt-3 flex items-center space-x-3">
                          <button 
                            className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                            onClick={() => openDocumentViewer(result)}
                          >
                            <span className="material-icons text-sm mr-1">visibility</span>
                            View
                          </button>
                          <button 
                            className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                            onClick={() => openDocumentViewer(result)}
                          >
                            <span className="material-icons text-sm mr-1">summarize</span>
                            Summarize
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-10">
                  <span className="material-icons text-4xl text-gray-400 mb-3">search_off</span>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">No results found</h3>
                  <p className="text-gray-500">Try adjusting your search terms or filters</p>
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredResults.length)} of {filteredResults.length} results
                  </div>
                  <div className="flex items-center space-x-1">
                    <button 
                      className="p-2 border border-gray-300 rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50"
                      onClick={() => setCurrentPage(prevPage => Math.max(prevPage - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <span className="material-icons text-sm">chevron_left</span>
                    </button>
                    
                    {Array.from({ length: Math.min(totalPages, 3) }).map((_, idx) => {
                      const pageNumber = idx + 1;
                      return (
                        <button 
                          key={idx}
                          className={`p-2 w-8 h-8 border ${currentPage === pageNumber ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} rounded-md flex items-center justify-center`}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button 
                      className="p-2 border border-gray-300 rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50"
                      onClick={() => setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="material-icons text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      <DocumentViewerModal />
    </div>
  );
};

export default SearchResults;
