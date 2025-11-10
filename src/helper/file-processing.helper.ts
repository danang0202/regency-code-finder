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
 * Parse CSV file content
 */
export async function parseCsvFile(filePath: string, separator: string): Promise<ParsedFileData> {
  const text = await readFile(filePath, "utf-8");
  
  if (!text.includes(separator)) {
    return { header: [], dataRows: [] };
  }

  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(separator);
  const dataRows = lines.slice(1).map(l => l.split(separator));

  return { header, dataRows };
}

/**
 * Parse Excel file content
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

  const header = data[0];
  const dataRows = data.slice(1);

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