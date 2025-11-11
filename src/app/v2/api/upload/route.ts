import { writeFile, mkdir } from "fs/promises";
import { NextRequest } from "next/server";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file = data.get("file") as File;
    const separator = data.get("separator") as string | null;
    const fileType = data.get("fileType") as string | null;
    
    if (!file) {
      return Response.json({ error: "No file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storageDir = path.join(process.cwd(), "storage");
    
    // Buat folder storage jika belum ada
    if (!existsSync(storageDir)) {
      await mkdir(storageDir, { recursive: true });
    }
    
    // Pastikan nama file di storage menyertakan ekstensi
    let originalName = file.name;
    // Jika tidak ada ekstensi, tambahkan dari fileType
    if (!/\.[a-zA-Z0-9]+$/.test(originalName)) {
      if (fileType === "csv") originalName += ".csv";
      else if (fileType === "excel") originalName += ".xlsx";
    }
    await writeFile(path.join(storageDir, originalName), buffer);

    // Ambil uuid dari nama file (tanpa ekstensi)
    const uuid = originalName.replace(/\.[^.]+$/, "");

    // Simpan metadata sebagai JSON
    const meta = {
      fileName: originalName,
      separator: separator || ",",
      fileType: fileType || "csv",
      uploadedAt: new Date().toISOString(),
      originalName: file.name,
      realName: file.name, // Store the actual uploaded filename
      uuid,
    };

    await writeFile(
      path.join(storageDir, uuid + ".json"), 
      JSON.stringify(meta, null, 2)
    );

    return Response.json({ success: true, uuid });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
