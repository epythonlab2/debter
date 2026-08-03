// src/components/purchases/SearchableItemSelect.tsx
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useId,
} from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { ItemRecord } from '@/types/inventory';

export interface SearchableItemSelectProps {
  /** Array of available inventory item records to select from */
  items: ItemRecord[];
  /** The currently selected item ID */
  selectedItemId: string;
  /** Callback fired when an item option is selected */
  onSelect: (itemId: string) => void;
  /** Disables interaction with the control */
  disabled?: boolean;
  /** Dictionary map for localized UI text strings */
  t?: Record<string, string>;
}

/**
 * Custom searchable dropdown component for inventory item selection.
 * Fully optimized with keyboard navigation, accessibility attributes, and memoized searching.
 */
export const SearchableItemSelect = React.memo(function SearchableItemSelect({
  items,
  selectedItemId,
  onSelect,
  disabled = false,
  t,
}: SearchableItemSelectProps) {
  // Accessibility ID generation
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const labelId = `${baseId}-label`;

  // UI & Selection States
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // DOM References
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  /* Compute selected item object dynamically */
  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId),
    [items, selectedItemId]
  );

  /* Memoized list filtering by search query */
  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      item.item_name.toLowerCase().includes(query)
    );
  }, [items, searchTerm]);

  /* Reset search filter and index highlighting whenever dropdown closes */
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  /* Synchronize highlighted item on keyboard navigation */
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [isOpen, highlightedIndex]);

  /* Close dropdown when clicking outside component boundaries */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /* Select item handler */
  const handleSelectItem = useCallback(
    (itemId: string) => {
      onSelect(itemId);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onSelect]
  );

  /* Keyboard Navigation Handler */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
          handleSelectItem(filteredItems[highlightedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
    }
  };

  /* Helper method for safe template translations */
  const getNoMatchText = (term: string) => {
    if (t?.noItemsMatch) {
      return t.noItemsMatch.replace('{searchTerm}', term);
    }
    return `No items match "${term}"`;
  };

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={labelId}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between text-xs px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white focus:outline-none focus:border-[#1a5fb4] focus:ring-1 focus:ring-[#1a5fb4] disabled:opacity-50 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
      >
        <span className="truncate text-left font-medium">
          {selectedItem ? (
            <span>
              {selectedItem.item_name}{' '}
              <span className="text-slate-400 font-normal">
                ({t?.stock || 'Stock'}: {selectedItem.quantity})
              </span>
            </span>
          ) : (
            <span className="text-slate-400">
              {t?.selectOrSearchItem || '-- Select or Search Item --'}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[60] left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden font-sans">
          {/* Search Box Input */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              placeholder={t?.searchItemPlaceholder || 'Search item...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="w-full text-xs bg-transparent dark:text-white focus:outline-none"
              autoFocus
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-controls={listboxId}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search query"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1 focus:outline-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Dynamic Options List */}
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            className="max-h-48 overflow-y-auto py-1 divide-y divide-slate-50 dark:divide-slate-800/50"
          >
            {filteredItems.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                {getNoMatchText(searchTerm)}
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = item.id === selectedItemId;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      optionsRef.current[idx] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectItem(item.id)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors focus:outline-none ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-[#1a5fb4] dark:text-blue-400 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="block truncate">{item.item_name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {t?.availableStock || 'Available'}: {item.quantity}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 shrink-0 text-[#1a5fb4]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
});