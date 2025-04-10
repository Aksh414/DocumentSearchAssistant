import React from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import DashboardOverview from "@/components/DashboardOverview";
import RecentDocuments from "@/components/RecentDocuments";
import RecentSearches from "@/components/RecentSearches";
import UploadModal from "@/components/UploadModal";
import DocumentViewerModal from "@/components/DocumentViewerModal";

const Home: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <TopBar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Dashboard Overview */}
          <DashboardOverview />
          
          {/* Recent Documents */}
          <RecentDocuments />
          
          {/* Recent Searches */}
          <RecentSearches />
        </main>
      </div>
      
      {/* Modals */}
      <UploadModal />
      <DocumentViewerModal />
    </div>
  );
};

export default Home;
