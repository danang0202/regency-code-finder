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

    // Ambil filter dari query
    const filterParams: { [colIdx: string]: string } = {};
    req.nextUrl.searchParams.forEach((val, key) => {
      if (key.startsWith("filter[")) {
        const match = key.match(/filter\[(\d+)\]/);
        if (match) {
          filterParams[match[1]] = val;
        }
      }
    });

    // Pagination parameters
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10", 10);

    const filePath = path.join(storageDir, meta.fileName);

    let header: string[] = [];
    let dataRows: string[][] = [];

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
      header = lines[0].split(meta.separator);
      dataRows = lines.slice(1).map(l => l.split(meta.separator));
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
      header = data[0];
      dataRows = data.slice(1);
    }

  // Helper to normalize value (convert to string, trim, lowercase, remove leading/trailing quotes)
  const normalize = (s: string | number) => String(s ?? '').replace(/^['"]|['"]$/g, "").trim().toLowerCase();

    // Apply filter
    if (Object.keys(filterParams).length > 0) {
      dataRows = dataRows.filter(row => {
        return Object.entries(filterParams).every(([colIdx, filterValue]) => {
          return normalize(row[Number(colIdx)]) === normalize(filterValue);
        });
      });
    }

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

    const body = await req.json();
    const { header, allRows } = body; // allRows berisi semua data (untuk update lengkap)

    if (meta.fileType === "csv") {
      const csvText = [
        header.join(meta.separator),
        ...allRows.map((row: string[]) => row.join(meta.separator))
      ].join("\n");
      await writeFile(filePath, csvText, "utf-8");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (meta.fileType === "excel") {
      // Write Excel file using XLSX
      const data = [header, ...allRows];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      await writeFile(filePath, excelBuffer);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: "Unsupported file type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Update failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
