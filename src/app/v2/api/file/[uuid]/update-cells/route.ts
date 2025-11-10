import { NextRequest } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { 
  parseFile, 
  FileMetadata 
} from "@/helper/file-processing.helper";
import { 
  createSuccessResponse, 
  createErrorResponse 
} from "@/helper/api-response.helper";
import { writeFile_custom } from "@/helper/file-writing.helper";

interface CellChange {
  rowIndex: number;
  columnIndex: number;
  oldValue: string;
  newValue: string;
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
    const { changes }: { changes: CellChange[] } = body;

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      return createErrorResponse("No changes provided", 400);
    }

    // Parse current file
    const { header, dataRows } = await parseFile(filePath, meta);
    
    // Apply incremental changes
    const updatedRows = [...dataRows];
    const appliedChanges: CellChange[] = [];
    
    for (const change of changes) {
      const { rowIndex, columnIndex, oldValue, newValue } = change;
      
      // Validate indices
      if (rowIndex < 0 || rowIndex >= updatedRows.length || 
          columnIndex < 0 || columnIndex >= header.length) {
        console.warn(`Invalid indices: row ${rowIndex}, col ${columnIndex}`);
        continue;
      }
      
      // Verify current value matches expected old value (conflict detection)
      const currentValue = updatedRows[rowIndex][columnIndex] || '';
      if (currentValue !== oldValue) {
        console.warn(`Conflict detected at row ${rowIndex}, col ${columnIndex}: expected "${oldValue}", found "${currentValue}"`);
        // For now, we'll apply the change anyway but log the conflict
        // In a more sophisticated system, we might reject the change or require resolution
      }
      
      // Apply the change
      updatedRows[rowIndex][columnIndex] = newValue;
      appliedChanges.push(change);
      
      console.log(`Applied change: row ${rowIndex}, col ${columnIndex}, ${oldValue} → ${newValue}`);
    }

    // Write updated file
    await writeFile_custom(filePath, meta, header, updatedRows);
    
    return createSuccessResponse({ 
      success: true, 
      appliedChanges: appliedChanges.length,
      totalChanges: changes.length,
      conflicts: changes.length - appliedChanges.length
    });
  } catch (error) {
    console.error('Incremental update failed:', error);
    return createErrorResponse("Incremental update failed", 500);
  }
}