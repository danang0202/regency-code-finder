/**
 * Query parameter parsing utilities
 */

export interface FilterParams {
  [colIdx: string]: string;
}

/**
 * Extract filter parameters from URL search params
 */
export function extractFilterParams(searchParams: URLSearchParams): FilterParams {
  const filterParams: FilterParams = {};
  
  searchParams.forEach((val, key) => {
    if (key.startsWith("filter[")) {
      const match = key.match(/filter\[(\d+)\]/);
      if (match) {
        filterParams[match[1]] = val;
      }
    }
  });
  
  return filterParams;
}

/**
 * Extract pagination parameters from URL search params
 */
export function extractPaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
} {
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  
  return { page, limit };
}