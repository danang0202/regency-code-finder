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
    // Jika query ?meta=true, kirim metadata saja
    if (req.nextUrl.searchParams.get("meta") === "true") {
      return new Response(JSON.stringify(meta), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Baca file asli
    const filePath = path.join(storageDir, meta.fileName);
    const fileBuffer = await readFile(filePath);
    let contentType = "application/octet-stream";
    if (meta.fileType === "csv") contentType = "text/csv";
    if (meta.fileType === "excel") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    return new Response(fileBuffer, {
      status: 200,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "File not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}
