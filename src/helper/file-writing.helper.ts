/**
 * File writing utilities for CSV and Excel files
 */
import * as XLSX from "xlsx";
import { writeFile } from "fs/promises";
import { FileMetadata } from "./file-processing.helper";

/**
 * Write CSV file content
 */
export async function writeCsvFile(
  filePath: string,
  header: string[],
  rows: string[][],
  separator: string
): Promise<void> {
  const csvText = [
    header.join(separator),
    ...rows.map((row: string[]) => row.join(separator))
  ].join("\n");
  
  await writeFile(filePath, csvText, "utf-8");
}

/**
 * Write Excel file content
 */
export async function writeExcelFile(
  filePath: string,
  header: string[],
  rows: string[][]
): Promise<void> {
  const data = [header, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  
  await writeFile(filePath, excelBuffer);
}

/**
 * Write file based on metadata
 */
export async function writeFile_custom(
  filePath: string,
  meta: FileMetadata,
  header: string[],
  rows: string[][]
): Promise<void> {
  if (meta.fileType === "csv" && meta.separator) {
    await writeCsvFile(filePath, header, rows, meta.separator);
  } else if (meta.fileType === "excel") {
    await writeExcelFile(filePath, header, rows);
  } else {
    throw new Error("Unsupported file type");
  }
}