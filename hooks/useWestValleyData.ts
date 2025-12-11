import { useState, useEffect } from 'react';
import { ZipCodeData } from '../types';
import { fetchAllWestValleyData } from '../services/censusApi';

interface WestValleyDataState {
  data: Record<string, ZipCodeData> | null;
  loading: boolean;
  error: Error | null;
}

export const useWestValleyData = (): WestValleyDataState => {
  const [state, setState] = useState<WestValleyDataState>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const westValleyData = await fetchAllWestValleyData();
        setState({ data: westValleyData, loading: false, error: null });
      } catch (error) {
        setState({ data: null, loading: false, error: error as Error });
      }
    };

    loadData();
  }, []); // Empty dependency array ensures this runs only once on mount

  return state;
};
