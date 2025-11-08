import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') || '').toLowerCase();
  const csvPath = path.join(process.cwd(), 'src/master/master_provinsi_kabkot_kecamatan_desa_untuk_magang - master_provinsi_kabkot_kecamatan_desa_untuk_magang.csv');

  let csvData = '';
  try {
    csvData = fs.readFileSync(csvPath, 'utf8');
  } catch {
    return NextResponse.json([], { status: 200 });
  }

  const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  const rows = Array.isArray(parsed.data) ? parsed.data : [];

  const provinsiSet = new Set<string>();
  const kabupatenSet = new Set<string>();
  const kecamatanSet = new Set<string>();
  const desaSet = new Set<string>();

  const provinsi: Array<{ kode_prov: string; nama_prov: string }> = [];
  const kabupaten: Array<{ kode_kab: string; kab_nama: string; kode_prov: string; nama_prov: string }> = [];
  const kecamatan: Array<{ kode_kec: string; kec_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string }> = [];
  const desa: Array<{ kode_desa: string; desa_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string; kode_kec: string; kec_nama: string }> = [];

  rows.forEach((row) => {
    const r = row as Record<string, string>;
    if (
      r.kode_prov?.toLowerCase().includes(query) ||
      r.nama_prov?.toLowerCase().includes(query)
    ) {
      const key = `${r.kode_prov}|${r.nama_prov}`;
      if (!provinsiSet.has(key)) {
        provinsiSet.add(key);
        provinsi.push({ kode_prov: r.kode_prov, nama_prov: r.nama_prov });
      }
    }
    if (
      r.kode_kab?.toLowerCase().includes(query) ||
      r.kab_nama?.toLowerCase().includes(query)
    ) {
      const key = `${r.kode_kab}|${r.kab_nama}`;
      if (!kabupatenSet.has(key)) {
        kabupatenSet.add(key);
        kabupaten.push({ kode_kab: r.kode_kab, kab_nama: r.kab_nama, kode_prov: r.kode_prov, nama_prov: r.nama_prov });
      }
    }
    if (
      r.kode_kec?.toLowerCase().includes(query) ||
      r.kec_nama?.toLowerCase().includes(query)
    ) {
      const key = `${r.kode_kec}|${r.kec_nama}`;
      if (!kecamatanSet.has(key)) {
        kecamatanSet.add(key);
        kecamatan.push({ kode_kec: r.kode_kec, kec_nama: r.kec_nama, kode_prov: r.kode_prov, nama_prov: r.nama_prov, kode_kab: r.kode_kab, kab_nama: r.kab_nama });
      }
    }
    if (
      r.kode_desa?.toLowerCase().includes(query) ||
      r.desa_nama?.toLowerCase().includes(query)
    ) {
      const key = `${r.kode_desa}|${r.desa_nama}`;
      if (!desaSet.has(key)) {
        desaSet.add(key);
        desa.push({ kode_desa: r.kode_desa, desa_nama: r.desa_nama, kode_prov: r.kode_prov, nama_prov: r.nama_prov, kode_kab: r.kode_kab, kab_nama: r.kab_nama, kode_kec: r.kode_kec, kec_nama: r.kec_nama });
      }
    }
  });

  return NextResponse.json({ provinsi, kabupaten, kecamatan, desa }, { status: 200 });
}
