import { NextRequest } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { 
  parseFile, 
  applyFilters, 
  applyPagination,
  applyImportantColumnsFilter,
  FileMetadata 
} from "@/helper/file-processing.helper";
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createPaginatedResponse 
} from "@/helper/api-response.helper";
import { 
  extractFilterParams, 
  extractPaginationParams 
} from "@/helper/query-params.helper";
import { writeFile_custom } from "@/helper/file-writing.helper";

export async function GET(req: NextRequest, context: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await context.params;
  const storageDir = path.join(process.cwd(), "storage");

  try {
    // Read metadata
    const metaPath = path.join(storageDir, `${uuid}.json`);
    const metaRaw = await readFile(metaPath, "utf-8");
    const meta: FileMetadata = JSON.parse(metaRaw);

    // Return metadata if requested
    if (req.nextUrl.searchParams.get("meta") === "true") {
      return createSuccessResponse(meta);
    }

    // Extract query parameters
    const filterParams = extractFilterParams(req.nextUrl.searchParams);
    const { page, limit } = extractPaginationParams(req.nextUrl.searchParams);
    const importantColumnsOnly = req.nextUrl.searchParams.get("important_columns_only") === "true";

    // Parse file
    const filePath = path.join(storageDir, meta.fileName);
    let { header, dataRows } = await parseFile(filePath, meta);

    // Return empty result if no data
    if (header.length === 0) {
      return createPaginatedResponse([], [], 0, page, limit, 0);
    }

    // Apply important columns filter if requested (for performance)
    const columnMapping: number[] = [];
    if (importantColumnsOnly) {
      const filtered = applyImportantColumnsFilter(header, dataRows);
      // Build column mapping
      const IMPORTANT_COLUMNS = [
        'row_index', 'nama_etl', 'alamat_etl', 'kdprov_etl', 'kdkab_etl', 'kdkec_etl', 'kddesa_etl'
      ];
      const originalHeader = header;
      IMPORTANT_COLUMNS.forEach(importantCol => {
        const colIndex = originalHeader.findIndex(h => 
          h.toLowerCase().replace(/['"]/g, '').trim() === importantCol.toLowerCase()
        );
        if (colIndex !== -1) {
          columnMapping.push(colIndex);
        }
      });
      
      header = filtered.filteredHeader;
      dataRows = filtered.filteredRows;
    }

    // Apply filters
    const filteredRows = applyFilters(dataRows, filterParams);

    // Apply pagination
    const { pagedRows, totalRows, totalPages } = applyPagination(filteredRows, page, limit);

    return createPaginatedResponse(
      header, 
      pagedRows, 
      totalRows, 
      page, 
      limit, 
      totalPages,
      importantColumnsOnly ? columnMapping : undefined
    );
  } catch {
    return createErrorResponse("File not found", 404);
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await context.params;
  const storageDir = path.join(process.cwd(), "storage");
  
  try {
    // Read metadata
    const metaPath = path.join(storageDir, `${uuid}.json`);
    const metaRaw = await readFile(metaPath, "utf-8");
    const meta: FileMetadata = JSON.parse(metaRaw);
    const filePath = path.join(storageDir, meta.fileName);
    
    // Parse request body
    const body = await req.json();
    const { header, allRows } = body;

    // Write file using helper
    await writeFile_custom(filePath, meta, header, allRows);
    
    return createSuccessResponse({ success: true });
  } catch {
    return createErrorResponse("Update failed", 500);
  }
}