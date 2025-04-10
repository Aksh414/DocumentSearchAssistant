import React from "react";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@/types";

const DashboardOverview: React.FC = () => {
  const { setSearchQuery, search } = useApp();
  
  const { data: documents } = useQuery<Document[]>({ 
    queryKey: ["/api/documents"],
  });
  
  const { data: searchHistory } = useQuery<any[]>({ 
    queryKey: ["/api/search/history"],
  });
  
  // Sample search suggestions
  const suggestions = [
    "Financial reporting for Q3",
    "Marketing strategy key points",
    "Product roadmap timeline",
    "Team meeting minutes"
  ];
  
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    search();
  };
  
  const totalDocuments = documents?.length || 0;
  const searchesCount = searchHistory?.length || 0;
  const documentsAddedToday = documents?.filter(
    doc => new Date(doc.uploadedAt).toDateString() === new Date().toDateString()
  ).length || 0;
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome back, Sarah</h2>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="material-icons">folder</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Documents</p>
              <p className="text-2xl font-semibold text-gray-800">{totalDocuments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="material-icons">search</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Searches</p>
              <p className="text-2xl font-semibold text-gray-800">{searchesCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="material-icons">history</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Documents Added</p>
              <p className="text-2xl font-semibold text-gray-800">
                {documentsAddedToday} today
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Try These Searches Section */}
      <div className="mb-6 bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Try these searches:</h3>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button 
              key={index}
              className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              "{suggestion}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
