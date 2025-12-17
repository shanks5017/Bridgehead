import React, { useState, useRef, useEffect } from 'react';
import { filterCategories, getCategoryIcon } from '../constants/categories';

interface CategoryAutocompleteProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    categories: readonly string[];
    placeholder?: string;
    required?: boolean;
}

const CategoryAutocomplete: React.FC<CategoryAutocompleteProps> = ({
    label,
    value,
    onChange,
    categories,
    placeholder = "Start typing to see suggestions...",
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const suggestions = filterCategories(categories, value);
    const showDropdown = isOpen && suggestions.length > 0 && value.trim().length > 0;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setIsOpen(true);
        setHighlightedIndex(0);
    };

    const handleSelectCategory = (category: string) => {
        onChange(category);
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (suggestions[highlightedIndex]) {
                    handleSelectCategory(suggestions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    return (
        <div className="w-full space-y-2 relative">
            <label className="block text-sm font-medium">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                required={required}
                className="w-full bg-transparent border-2 border-[--border-color] rounded-lg px-4 py-3 placeholder-[--text-secondary] focus:outline-none focus:ring-2 focus:ring-[--primary-color] focus:border-transparent transition-all duration-300"
            />

            {/* Autocomplete Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-[--card-color] border-2 border-[--border-color] rounded-lg shadow-xl max-h-64 overflow-y-auto"
                >
                    {suggestions.map((category, index) => (
                        <div
                            key={category}
                            onClick={() => handleSelectCategory(category)}
                            className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 ${index === highlightedIndex
                                    ? 'bg-[--primary-color] text-white'
                                    : 'hover:bg-white/5'
                                }`}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <span className="text-xl">{getCategoryIcon(category)}</span>
                            <span className="font-medium">{category}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Helper text */}
            {!showDropdown && value.trim().length > 0 && suggestions.length === 0 && (
                <p className="text-xs text-yellow-400">
                    No exact match found. You can still use custom category "{value}"
                </p>
            )}
        </div>
    );
};

export default CategoryAutocomplete;
