import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";
import SearchFilters from "./SearchFilters";

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, search } = useApp();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search();
      setLocation("/search");
    }
  };
  
  const toggleAdvancedSearch = () => {
    setIsAdvancedOpen(!isAdvancedOpen);
  };
  
  return (
    <div>
      <div className="relative">
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
            placeholder="Search documents using natural language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-icons text-gray-400">search</span>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button 
              type="button"
              className="pr-3 flex items-center text-gray-500 hover:text-gray-700" 
              onClick={toggleAdvancedSearch}
              aria-label="Toggle advanced search"
              title="Advanced Filters"
            >
              <span className="material-icons">tune</span>
            </button>
            <button 
              type="submit"
              className="pr-3 flex items-center text-primary-600 hover:text-primary-800"
              aria-label="Search"
              title="Search"
            >
              <span className="material-icons">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
      
      {/* Enhanced Advanced Search Options */}
      <div className="mt-2 relative z-10">
        <SearchFilters isOpen={isAdvancedOpen} />
      </div>
    </div>
  );
};

export default SearchBar;
