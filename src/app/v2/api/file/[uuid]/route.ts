import { NextRequest } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { 
  parseFile, 
  applyFilters, 
  applyPagination,
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

    // Parse file
    const filePath = path.join(storageDir, meta.fileName);
    const { header, dataRows } = await parseFile(filePath, meta);

    // Return empty result if no data
    if (header.length === 0) {
      return createPaginatedResponse([], [], 0, page, limit, 0);
    }

    // Apply filters
    const filteredRows = applyFilters(dataRows, filterParams);

    // Apply pagination
    const { pagedRows, totalRows, totalPages } = applyPagination(filteredRows, page, limit);

    return createPaginatedResponse(header, pagedRows, totalRows, page, limit, totalPages);
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