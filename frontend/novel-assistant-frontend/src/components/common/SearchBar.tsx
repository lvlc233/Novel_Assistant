import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  autoFocus?: boolean;
  className?: string;
  showButton?: boolean;
}

// 搜索栏组件，用于用户输入搜索查询
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  autoFocus = false,
  className = '',
  showButton = false,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={
            query ? (
              <button onClick={handleClear} className="hover:text-gray-600 cursor-pointer pointer-events-auto">
                <X className="h-4 w-4" />
              </button>
            ) : undefined
          }
          className="rounded-full shadow-sm hover:shadow-md transition-shadow"
        />
      </div>
      {showButton && (
        <Button onClick={() => onSearch(query)} className="rounded-full">
          Search
        </Button>
      )}
    </div>
  );
};

export default SearchBar;
