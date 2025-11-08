import { NextRequest } from "next/server";
import path from "path";
import { readFile, writeFile } from "fs/promises";
import * as XLSX from "xlsx";

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

    // Pagination parameters
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10", 10);
    
    const filePath = path.join(storageDir, meta.fileName);
    
    if (meta.fileType === "csv") {
      const text = await readFile(filePath, "utf-8");
      if (!text.includes(meta.separator)) {
        return new Response(JSON.stringify({
          header: [],
          rows: [],
          totalRows: 0,
          page,
          limit,
          totalPages: 0
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const lines = text.split(/\r?\n/).filter(Boolean);
      const header = lines[0].split(meta.separator);
      const dataRows = lines.slice(1);
      const totalRows = dataRows.length;
      const totalPages = Math.ceil(totalRows / limit);
      
      const startIdx = (page - 1) * limit;
      const endIdx = startIdx + limit;
      const pagedRows = dataRows.slice(startIdx, endIdx).map(l => l.split(meta.separator));
      
      return new Response(JSON.stringify({
        header,
        rows: pagedRows,
        totalRows,
        page,
        limit,
        totalPages
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (meta.fileType === "excel") {
      const fileBuffer = await readFile(filePath);
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
      
      if (data.length === 0) {
        return new Response(JSON.stringify({
          header: [],
          rows: [],
          totalRows: 0,
          page,
          limit,
          totalPages: 0
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const header = data[0];
      const dataRows = data.slice(1);
      const totalRows = dataRows.length;
      const totalPages = Math.ceil(totalRows / limit);
      
      const startIdx = (page - 1) * limit;
      const endIdx = startIdx + limit;
      const pagedRows = dataRows.slice(startIdx, endIdx);
      
      return new Response(JSON.stringify({
        header,
        rows: pagedRows,
        totalRows,
        page,
        limit,
        totalPages
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Fallback untuk file type lain
    const fileBuffer = await readFile(filePath);
    const contentType = "application/octet-stream";
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

export async function PATCH(req: NextRequest, context: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await context.params;
  const storageDir = path.join(process.cwd(), "storage");
  
  try {
    const metaPath = path.join(storageDir, `${uuid}.json`);
    const metaRaw = await readFile(metaPath, "utf-8");
    const meta = JSON.parse(metaRaw);
    const filePath = path.join(storageDir, meta.fileName);
    
    if (meta.fileType !== "csv") {
      return new Response(JSON.stringify({ error: "Only CSV update supported" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const body = await req.json();
    const { header, allRows } = body; // allRows berisi semua data (untuk update lengkap)
    
    const csvText = [
      header.join(meta.separator),
      ...allRows.map((row: string[]) => row.join(meta.separator))
    ].join("\n");
    
    await writeFile(filePath, csvText, "utf-8");
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Update failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
