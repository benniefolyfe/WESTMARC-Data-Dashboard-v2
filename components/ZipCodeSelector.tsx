
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from './icons';

interface ZipCodeSelectorProps {
  zipCodes: { zip: string; city: string }[];
  selectedZips: string[];
  onZipChange: (zips: string[]) => void;
}

const ZipCodeSelector: React.FC<ZipCodeSelectorProps> = ({
  zipCodes,
  selectedZips,
  onZipChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const groupedZips = useMemo(() => {
    return zipCodes.reduce((acc, { zip, city }) => {
      if (!acc[city]) {
        acc[city] = [];
      }
      acc[city].push(zip);
      // Sort zips numerically within each city
      acc[city].sort((a, b) => parseInt(a) - parseInt(b));
      return acc;
    }, {} as Record<string, string[]>);
  }, [zipCodes]);
  
  const sortedCities = useMemo(() => Object.keys(groupedZips).sort(), [groupedZips]);

  const handleCityToggle = (city: string) => {
    const cityZips = groupedZips[city];
    const allCityZipsSelected = cityZips.every(zip => selectedZips.includes(zip));
    const currentSelection = new Set(selectedZips);

    if (allCityZipsSelected) {
      // Deselect all zips for this city
      cityZips.forEach(zip => currentSelection.delete(zip));
    } else {
      // Select all zips for this city
      cityZips.forEach(zip => currentSelection.add(zip));
    }
    onZipChange(Array.from(currentSelection));
  };
  
  const handleZipToggle = (zipToToggle: string) => {
    const currentSelection = new Set(selectedZips);
    if (currentSelection.has(zipToToggle)) {
      currentSelection.delete(zipToToggle);
    } else {
      currentSelection.add(zipToToggle);
    }
    onZipChange(Array.from(currentSelection));
  };
  
  const toggleCityExpansion = (city: string) => {
    setExpandedCities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(city)) {
        newSet.delete(city);
      } else {
        newSet.add(city);
      }
      return newSet;
    });
  };

  const selectionText = selectedZips.length === 0 
    ? "Select cities or zip codes"
    : selectedZips.length === 1
    ? `${selectedZips[0]}`
    : `${selectedZips.length} zips selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          relative 
          w-full 
          bg-white 
          border 
          border-westmarc-light-gray 
          rounded-lg 
          shadow-sm 
          pl-3 
          pr-10 
          py-3 
          text-left 
          cursor-default 
          focus:outline-none 
          focus:ring-2 
          focus:ring-westmarc-polaris text-base
        "
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate text-westmarc-midnight">{selectionText}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          <ul>
            {sortedCities.map(city => {
              const cityZips = groupedZips[city];
              const selectedCount = cityZips.filter(zip => selectedZips.includes(zip)).length;
              const allSelected = selectedCount === cityZips.length;
              const isIndeterminate = selectedCount > 0 && selectedCount < cityZips.length;

              return (
                <li key={city} className="text-westmarc-desert-night select-none">
                  <div className="flex items-center hover:bg-westmarc-light-gray">
                    <div className="pl-3 pr-2 py-2 cursor-pointer" onClick={() => toggleCityExpansion(city)}>
                      {expandedCities.has(city) ? <ChevronDownIcon className="h-4 w-4"/> : <ChevronRightIcon className="h-4 w-4"/>}
                    </div>
                    <label className="flex-grow flex items-center cursor-pointer py-2 pr-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-westmarc-polaris focus:ring-westmarc-saguaro"
                        checked={allSelected}
                        // FIX: The ref callback was implicitly returning a boolean, which is not a valid return type for a ref callback.
                        // The logic is now wrapped in a block to ensure it returns void.
                        ref={el => {
                          if (el) {
                            el.indeterminate = isIndeterminate;
                          }
                        }}
                        onChange={() => handleCityToggle(city)}
                      />
                      <span className="ml-3 font-bold">{city}</span>
                    </label>
                  </div>
                  {expandedCities.has(city) && (
                    <ul>
                      {cityZips.map(zip => (
                        <li key={zip} className="hover:bg-westmarc-light-gray/50">
                          <label className="flex items-center cursor-pointer py-2 pl-12 w-full">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-westmarc-polaris focus:ring-westmarc-saguaro"
                              checked={selectedZips.includes(zip)}
                              onChange={() => handleZipToggle(zip)}
                            />
                            <span className="ml-3 text-sm font-light">{zip}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ZipCodeSelector;
