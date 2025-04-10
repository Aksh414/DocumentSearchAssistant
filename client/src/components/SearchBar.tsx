import React, { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { useLocation } from "wouter";

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, search } = useApp();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [fileType, setFileType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
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
  
  const applyAdvancedSearch = () => {
    search();
    setIsAdvancedOpen(false);
    setLocation("/search");
  };
  
  return (
    <div>
      <div className="relative">
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
            placeholder="Search documents using natural language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-icons text-gray-400">search</span>
          </div>
          <button 
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700" 
            onClick={toggleAdvancedSearch}
          >
            <span className="material-icons">tune</span>
          </button>
        </form>
      </div>
      
      {/* Advanced Search Options */}
      {isAdvancedOpen && (
        <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="txt">TXT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">Any Time</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="year">Past Year</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <button 
              className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={applyAdvancedSearch}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
