import React from "react";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { SearchHistory } from "@/types";
import { useLocation } from "wouter";

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

const RecentSearches: React.FC = () => {
  const { setSearchQuery, search } = useApp();
  const [, setLocation] = useLocation();
  
  const { data: searchHistory, isLoading } = useQuery<SearchHistory[]>({ 
    queryKey: ["/api/search/history"],
  });
  
  const handleSearchClick = (query: string) => {
    setSearchQuery(query);
    search();
    setLocation("/search");
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Recent Searches</h2>
        <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View History
        </a>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border-b border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {searchHistory && searchHistory.length > 0 ? (
              searchHistory.map((search) => (
                <li key={search.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <a 
                    href="#" 
                    className="flex items-center"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSearchClick(search.query);
                    }}
                  >
                    <span className="material-icons text-gray-400 mr-3">history</span>
                    <div>
                      <p className="text-gray-800 font-medium">"{search.query}"</p>
                      <p className="text-gray-500 text-sm">
                        {search.results.length} results • {formatDate(search.timestamp)}
                      </p>
                    </div>
                    <span className="material-icons text-gray-400 ml-auto">chevron_right</span>
                  </a>
                </li>
              ))
            ) : (
              <li className="p-6 text-center text-gray-500">
                <span className="material-icons text-2xl mb-2">search</span>
                <p>No recent searches</p>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecentSearches;
