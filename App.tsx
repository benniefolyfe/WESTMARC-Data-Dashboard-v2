
import React, { useState, useRef, useMemo } from 'react';
import L, { LatLng } from 'leaflet';
import Header from './components/Header';
import ZipCodeSelector from './components/ZipCodeSelector';
import Dashboard from './components/Dashboard';
import MapComponent from './components/MapComponent';
import { WEST_VALLEY_ZIP_CODES } from './constants';
import { westValleyZipCodeBoundaries } from './data/west-valley-zip-codes.filtered';
import {
  ContractIcon,
  ExpandIcon,
  UpArrowIcon,
  ZoomToSelectionIcon,
} from './components/icons';

import { useWestValleyData } from './hooks/useWestValleyData';
import { computeMetricForZips, MetricResult } from './utils/metricUtils';
import { METRICS, MetricId } from './metrics';
import MetricSelector from './components/MetricSelector';
import ComparisonDashboard from './components/ComparisonDashboard';
import AIInsights from './components/AIInsights';
import type { ChatMessage } from './types';

const initialMapCenter = new LatLng(33.55, -112.4);
const initialMapZoom = 9;
type View = 'dashboard' | 'compare' | 'aiInsights';

const App: React.FC = () => {
  const { data: westValleyData, loading: isLoadingData, error: dataError } = useWestValleyData();

  const [view, setView] = useState<View>('dashboard');
  const [selectedZips, setSelectedZips] = useState<string[]>([]);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const [persistedMetricIds, setPersistedMetricIds] = useState<MetricId[]>([]);
  const [mapMetricId, setMapMetricId] = useState<MetricId | null>(null);
  
  // Persisted chat history so it doesn't reset on tab switch
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // For the map metric:
  // In 'compare', we use the specifically active map metric.
  // In 'dashboard', we don't color the map by metric (it selects regions).
  const activeMetricIdForMap = view === 'compare' ? mapMetricId : null;

  const isInitialMapLoad = useRef(true);
  
  // Signals to send commands to the map components
  const [fitSelectionSignal, setFitSelectionSignal] = useState(0);
  const [resetViewSignal, setResetViewSignal] = useState(0);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleMetricsChange = (newIdsArray: MetricId[]) => {
    setPersistedMetricIds(newIdsArray);
  
    // Then, update the map's active metric based on the new selection.
    setMapMetricId(currentMapMetric => {
      // If the previously active metric is still in the new list, keep it.
      if (currentMapMetric && newIdsArray.includes(currentMapMetric)) {
        return currentMapMetric;
      }
      // Otherwise, pick the last metric from the new list as the active one.
      // If the new list is empty, there is no active metric.
      return newIdsArray.length > 0 ? newIdsArray[newIdsArray.length - 1] : null;
    });
  };

  const handleSetActiveMetric = (metricId: MetricId) => {
      if (persistedMetricIds.includes(metricId)) {
          setMapMetricId(metricId);
      }
  }

  const handleZipChange = (zip: string, isMultiSelect: boolean) => {
    setSelectedZips(prevZips => {
      if (isMultiSelect) {
        const newZips = new Set(prevZips);
        if (newZips.has(zip)) {
          newZips.delete(zip);
        } else {
          newZips.add(zip);
        }
        return Array.from(newZips);
      }
      if (prevZips.length === 1 && prevZips[0] === zip) {
        return [];
      }
      return [zip];
    });
  };
  
  const handleSelectorChange = (zips: string[]) => {
    setSelectedZips(zips);
  }

  const handleClearSelection = () => {
    setSelectedZips([]);
    setPersistedMetricIds([]);
    setMapMetricId(null);
    setResetViewSignal(s => s + 1);
  };
  
  const allMetricsData = useMemo(() => {
    if (!westValleyData) return {};
    const results: Record<string, MetricResult> = {};
    for (const metricId of persistedMetricIds) {
        results[metricId] = computeMetricForZips(
            metricId,
            westValleyData,
        );
    }
    return results;
  }, [persistedMetricIds, westValleyData]);
  
  const { valuesByZip: mapMetricValuesByZip, domain: mapMetricDomain } = useMemo(() => {
      if (!activeMetricIdForMap || !allMetricsData[activeMetricIdForMap]) {
          return { valuesByZip: {}, domain: null };
      }
      return allMetricsData[activeMetricIdForMap];
  }, [activeMetricIdForMap, allMetricsData]);

  const allZipDataArray = useMemo(() => westValleyData ? Object.values(westValleyData) : [], [westValleyData]);
  
  const zipToCityMap = useMemo(() => Object.fromEntries(
    WEST_VALLEY_ZIP_CODES.map(item => [item.zip, item.city])
  ), []);

  const leftPanelTitle = {
    dashboard: 'Explore the West Valley',
    compare: 'Filter Data',
    aiInsights: 'Analyze with AI',
  }[view];

  // Unified instructions across tabs
  const leftPanelDescription = "Select regions from the dropdown or map. Choose specific data metrics below to filter the dashboard, compare trends, or provide context for the AI analyst.";
  
  const showClearButton = selectedZips.length > 0 || persistedMetricIds.length > 0;
  
  if (isLoadingData) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-westmarc-off-white">
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-westmarc-polaris mb-4"></div>
            <p className="text-xl font-extrabold text-westmarc-midnight">Fetching Live Census Data...</p>
        </div>
    );
  }

  if (dataError || !westValleyData) {
      return (
          <div className="min-h-screen flex flex-col justify-center items-center bg-westmarc-off-white p-8 text-center">
              <h2 className="text-2xl font-extrabold text-westmarc-cholla mb-4">Error Fetching Data</h2>
              <p className="text-westmarc-desert-night mb-2">Could not connect to the U.S. Census Bureau API.</p>
              <p className="text-sm text-westmarc-dark-gray">{dataError?.message || 'An unknown error occurred.'}</p>
          </div>
      )
  }

  return (
    <div className="min-h-screen lg:h-screen bg-westmarc-off-white text-westmarc-desert-night flex flex-col lg:overflow-hidden">
      <Header currentView={view} onNavigate={setView} />
      <main className="flex-grow p-4 sm:p-6 md:p-8 lg:p-0 lg:overflow-hidden">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 lg:gap-8 h-full">
          
          <div className="lg:overflow-y-auto lg:p-8 lg:pr-4">
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-xl font-extrabold text-westmarc-midnight mb-2">
                      {leftPanelTitle}
                  </h2>
                  <p className="text-westmarc-dark-gray mb-4 font-light">
                      {leftPanelDescription}
                  </p>
                  
                  {/* Metric Selector is now available on all tabs to allow dashboard filtering */}
                  <MetricSelector
                      metrics={METRICS}
                      selectedMetricIds={persistedMetricIds}
                      onSelectionChange={handleMetricsChange}
                  />

                  <div className="mt-4">
                      <ZipCodeSelector
                          zipCodes={WEST_VALLEY_ZIP_CODES}
                          selectedZips={selectedZips}
                          onZipChange={handleSelectorChange}
                      />
                  </div>
                {showClearButton && (
                  <button
                    onClick={handleClearSelection}
                    className="mt-4 w-full bg-westmarc-cholla text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-westmarc-cholla"
                    aria-label="Clear all selections and reset view"
                  >
                    Clear All Selections
                  </button>
                )}
              </div>
              {view !== 'aiInsights' && (
                  <div className="bg-white rounded-lg shadow-md aspect-[4/3] relative">
                  <MapComponent 
                      geojsonData={westValleyZipCodeBoundaries} 
                      selectedZips={selectedZips} 
                      onZipChange={handleZipChange}
                      metricId={activeMetricIdForMap}
                      metricValuesByZip={mapMetricValuesByZip}
                      metricDomain={mapMetricDomain}
                      initialCenter={initialMapCenter}
                      initialZoom={initialMapZoom}
                      fitInitialBounds={isInitialMapLoad.current}
                      isExpanded={false}
                      fitSelectionSignal={fitSelectionSignal}
                      resetViewSignal={resetViewSignal}
                  />
                  <button
                      onClick={() => setIsMapExpanded(true)}
                      className="absolute top-2 right-2 z-[500] bg-white p-2 rounded-md shadow-lg hover:bg-westmarc-light-gray transition-colors"
                      aria-label="Expand map"
                  >
                      <ExpandIcon className="h-5 w-5 text-westmarc-midnight" />
                  </button>
                  {selectedZips.length > 0 && (
                    <button
                      onClick={() => setFitSelectionSignal((s) => s + 1)}
                      className="absolute top-12 right-2 z-[500] bg-white p-2 rounded-md shadow-lg hover:bg-westmarc-light-gray transition-colors"
                      aria-label="Zoom map to selected ZIP codes"
                    >
                      <ZoomToSelectionIcon className="h-5 w-5 text-westmarc-midnight" />
                    </button>
                  )}
                  </div>
              )}
            </div>
          </div>

          <div className="mt-8 lg:mt-0 lg:overflow-y-auto lg:p-8 lg:pl-4">
            {view === 'dashboard' ? (
                <Dashboard 
                    selectedZips={selectedZips} 
                    allWestValleyData={westValleyData} 
                    selectedMetricIds={persistedMetricIds}
                />
            ) : view === 'compare' ? (
                <ComparisonDashboard 
                    allData={allZipDataArray}
                    selectedZips={selectedZips}
                    metricIds={persistedMetricIds}
                    allMetricsData={allMetricsData}
                    activeMetricId={mapMetricId}
                    onSetActive={handleSetActiveMetric}
                    zipToCityMap={zipToCityMap}
                />
            ) : (
                <AIInsights 
                  selectedZips={selectedZips}
                  allWestValleyData={westValleyData}
                  selectedMetricIds={persistedMetricIds}
                  metrics={METRICS}
                  chatHistory={chatHistory}
                  setChatHistory={setChatHistory}
                />
            )}
          </div>

        </div>
      </main>
      <footer className="text-center py-4 text-westmarc-mid-gray text-sm mt-auto flex-shrink-0 space-y-1">
        <p>WESTMARC West Valley Data Initiative</p>
        <p className="text-xs italic">
            Data based on U.S. Census Bureau ACS 5-Year Estimates (2018-2022). Population growth is relative to 2013-2017 estimates.
        </p>
      </footer>
      
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-3 bg-westmarc-midnight text-white rounded-full shadow-lg hover:bg-westmarc-desert-night transition-opacity duration-300 opacity-0 pointer-events-none`}
        aria-label="Back to top"
      >
        <UpArrowIcon className="h-6 w-6" />
      </button>

      {isMapExpanded && (
        <div className="fixed inset-0 z-[1000] bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-lg shadow-2xl">
            <MapComponent
              geojsonData={westValleyZipCodeBoundaries}
              selectedZips={selectedZips}
              onZipChange={handleZipChange}
              metricId={activeMetricIdForMap}
              metricValuesByZip={mapMetricValuesByZip}
              metricDomain={mapMetricDomain}
              initialCenter={initialMapCenter}
              initialZoom={initialMapZoom}
              fitInitialBounds={false}
              isExpanded={true}
              fitSelectionSignal={fitSelectionSignal}
              resetViewSignal={resetViewSignal}
            />
             <button
                onClick={() => setIsMapExpanded(false)}
                className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded-md shadow-lg hover:bg-westmarc-light-gray transition-colors"
                aria-label="Contract map"
              >
                <ContractIcon className="h-5 w-5 text-westmarc-midnight" />
              </button>

              {selectedZips.length > 0 && (
                <button
                  onClick={() => setFitSelectionSignal((s) => s + 1)}
                  className="absolute top-12 right-2 z-[1000] bg-white p-2 rounded-md shadow-lg hover:bg-westmarc-light-gray transition-colors"
                  aria-label="Zoom map to selected ZIP codes"
                >
                  <ZoomToSelectionIcon className="h-5 w-5 text-westmarc-midnight" />
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
