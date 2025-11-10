import { useState, useCallback } from 'react';

export interface FetchDataParams {
  page?: number;
  limit?: number;
  filters?: { [colIdx: number]: string };
}

export interface FetchedData {
  header: string[];
  rows: string[][];
  totalRows: number;
  totalPages: number;
  page: number;
  limit: number;
}

export function useDataFetcher(fileId: string | string[] | undefined) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FetchedData>({
    header: [],
    rows: [],
    totalRows: 0,
    totalPages: 0,
    page: 1,
    limit: 10
  });

  const fetchData = useCallback(async (params: FetchDataParams = {}) => {
    if (!fileId) return;
    
    setLoading(true);
    
    try {
      const { page = 1, limit = 10, filters = {} } = params;
      
      // Build filter query string
      const filterQuery = Object.entries(filters)
        .filter(([, v]) => v)
        .map(([colIdx, value]) => `filter[${colIdx}]=${encodeURIComponent(value)}`)
        .join('&');
      
      const url = `/v2/api/file/${fileId}?page=${page}&limit=${limit}${filterQuery ? `&${filterQuery}` : ''}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const responseData = await res.json();
        setData({
          header: responseData.header || [],
          rows: responseData.rows || [],
          totalRows: responseData.totalRows || 0,
          totalPages: responseData.totalPages || 0,
          page: responseData.page || page,
          limit: responseData.limit || limit
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setData(prev => ({ ...prev, rows: [] }));
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  const saveData = useCallback(async (header: string[], allRows: string[][]) => {
    if (!fileId) return false;
    
    try {
      const response = await fetch(`/v2/api/file/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          header,
          allRows
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to save data:', error);
      return false;
    }
  }, [fileId]);

  return {
    data,
    loading,
    fetchData,
    saveData
  };
}