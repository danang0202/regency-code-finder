/**
 * Table utilities for data processing and pagination
 */

/**
 * Normalize header name (remove quotes, trim)
 */
export function normalizeHeaderName(headerName: string): string {
  return headerName.replace(/^['"]|['"]$/g, "");
}

/**
 * Generate column accessor key
 */
export function getColumnAccessorKey(index: number): string {
  return `col${index}`;
}

/**
 * Convert table rows to object format for MantineReactTable
 */
export function convertRowsToTableData(rows: string[][]): Record<string, string>[] {
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    row.forEach((cell, idx) => {
      obj[getColumnAccessorKey(idx)] = cell || "";
    });
    return obj;
  });
}

/**
 * Calculate global row index from page and row index
 */
export function calculateGlobalRowIndex(
  currentPage: number,
  rowIndex: number,
  limit: number
): number {
  return (currentPage - 1) * limit + rowIndex;
}

/**
 * Generate pagination text
 */
export function generatePaginationText(
  currentPage: number,
  limit: number,
  totalRows: number
): string {
  const start = ((currentPage - 1) * limit) + 1;
  const end = Math.min(currentPage * limit, totalRows);
  return `Menampilkan ${start}-${end} dari ${totalRows} data`;
}

/**
 * Generate unique filter options from array data
 */
export function generateFilterOptions(
  data: string[][],
  columnIndex: number
): Array<{ value: string; label: string }> {
  const uniqueValues = Array.from(
    new Set(data.map(row => row[columnIndex]).filter(Boolean))
  );
  
  return uniqueValues.map(value => ({ 
    value, 
    label: value 
  }));
}