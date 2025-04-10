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
  relatedDocuments: Document[];
  loadingRelatedDocuments: boolean;
  
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
  fetchRelatedDocuments: (documentId: number) => Promise<void>;
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
  const [relatedDocuments, setRelatedDocuments] = useState<Document[]>([]);
  const [loadingRelatedDocuments, setLoadingRelatedDocuments] = useState<boolean>(false);
  
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
      // Check if the API limit was exceeded during summarization
      if (data.apiLimitExceeded) {
        setApiLimitExceeded(true);
      }
    },
    onError: (error: any) => {
      // Check for API limit exceeded error in the error response
      if (error?.message?.includes('quota') || 
          error?.response?.data?.apiLimitExceeded) {
        setApiLimitExceeded(true);
      }
    }
  });
  
  const answerMutation = useMutation({
    mutationFn: async ({ query, documentIds }: { query: string, documentIds?: number[] }) => {
      const res = await apiRequest("POST", "/api/answer", { query, documentIds });
      return res.json();
    },
    onSuccess: (data) => {
      setAiAnswer(data.answer);
      // Check if the API limit was exceeded during answer generation
      if (data.apiLimitExceeded) {
        setApiLimitExceeded(true);
      }
    },
    onError: (error: any) => {
      // Check for API limit exceeded error in the error response
      if (error?.message?.includes('quota') || 
          error?.response?.data?.apiLimitExceeded) {
        setApiLimitExceeded(true);
      }
    }
  });
  
  // Action handlers
  const search = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setAiAnswer(null);
    // Reset API limit exceeded flag at the start of a new search
    setApiLimitExceeded(false);
    
    try {
      await searchMutation.mutateAsync(searchQuery);
      await generateAnswer(searchQuery);
    } catch (error) {
      console.error("Search error:", error);
      // Check if the error is related to API quota
      if (error instanceof Error && error.message.includes('quota')) {
        setApiLimitExceeded(true);
      }
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
    fetchRelatedDocuments(document.id);
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
    // Reset API limit exceeded flag at the start of a new summarization
    setApiLimitExceeded(false);
    await summarizeMutation.mutateAsync({ documentId, length: summaryLength });
  };
  
  const generateAnswer = async (query: string, documentIds?: number[]) => {
    // Reset API limit exceeded flag at the start of a new answer generation
    // We don't reset here during search operation as it's already reset in the search method
    if (!isSearching) {
      setApiLimitExceeded(false);
    }
    await answerMutation.mutateAsync({ query, documentIds });
  };
  
  const fetchRelatedDocuments = async (documentId: number) => {
    setLoadingRelatedDocuments(true);
    setRelatedDocuments([]);
    
    try {
      const response = await apiRequest("GET", `/api/documents/${documentId}/related`);
      const data = await response.json();
      setRelatedDocuments(data);
    } catch (error) {
      console.error("Error fetching related documents:", error);
      setRelatedDocuments([]);
    } finally {
      setLoadingRelatedDocuments(false);
    }
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
    relatedDocuments,
    loadingRelatedDocuments,
    
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
    fetchRelatedDocuments,
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
