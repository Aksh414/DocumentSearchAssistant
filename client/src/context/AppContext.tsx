import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Document, SearchHistory, SearchResult, User, DocumentSummary } from "../types";

interface AppContextType {
  // State
  user: User | null;
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  selectedDocument: Document | null;
  isUploadModalOpen: boolean;
  isDocumentViewerOpen: boolean;
  documentSummary: DocumentSummary | null;
  summaryLength: "brief" | "medium" | "detailed";
  aiAnswer: string | null;
  apiLimitExceeded: boolean;
  
  // Actions
  setSearchQuery: (query: string) => void;
  search: () => Promise<void>;
  setSelectedDocument: (document: Document | null) => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openDocumentViewer: (document: Document) => void;
  closeDocumentViewer: () => void;
  uploadDocument: (file: File) => Promise<number>;
  summarizeDocument: (documentId: number) => Promise<void>;
  setSummaryLength: (length: "brief" | "medium" | "detailed") => void;
  generateAnswer: (query: string, documentIds?: number[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  
  // State
  const [user, setUser] = useState<User | null>({
    id: 1,
    username: "demo",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    role: "user",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [documentSummary, setDocumentSummary] = useState<DocumentSummary | null>(null);
  const [summaryLength, setSummaryLength] = useState<"brief" | "medium" | "detailed">("medium");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [apiLimitExceeded, setApiLimitExceeded] = useState<boolean>(false);
  
  // Queries
  const { data: recentDocuments } = useQuery<Document[]>({ 
    queryKey: ["/api/documents/recent"],
    staleTime: 1000 * 60 * 5,
  });
  
  const { data: searchHistory } = useQuery<SearchHistory[]>({
    queryKey: ["/api/search/history"],
    staleTime: 1000 * 60 * 5,
  });
  
  // Mutations
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }
      
      const data = await res.json();
      return data.documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/recent"] });
      setIsUploadModalOpen(false);
    },
  });
  
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest("POST", "/api/search", { query });
      return res.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/search/history"] });
    },
  });
  
  const summarizeMutation = useMutation({
    mutationFn: async ({ documentId, length }: { documentId: number, length: string }) => {
      const res = await apiRequest("POST", `/api/documents/${documentId}/summarize?length=${length}`, {});
      return res.json();
    },
    onSuccess: (data) => {
      setDocumentSummary(data);
    },
  });
  
  const answerMutation = useMutation({
    mutationFn: async ({ query, documentIds }: { query: string, documentIds?: number[] }) => {
      const res = await apiRequest("POST", "/api/answer", { query, documentIds });
      return res.json();
    },
    onSuccess: (data) => {
      setAiAnswer(data.answer);
    },
  });
  
  // Action handlers
  const search = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setAiAnswer(null);
    
    try {
      await searchMutation.mutateAsync(searchQuery);
      await generateAnswer(searchQuery);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);
  
  const openDocumentViewer = (document: Document) => {
    setSelectedDocument(document);
    setIsDocumentViewerOpen(true);
    summarizeDocument(document.id);
  };
  
  const closeDocumentViewer = () => {
    setIsDocumentViewerOpen(false);
    setSelectedDocument(null);
    setDocumentSummary(null);
  };
  
  const uploadDocument = async (file: File) => {
    return await uploadMutation.mutateAsync(file);
  };
  
  const summarizeDocument = async (documentId: number) => {
    await summarizeMutation.mutateAsync({ documentId, length: summaryLength });
  };
  
  const generateAnswer = async (query: string, documentIds?: number[]) => {
    await answerMutation.mutateAsync({ query, documentIds });
  };
  
  // If the summary length changes and we have a selected document, regenerate the summary
  useEffect(() => {
    if (selectedDocument && isDocumentViewerOpen) {
      summarizeDocument(selectedDocument.id);
    }
  }, [summaryLength]);
  
  const contextValue: AppContextType = {
    user,
    searchQuery,
    searchResults,
    isSearching,
    selectedDocument,
    isUploadModalOpen,
    isDocumentViewerOpen,
    documentSummary,
    summaryLength,
    aiAnswer,
    apiLimitExceeded,
    
    setSearchQuery,
    search,
    setSelectedDocument,
    openUploadModal,
    closeUploadModal,
    openDocumentViewer,
    closeDocumentViewer,
    uploadDocument,
    summarizeDocument,
    setSummaryLength,
    generateAnswer,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
