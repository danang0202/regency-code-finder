/**
 * File processing utilities for CSV and Excel files
 */
import * as XLSX from "xlsx";
import { readFile } from "fs/promises";

export interface FileMetadata {
  fileName: string;
  fileType: "csv" | "excel";
  separator?: string;
}

export interface ParsedFileData {
  header: string[];
  dataRows: string[][];
}

/**
 * Normalize value for filtering (convert to string, trim, lowercase, remove quotes)
 */
export function normalizeValue(value: string | number | null | undefined): string {
  return String(value ?? '').replace(/^['"]|['"]$/g, "").trim().toLowerCase();
}

/**
 * Parse CSV file content and add row_index column
 */
export async function parseCsvFile(filePath: string, separator: string): Promise<ParsedFileData> {
  const text = await readFile(filePath, "utf-8");
  
  if (!text.includes(separator)) {
    return { header: [], dataRows: [] };
  }

  const lines = text.split(/\r?\n/).filter(Boolean);
  const originalHeader = lines[0].split(separator);
  const originalDataRows = lines.slice(1).map(l => l.split(separator));

  // Check if row_index already exists
  if (originalHeader[0] === 'row_index') {
    // row_index already exists, return as is
    return { header: originalHeader, dataRows: originalDataRows };
  }

  // Add row_index column as first column only if it doesn't exist
  const header = ['row_index', ...originalHeader];
  const dataRows = originalDataRows.map((row, index) => [String(index + 1), ...row]);

  return { header, dataRows };
}

/**
 * Parse Excel file content and add row_index column
 */
export async function parseExcelFile(filePath: string): Promise<ParsedFileData> {
  const fileBuffer = await readFile(filePath);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
  
  if (data.length === 0) {
    return { header: [], dataRows: [] };
  }

  const originalHeader = data[0];
  const originalDataRows = data.slice(1);

  // Check if row_index already exists
  if (originalHeader[0] === 'row_index') {
    // row_index already exists, return as is
    return { header: originalHeader, dataRows: originalDataRows };
  }

  // Add row_index column as first column only if it doesn't exist
  const header = ['row_index', ...originalHeader];
  const dataRows = originalDataRows.map((row, index) => [String(index + 1), ...row]);

  return { header, dataRows };
}

/**
 * Parse file based on metadata
 */
export async function parseFile(filePath: string, meta: FileMetadata): Promise<ParsedFileData> {
  if (meta.fileType === "csv" && meta.separator) {
    return await parseCsvFile(filePath, meta.separator);
  } else if (meta.fileType === "excel") {
    return await parseExcelFile(filePath);
  }
  
  return { header: [], dataRows: [] };
}

/**
 * Apply filters to data rows
 */
export function applyFilters(
  dataRows: string[][], 
  filterParams: { [colIdx: string]: string }
): string[][] {
  if (Object.keys(filterParams).length === 0) {
    return dataRows;
  }

  return dataRows.filter(row => {
    return Object.entries(filterParams).every(([colIdx, filterValue]) => {
      const dataValue = row[Number(colIdx)];
      return normalizeValue(dataValue) === normalizeValue(filterValue);
    });
  });
}

/**
 * Apply pagination to data rows
 */
export function applyPagination(
  dataRows: string[][],
  page: number,
  limit: number
): {
  pagedRows: string[][];
  totalRows: number;
  totalPages: number;
} {
  const totalRows = dataRows.length;
  const totalPages = Math.ceil(totalRows / limit);
  const startIdx = (page - 1) * limit;
  const endIdx = startIdx + limit;
  const pagedRows = dataRows.slice(startIdx, endIdx);

  return { pagedRows, totalRows, totalPages };
}

/**
 * Apply important columns filter to improve performance
 */
export function applyImportantColumnsFilter(
  header: string[],
  dataRows: string[][]
): {
  filteredHeader: string[];
  filteredRows: string[][];
} {
  // Define important columns (case-insensitive matching)
  const IMPORTANT_COLUMNS = [
    'row_index', // Always include row_index for updates
    'nama_etl',
    'alamat_etl',
    'kdprov_etl',
    'kdkab_etl',
    'kdkec_etl',
    'kddesa_etl'
  ];

  const columnIndices: number[] = [];
  const filteredHeader: string[] = [];

  // Find indices of important columns that exist in the data
  IMPORTANT_COLUMNS.forEach(importantCol => {
    const colIndex = header.findIndex(h => 
      h.toLowerCase().replace(/['"]/g, '').trim() === importantCol.toLowerCase()
    );
    if (colIndex !== -1) {
      columnIndices.push(colIndex);
      filteredHeader.push(header[colIndex]);
    }
  });

  // Filter rows based on selected column indices
  const filteredRows = dataRows.map(row => 
    columnIndices.map(colIdx => row[colIdx] || '')
  );

  return { filteredHeader, filteredRows };
}