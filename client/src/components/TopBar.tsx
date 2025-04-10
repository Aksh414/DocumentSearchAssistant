import React from "react";
import { useApp } from "@/context/AppContext";
import SearchBar from "./SearchBar";

const TopBar: React.FC = () => {
  const { openUploadModal } = useApp();
  
  return (
    <header className="bg-white border-b border-gray-200 flex items-center justify-between p-4">
      {/* Search Bar */}
      <div className="max-w-xl w-full">
        <SearchBar />
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button 
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Notifications" 
          title="Notifications"
        >
          <span className="material-icons text-gray-600">notifications</span>
        </button>
        <button 
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Help" 
          title="Help & Resources"
        >
          <span className="material-icons text-gray-600">help_outline</span>
        </button>
        <button 
          className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          onClick={openUploadModal}
        >
          <span className="material-icons mr-1">upload_file</span>
          Upload
        </button>
      </div>
    </header>
  );
};

export default TopBar;
