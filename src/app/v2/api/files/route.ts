import { readdir, readFile } from "fs/promises";
import path from "path";
import { createSuccessResponse, createErrorResponse } from "@/helper/api-response.helper";

interface FileMetadata {
  fileName: string;
  separator?: string;
  fileType?: string;
  uploadedAt?: string;
  originalName?: string;
  uuid: string;
}

export async function GET() {
  try {
    const storageDir = path.join(process.cwd(), "storage");
    
    // Read all files in storage directory
    const files = await readdir(storageDir);
    
    // Filter for .json metadata files
    const metadataFiles = files.filter(file => file.endsWith('.json') && file !== 'auth.json');
    
    // Read metadata for each file
    const fileList: FileMetadata[] = await Promise.all(
      metadataFiles.map(async (metaFile) => {
        const metaPath = path.join(storageDir, metaFile);
        const metaRaw = await readFile(metaPath, "utf-8");
        const meta: FileMetadata = JSON.parse(metaRaw);
        return meta;
      })
    );
    
    // Sort by upload date (newest first)
    fileList.sort((a, b) => {
      const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return dateB - dateA;
    });
    
    return createSuccessResponse({ files: fileList });
  } catch (error) {
    console.error('Error listing files:', error);
    return createErrorResponse("Failed to list files", 500);
  }
}
