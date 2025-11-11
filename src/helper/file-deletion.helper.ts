import { unlink, readFile } from "fs/promises";
import path from "path";

export interface FileMetadata {
  fileName: string;
  separator?: string;
  fileType?: string;
  uploadedAt?: string;
  originalName?: string;
  realName?: string;
  uuid: string;
}

/**
 * Delete a file and its metadata from storage
 * @param uuid - The file UUID
 * @returns Promise<void>
 * @throws Error if file or metadata not found, or deletion fails
 */
export async function deleteFile(uuid: string): Promise<void> {
  const storageDir = path.join(process.cwd(), "storage");
  const metaPath = path.join(storageDir, `${uuid}.json`);

  try {
    // Read metadata to get the actual filename
    const metaRaw = await readFile(metaPath, "utf-8");
    const meta: FileMetadata = JSON.parse(metaRaw);
    const filePath = path.join(storageDir, meta.fileName);

    // Delete the actual file
    await unlink(filePath);

    // Delete the metadata file
    await unlink(metaPath);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    throw new Error("Failed to delete file: Unknown error");
  }
}

/**
 * Check if a file exists by UUID
 * @param uuid - The file UUID
 * @returns Promise<boolean>
 */
export async function fileExists(uuid: string): Promise<boolean> {
  const storageDir = path.join(process.cwd(), "storage");
  const metaPath = path.join(storageDir, `${uuid}.json`);

  try {
    await readFile(metaPath, "utf-8");
    return true;
  } catch {
    return false;
  }
}
