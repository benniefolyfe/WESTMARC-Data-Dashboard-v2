
import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { MetricId, MetricConfig } from '../metrics';
import { ChevronDownIcon, ChevronRightIcon } from './icons';
import { formatMetricSelection } from '../utils/formatting';

interface MetricSelectorProps {
  metrics: Record<MetricId, MetricConfig>;
  selectedMetricIds: MetricId[];
  onSelectionChange: (ids: MetricId[]) => void;
}

const MetricSelector: React.FC<MetricSelectorProps> = ({
  metrics,
  selectedMetricIds,
  onSelectionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIndustryExpanded, setIsIndustryExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { groupedMetrics, industryMetrics } = useMemo(() => {
    const grouped = Object.values(metrics)
      .reduce((acc: Record<string, MetricConfig[]>, metric: MetricConfig) => {
        if (!acc[metric.group]) {
          acc[metric.group] = [];
        }
        acc[metric.group].push(metric);
        return acc;
      }, {} as Record<string, MetricConfig[]>);

    const industries = (grouped['Economics & Labor'] || []).filter(m => m.id.startsWith('employmentByIndustry:'));
    if (grouped['Economics & Labor']) {
        grouped['Economics & Labor'] = grouped['Economics & Labor'].filter(m => !m.id.startsWith('employmentByIndustry:'));
    }

    return { groupedMetrics: grouped, industryMetrics: industries };
  }, [metrics]);
  
  const handleMetricToggle = (metricId: MetricId) => {
    const newSelection = new Set(selectedMetricIds);
    if (newSelection.has(metricId)) {
        newSelection.delete(metricId);
    } else {
        newSelection.add(metricId);
    }
    onSelectionChange(Array.from(newSelection));
  };

  const handleGroupToggle = (metricsInGroup: MetricConfig[]) => {
      const groupMetricIds = metricsInGroup.map(m => m.id);
      const allSelected = groupMetricIds.every(id => selectedMetricIds.includes(id));
      const currentSelection = new Set(selectedMetricIds);

      if (allSelected) {
          groupMetricIds.forEach(id => currentSelection.delete(id));
      } else {
          groupMetricIds.forEach(id => currentSelection.add(id));
      }
      onSelectionChange(Array.from(currentSelection));
  }

  const selectionLabel = useMemo(() => {
    return formatMetricSelection(selectedMetricIds, metrics);
  }, [selectedMetricIds, metrics]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
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
      >
        <span className="block truncate text-westmarc-desert-night" title={selectionLabel}>{selectionLabel}</span>
        <ChevronDownIcon className="h-4 w-4 text-westmarc-mid-gray absolute right-3 top-1/2 -translate-y-1/2" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-westmarc-light-gray bg-white shadow-lg z-20">
          <ul className="py-1 text-sm">
            {Object.entries(groupedMetrics).map(([group, rawMetrics]) => {
              // Explicitly cast to MetricConfig[] to fix type errors where inference fails
              const metricsInGroup = rawMetrics as MetricConfig[];
              const groupMetricIds = metricsInGroup.map(m => m.id);
              const selectedCount = groupMetricIds.filter(id => selectedMetricIds.includes(id)).length;
              const allSelected = selectedCount === groupMetricIds.length;
              const isIndeterminate = selectedCount > 0 && !allSelected;

              return (
                <li key={group}>
                  <label className="flex w-full items-center px-3 py-2 hover:bg-westmarc-light-gray/50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-westmarc-polaris focus:ring-westmarc-saguaro"
                      checked={allSelected}
                      ref={el => { if (el) { el.indeterminate = isIndeterminate; } }}
                      onChange={() => handleGroupToggle(metricsInGroup)}
                    />
                    <span className="ml-3 text-xs font-bold uppercase text-westmarc-mid-gray tracking-wider select-none">
                      {group}
                    </span>
                  </label>
                  <ul className="pl-6">
                    {metricsInGroup.map((metric) => (
                      <li key={metric.id}>
                        <label className="flex w-full items-center py-2 pl-3 pr-9 text-left text-westmarc-desert-night hover:bg-westmarc-light-gray cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-westmarc-polaris focus:ring-westmarc-saguaro"
                            checked={selectedMetricIds.includes(metric.id)}
                            onChange={() => handleMetricToggle(metric.id)}
                          />
                          <span className="ml-3 font-normal">{metric.label}</span>
                        </label>
                      </li>
                    ))}
                    {group === 'Economics & Labor' && (() => {
                      const industryMetricIds = industryMetrics.map(m => m.id);
                      const selectedIndustryCount = industryMetricIds.filter(id => selectedMetricIds.includes(id)).length;
                      const allIndustrySelected = industryMetricIds.length > 0 && selectedIndustryCount === industryMetricIds.length;
                      const isIndustryIndeterminate = selectedIndustryCount > 0 && !allIndustrySelected;

                      return (
                        <>
                          <li className="pt-2"> {/* separator */}
                            <div className="flex items-center hover:bg-westmarc-light-gray/50">
                              <div 
                                className="pl-3 pr-2 py-2 cursor-pointer" 
                                onClick={() => setIsIndustryExpanded(prev => !prev)}
                                aria-label="Toggle Employment by Industry metrics"
                              >
                                {isIndustryExpanded ? <ChevronDownIcon className="h-4 w-4 text-westmarc-mid-gray"/> : <ChevronRightIcon className="h-4 w-4 text-westmarc-mid-gray"/>}
                              </div>
                              <label className="flex-grow flex items-center cursor-pointer py-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-westmarc-polaris focus:ring-westmarc-saguaro"
                                  checked={allIndustrySelected}
                                  ref={el => { if (el) { el.indeterminate = isIndustryIndeterminate; } }}
                                  onChange={() => handleGroupToggle(industryMetrics)}
                                />
                                <span className="ml-3 font-semibold select-none">Employment by Industry (%)</span>
                              </label>
                            </div>
                          </li>
                          {isIndustryExpanded && (
                            <ul className="pl-12">
                              {industryMetrics.map((metric) => (
                                <li key={metric.id}>
                                  <label className="flex w-full items-center py-2 pl-3 pr-9 text-left text-westmarc-desert-night hover:bg-westmarc-light-gray cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-300 text-westmarc-polaris focus:ring-westmarc-saguaro"
                                      checked={selectedMetricIds.includes(metric.id)}
                                      onChange={() => handleMetricToggle(metric.id)}
                                    />
                                    <span className="ml-3 font-normal">{metric.label.replace('Employment: ', '').replace(' (%)', '')}</span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      );
                    })()}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MetricSelector;
