'use client';

import { useState, useEffect, useRef, KeyboardEvent, useId, useCallback } from 'react';
import { useDebounce } from '@/hooks/advanced/use-debounce';

export interface AsyncSelectOption<T = any> {
  value: string;
  label: string;
  data?: T;
}

export interface AsyncSelectProps<T = any> {
  /** Function to load options based on search query */
  loadOptions: (query: string) => Promise<AsyncSelectOption<T>[]>;

  /** Callback when option is selected */
  onSelect: (option: AsyncSelectOption<T>) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Debounce delay in milliseconds */
  debounceMs?: number;

  /** Minimum search length before triggering search */
  minSearchLength?: number;

  /** Show loading state */
  loading?: boolean;

  /** Error message */
  error?: string;

  /** Allow clearing selection */
  clearable?: boolean;

  /** Custom class name */
  className?: string;

  /** Selected value */
  value?: AsyncSelectOption<T> | null;

  /** Disabled state */
  disabled?: boolean;

  /** Custom empty message */
  emptyMessage?: string;

  /** Maximum number of options to display */
  maxOptions?: number;
}

/**
 * Searchable select component with async data loading
 *
 * @example
 * ```tsx
 * <AsyncSelect
 *   loadOptions={async (query) => {
 *     const users = await searchUsers(query);
 *     return users.map(u => ({ value: u.id, label: u.name, data: u }));
 *   }}
 *   onSelect={(option) => setSelectedUser(option.data)}
 *   placeholder="Search users..."
 *   debounceMs={300}
 *   minSearchLength={2}
 * />
 * ```
 */
export function AsyncSelect<T = any>({
  loadOptions,
  onSelect,
  placeholder = 'Search...',
  debounceMs = 300,
  minSearchLength = 1,
  loading: externalLoading = false,
  error,
  clearable = true,
  className = '',
  value,
  disabled = false,
  emptyMessage = 'No results found',
  maxOptions = 50,
}: AsyncSelectProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AsyncSelectOption<T>[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, debounceMs);

  // Load options when debounced search changes
  useEffect(() => {
    if (debouncedSearch.length < minSearchLength) {
      setOptions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchOptions = async () => {
      setLoading(true);

      try {
        const results = await loadOptions(debouncedSearch);

        if (!cancelled) {
          setOptions(results.slice(0, maxOptions));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setOptions([]);
          setLoading(false);
        }
      }
    };

    fetchOptions();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, loadOptions, minSearchLength, maxOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle option selection
  const handleSelect = useCallback((option: AsyncSelectOption<T>) => {
    onSelect(option);
    setSearchQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onSelect]);

  // Handle clear
  const handleClear = useCallback(() => {
    setSearchQuery('');
    setOptions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (clearable && value) {
      // Type assertion needed for clearable select behavior
      onSelect(undefined as unknown as AsyncSelectOption<T>);
    }
  }, [clearable, value, onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < options.length) {
          handleSelect(options[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;

      default:
        break;
    }
  };

  const showLoading = loading || externalLoading;
  const showOptions = isOpen && !showLoading && !error && options.length > 0;
  const showEmpty = isOpen && !showLoading && !error && options.length === 0 && debouncedSearch.length >= minSearchLength;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value ? value.label : searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          role="combobox"
        />

        {/* Clear/Loading indicator */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {showLoading && (
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}

          {!showLoading && clearable && (value || searchQuery) && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Clear selection"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {(showOptions || showEmpty || error) && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {/* Error */}
          {error && (
            <div className="px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="px-4 py-3 text-sm text-gray-500">
              {emptyMessage}
            </div>
          )}

          {/* Options */}
          {showOptions && options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
              className={`w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
