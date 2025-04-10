import React from "react";
import { useLocation, Link } from "wouter";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { Document } from "@/types";

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { user } = useApp();
  
  const { data: recentDocuments } = useQuery<Document[]>({ 
    queryKey: ["/api/documents/recent"],
    queryFn: async () => {
      const res = await fetch("/api/documents/recent?limit=3");
      if (!res.ok) throw new Error("Failed to fetch recent documents");
      return res.json();
    }
  });

  return (
    <aside className="bg-white border-r border-gray-200 w-64 flex-shrink-0 flex flex-col h-full">
      {/* Logo and App Name */}
      <div className="p-4 flex items-center border-b border-gray-100">
        <div className="p-2 rounded-lg bg-primary-100 mr-3">
          <span className="material-icons text-primary-600">search</span>
        </div>
        <h1 className="font-bold text-xl text-gray-800">DocuSense</h1>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 pt-4 pb-4 overflow-y-auto">
        <ul>
          <li className="px-3 py-2">
            <Link href="/">
              <a className={`flex items-center px-3 py-2 rounded-lg ${location === "/" ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-100"} font-medium`}>
                <span className={`material-icons mr-3 ${location === "/" ? "text-primary-600" : "text-gray-500"}`}>home</span>
                Home
              </a>
            </Link>
          </li>
          <li className="px-3 py-2">
            <Link href="/documents">
              <a className={`flex items-center px-3 py-2 rounded-lg ${location === "/documents" ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-100"} font-medium`}>
                <span className={`material-icons mr-3 ${location === "/documents" ? "text-primary-600" : "text-gray-500"}`}>folder</span>
                My Documents
              </a>
            </Link>
          </li>
          <li className="px-3 py-2">
            <Link href="/search-history">
              <a className={`flex items-center px-3 py-2 rounded-lg ${location === "/search-history" ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-100"} font-medium`}>
                <span className={`material-icons mr-3 ${location === "/search-history" ? "text-primary-600" : "text-gray-500"}`}>history</span>
                Recent Searches
              </a>
            </Link>
          </li>
          <li className="px-3 py-2">
            <Link href="/saved">
              <a className={`flex items-center px-3 py-2 rounded-lg ${location === "/saved" ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-100"} font-medium`}>
                <span className={`material-icons mr-3 ${location === "/saved" ? "text-primary-600" : "text-gray-500"}`}>bookmark</span>
                Saved Results
              </a>
            </Link>
          </li>
          <li className="px-3 py-2 mt-2">
            <div className="border-t border-gray-200 pt-4 px-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recent Documents
              </h3>
            </div>
          </li>
          
          {recentDocuments?.slice(0, 3).map((doc) => (
            <li key={doc.id} className="px-3 py-1">
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  // Open document viewer for this document
                }}
                className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
              >
                <span className="material-icons mr-3 text-gray-500 text-sm">description</span>
                {doc.title}
              </a>
            </li>
          ))}
          
          {(!recentDocuments || recentDocuments.length === 0) && (
            <li className="px-6 py-3 text-sm text-gray-500">
              No recent documents
            </li>
          )}
        </ul>
      </nav>
      
      {/* User Profile Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="material-icons text-gray-600 text-sm">person</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.name || "Guest User"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || "guest@example.com"}</p>
          </div>
          <button className="ml-auto text-gray-500 hover:text-gray-700">
            <span className="material-icons">settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
