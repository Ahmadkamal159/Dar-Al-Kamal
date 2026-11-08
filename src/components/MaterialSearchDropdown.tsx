/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getClosestMatches, SearchableItem } from '../utils/closestMatchSearch';

export interface MaterialOption extends SearchableItem {
  id: number;
  nameEn: string;
  nameAr: string;
  chemicalName?: string;
  cas?: string;
  pyramidNote?: string;
  family?: string;
  pricePerGram?: number;
  [key: string]: any;
}

interface MaterialSearchDropdownProps {
  materials: MaterialOption[];
  selectedId?: number | string;
  onSelect: (material: MaterialOption) => void;
  placeholder?: string;
  className?: string;
  accentColor?: 'amber' | 'sky' | 'emerald';
  disabled?: boolean;
  showDetails?: boolean;
}

export const MaterialSearchDropdown: React.FC<MaterialSearchDropdownProps> = ({
  materials,
  selectedId,
  onSelect,
  placeholder,
  className = '',
  accentColor = 'amber',
  disabled = false,
  showDetails = true,
}) => {
  const { language, isRtl } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  const selectedMaterial = useMemo(() => {
    return materials.find(m => String(m.id) === String(selectedId) || m.nameEn === selectedId);
  }, [materials, selectedId]);

  // Compute matches ranked by closest match algorithm
  const matches = useMemo(() => {
    return getClosestMatches(materials, searchQuery);
  }, [materials, searchQuery]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 360; // Approximate max menu height
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const width = Math.max(rect.width, 320);
    // Align left, but ensure it doesn't overflow right edge of viewport
    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }

    const top = placeAbove
      ? Math.max(10, rect.top - dropdownHeight - 4)
      : rect.bottom + 4;

    setCoords({
      top,
      left,
      width,
      placeAbove,
    });
  }, []);

  const openDropdown = () => {
    if (disabled) return;
    updatePosition();
    setIsOpen(true);
    setSearchQuery('');
    setHighlightedIndex(0);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        !target.closest('.material-dropdown-portal')
      ) {
        closeDropdown();
      }
    };

    const handleWindowChange = () => {
      updatePosition();
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isOpen, updatePosition]);

  // Keep highlighted item visible
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeElement = listRef.current.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (item: MaterialOption) => {
    onSelect(item);
    closeDropdown();
  };

  const borderFocusClasses = {
    amber: 'focus:border-amber-500 border-stone-700 hover:border-amber-500/60',
    sky: 'focus:border-sky-500 border-stone-700 hover:border-sky-500/60',
    emerald: 'focus:border-emerald-500 border-stone-700 hover:border-emerald-500/60',
  }[accentColor];

  const badgeBgClasses = {
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    sky: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  }[accentColor];

  return (
    <div className={`relative ${className}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={isOpen ? closeDropdown : openDropdown}
        className={`w-full bg-stone-950 border ${borderFocusClasses} rounded-xl px-3 py-2 text-xs text-left flex items-center justify-between gap-2 transition-all shadow-sm outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-stone-900/80'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 overflow-hidden truncate">
          {selectedMaterial ? (
            <>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${badgeBgClasses}`}>
                #{selectedMaterial.id}
              </span>
              <span className="font-bold text-stone-100 truncate">
                {language === 'ar' ? selectedMaterial.nameAr : selectedMaterial.nameEn}
              </span>
              <span className="text-stone-400 font-normal text-[11px] truncate">
                ({language === 'ar' ? selectedMaterial.nameEn : selectedMaterial.nameAr})
              </span>
              {selectedMaterial.pyramidNote && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 border border-stone-700 shrink-0">
                  {selectedMaterial.pyramidNote}
                </span>
              )}
            </>
          ) : (
            <span className="text-stone-400">
              {placeholder || (language === 'ar' ? 'اختر مادة عطرية أو اكتب للبحث...' : 'Select or type material name...')}
            </span>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Dropdown Portal */}
      {isOpen &&
        createPortal(
          <div
            className="material-dropdown-portal fixed z-[99999] bg-stone-950 border border-stone-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col text-xs text-stone-200 animate-fadeIn"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: '360px',
            }}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Search Input Bar */}
            <div className="p-2.5 border-b border-stone-800 bg-stone-900/90 flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex(prev => Math.min(prev + 1, matches.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex(prev => Math.max(prev - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (matches[highlightedIndex]) {
                      handleSelect(matches[highlightedIndex]);
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    closeDropdown();
                  }
                }}
                placeholder={
                  language === 'ar'
                    ? 'اكتب حرف أو اسم المادة (مثال: A، aldehide، labdanum، brasile)...'
                    : 'Type a letter or name (e.g., A, aldehide, labdanum, brasile)...'
                }
                className="w-full bg-stone-950/80 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-500 outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setHighlightedIndex(0);
                    inputRef.current?.focus();
                  }}
                  className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Match Count Info */}
            <div className="px-3 py-1 bg-stone-900/40 border-b border-stone-800/60 text-[10px] text-stone-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>
                  {searchQuery
                    ? (language === 'ar' ? `نتائج أقرب مطابقة (${matches.length})` : `Closest matches (${matches.length})`)
                    : (language === 'ar' ? `كل المواد (${materials.length}) مرتبة أبجدياً` : `All materials (${materials.length}) alphabetically`)}
                </span>
              </span>
              <span className="text-[9px] font-mono text-stone-500">
                {language === 'ar' ? 'استخدم الأسهم و Enter' : 'Arrow keys + Enter'}
              </span>
            </div>

            {/* Options List */}
            <div ref={listRef} className="overflow-y-auto divide-y divide-stone-800/40 max-h-[280px]">
              {matches.length === 0 ? (
                <div className="p-6 text-center text-stone-400 text-xs">
                  <p className="font-semibold text-stone-300 mb-1">
                    {language === 'ar' ? 'لم يتم العثور على مادة مطابقة' : 'No matching materials found'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {language === 'ar' ? 'جرب البحث برقم الـ CAS أو باسم آخر' : 'Try searching by CAS or another keyword'}
                  </p>
                </div>
              ) : (
                matches.map((item, index) => {
                  const isSelected = String(item.id) === String(selectedId) || item.nameEn === selectedId;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <div
                      key={item.id}
                      data-index={index}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                        isHighlighted
                          ? 'bg-amber-500/15 text-stone-100'
                          : isSelected
                          ? 'bg-stone-900 text-amber-300'
                          : 'hover:bg-stone-900/60 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-900 border border-stone-800 text-amber-400 shrink-0">
                          #{item.id}
                        </span>

                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-100 text-xs truncate">
                              {language === 'ar' ? item.nameAr : item.nameEn}
                            </span>
                            <span className="text-stone-400 text-[11px] truncate">
                              ({language === 'ar' ? item.nameEn : item.nameAr})
                            </span>
                          </div>

                          {showDetails && (
                            <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5 font-mono">
                              {item.chemicalName && (
                                <span className="truncate max-w-[200px]" title={item.chemicalName}>
                                  {item.chemicalName}
                                </span>
                              )}
                              {item.cas && (
                                <span className="text-stone-500">CAS: {item.cas}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.pyramidNote && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              item.pyramidNote === 'Top' || item.pyramidNote === 'Top-Heart'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : item.pyramidNote === 'Heart' || item.pyramidNote === 'Heart-Base'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {item.pyramidNote}
                          </span>
                        )}

                        {item.pricePerGram !== undefined && (
                          <span className="text-[11px] font-mono text-stone-400">
                            {item.pricePerGram} {language === 'ar' ? 'ج/ج' : 'EGP'}
                          </span>
                        )}

                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
