import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";

interface SelectedFile {
  file: File;
  id: string;
}

const UploadModal: React.FC = () => {
  const { isUploadModalOpen, closeUploadModal, uploadDocument } = useApp();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => ({
        file,
        id: Math.random().toString(36).substring(2, 11)
      }));
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };
  
  const removeFile = (id: string) => {
    setSelectedFiles(selectedFiles.filter(file => file.id !== id));
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
        .filter(file => {
          const ext = file.name.split('.').pop()?.toLowerCase();
          return ext === 'pdf' || ext === 'docx' || ext === 'txt';
        })
        .map(file => ({
          file,
          id: Math.random().toString(36).substring(2, 11)
        }));
      
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };
  
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Upload each file
      for (const { file } of selectedFiles) {
        await uploadDocument(file);
      }
      
      // Reset and close modal
      setSelectedFiles([]);
      closeUploadModal();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload one or more files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Don't render anything if modal is not open
  if (!isUploadModalOpen) {
    return null;
  }
  
  // Otherwise render the modal
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-600 bg-opacity-50 flex">
      <div className="relative p-4 bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto my-20 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Upload Documents</h3>
          <button 
            className="text-gray-400 hover:text-gray-500" 
            onClick={closeUploadModal}
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="px-6 py-5 flex-grow">
          {/* File Drop Area */}
          <div 
            className={`border-2 border-dashed ${selectedFiles.length > 0 ? 'border-primary-500' : 'border-gray-300'} rounded-lg p-8 text-center mb-5 cursor-pointer hover:border-primary-500 transition-colors`} 
            onClick={openFileDialog}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <span className="material-icons text-4xl text-gray-400 mb-2">upload_file</span>
            <p className="text-gray-700 font-medium mb-1">Drag files here or click to upload</p>
            <p className="text-gray-500 text-sm">Supports PDF, DOCX, TXT (Max size: 20MB)</p>
            <input 
              type="file" 
              ref={fileInputRef}
              multiple 
              accept=".pdf,.docx,.txt" 
              className="hidden" 
              onChange={handleFileSelect}
            />
          </div>
          
          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Selected Files</h4>
              <ul className="divide-y divide-gray-200">
                {selectedFiles.map(({ file, id }) => (
                  <li key={id} className="py-3 flex items-center">
                    <span className="material-icons text-blue-600 mr-3">description</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => removeFile(id)}
                    >
                      <span className="material-icons">close</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-2 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            onClick={closeUploadModal}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <span className="mr-2">Uploading...</span>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
              </>
            ) : (
              'Upload'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;