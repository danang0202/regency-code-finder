/**
 * API response utilities
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T = unknown> {
  header: string[];
  rows: T[];
  totalRows: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Create successful JSON response
 */
export function createSuccessResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create error JSON response
 */
export function createErrorResponse(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create paginated response
 */
export function createPaginatedResponse(
  header: string[],
  rows: string[][],
  totalRows: number,
  page: number,
  limit: number,
  totalPages: number
): Response {
  const responseData: PaginatedResponse = {
    header,
    rows,
    totalRows,
    page,
    limit,
    totalPages
  };

  return createSuccessResponse(responseData);
}