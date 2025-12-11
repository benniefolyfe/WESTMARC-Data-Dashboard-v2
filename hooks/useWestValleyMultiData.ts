

import { useState, useEffect } from 'react';
import { westValleyData } from '../data/mockData';
import { ZipCodeData } from '../types';
import { aggregateZipData } from '../utils/aggregateData';

interface MultiDataResult {
  primaryData: ZipCodeData | null;
  combinedData: ZipCodeData | null;
  comparisonData: ZipCodeData[];
  loading: boolean;
}

export const useWestValleyMultiData = (zipCodes: string[]): MultiDataResult => {
  const [data, setData] = useState<MultiDataResult>({
    primaryData: null,
    combinedData: null,
    comparisonData: [],
    loading: false,
  });

  useEffect(() => {
    if (zipCodes && zipCodes.length > 0) {
      setData(prev => ({ ...prev, loading: true }));
      // Simulate API call
      setTimeout(() => {
        const foundData: ZipCodeData[] = zipCodes
          .map(zip => {
            const singleZipData = westValleyData[zip];
            return singleZipData ? { ...singleZipData, zip } : null;
          })
          .filter((d): d is ZipCodeData => d !== null);

        const primaryData = foundData.length > 0 ? foundData[0] : null;
        const combinedData = foundData.length > 0 ? aggregateZipData(foundData) : null;
        
        setData({
          primaryData,
          combinedData,
          comparisonData: foundData,
          loading: false,
        });
      }, 500);
    } else {
      setData({
        primaryData: null,
        combinedData: null,
        comparisonData: [],
        loading: false,
      });
    }
  }, [zipCodes.join(',')]); // Depend on the stringified array to avoid unnecessary re-renders

  return data;
};