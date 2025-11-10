import { NextRequest } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

export async function GET(req: NextRequest, context: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await context.params;
  const storageDir = path.join(process.cwd(), "storage");

  try {
    // Baca metadata
    const metaPath = path.join(storageDir, `${uuid}.json`);
    const metaRaw = await readFile(metaPath, "utf-8");
    const meta = JSON.parse(metaRaw);
    const filePath = path.join(storageDir, meta.fileName);

    // Tentukan content type dan filename
    let contentType = "application/octet-stream";
    let filename = meta.fileName || `data_${uuid}`;
    if (meta.fileType === "csv") {
      contentType = "text/csv";
      if (!filename.endsWith(".csv")) filename += ".csv";
    } else if (meta.fileType === "excel") {
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      if (!filename.endsWith(".xlsx")) filename += ".xlsx";
    }

    const fileBuffer = await readFile(filePath);
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "File not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}
