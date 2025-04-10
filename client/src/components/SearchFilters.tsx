import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

interface SearchFiltersProps {
  isOpen: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ isOpen }) => {
  const [dateFilter, setDateFilter] = useState<string>('any');
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string>('relevance');

  // File type options
  const fileTypes = [
    { id: 'pdf', label: 'PDF' },
    { id: 'docx', label: 'Word (DOCX)' },
    { id: 'ppt', label: 'PowerPoint (PPT)' },
    { id: 'txt', label: 'Text (TXT)' },
  ];

  // Date range options
  const dateOptions = [
    { id: 'any', label: 'Any time' },
    { id: 'day', label: 'Past 24 hours' },
    { id: 'week', label: 'Past week' },
    { id: 'month', label: 'Past month' },
    { id: 'year', label: 'Past year' },
    { id: 'custom', label: 'Custom range' },
  ];

  // Toggle file type selection
  const toggleFileType = (fileType: string) => {
    setFileTypeFilter(prev => 
      prev.includes(fileType)
        ? prev.filter(type => type !== fileType)
        : [...prev, fileType]
    );
  };

  // Reset filters
  const resetFilters = () => {
    setDateFilter('any');
    setFileTypeFilter([]);
    setSortOrder('relevance');
  };

  // Apply filters
  const applyFilters = () => {
    // In a real application, this would dispatch the filters to the search state
    console.log('Applying filters:', {
      dateFilter,
      fileTypeFilter,
      sortOrder
    });
    
    // For MVP, this feature is UI-only
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-5 w-full">
      <div className="mb-5">
        <h3 className="text-md font-medium text-gray-900 mb-3">Date</h3>
        <div className="space-y-2">
          {dateOptions.map(option => (
            <div key={option.id} className="flex items-center">
              <input
                id={`date-${option.id}`}
                type="radio"
                name="date-filter"
                value={option.id}
                checked={dateFilter === option.id}
                onChange={() => setDateFilter(option.id)}
                className="h-4 w-4 text-primary-600 border-gray-300"
              />
              <label htmlFor={`date-${option.id}`} className="ml-2 text-sm text-gray-700">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-md font-medium text-gray-900 mb-3">File Type</h3>
        <div className="space-y-2">
          {fileTypes.map(type => (
            <div key={type.id} className="flex items-center">
              <input
                id={`filetype-${type.id}`}
                type="checkbox"
                checked={fileTypeFilter.includes(type.id)}
                onChange={() => toggleFileType(type.id)}
                className="h-4 w-4 text-primary-600 rounded border-gray-300"
              />
              <label htmlFor={`filetype-${type.id}`} className="ml-2 text-sm text-gray-700">
                {type.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-md font-medium text-gray-900 mb-3">Sort By</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              id="sort-relevance"
              type="radio"
              name="sort-order"
              value="relevance"
              checked={sortOrder === 'relevance'}
              onChange={() => setSortOrder('relevance')}
              className="h-4 w-4 text-primary-600 border-gray-300"
            />
            <label htmlFor="sort-relevance" className="ml-2 text-sm text-gray-700">
              Relevance
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="sort-date"
              type="radio"
              name="sort-order"
              value="date"
              checked={sortOrder === 'date'}
              onChange={() => setSortOrder('date')}
              className="h-4 w-4 text-primary-600 border-gray-300"
            />
            <label htmlFor="sort-date" className="ml-2 text-sm text-gray-700">
              Date (newest first)
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          onClick={resetFilters}
        >
          Reset
        </button>
        <button
          className="px-4 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-md transition-colors"
          onClick={applyFilters}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;