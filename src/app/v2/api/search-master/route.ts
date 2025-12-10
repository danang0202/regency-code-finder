import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
// import Papa from 'papaparse';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') || '').toLowerCase();
  const jsonPath = path.join(process.cwd(), 'src/master/master_wilayah.json');

  let master = null;
  try {
    master = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch {
    return NextResponse.json([], { status: 200 });
  }

  // Helper for filter unique by key
  function uniqueBy<T>(arr: T[], keyFn: (item: T) => string): T[] {
    const seen = new Set<string>();
    return arr.filter((item: T) => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const provinsi = uniqueBy(
    master.provinsi.filter((r: { kode_prov: string; nama_prov: string }) =>
      r.kode_prov?.toLowerCase().includes(query) ||
      r.nama_prov?.toLowerCase().includes(query)
    ),
    (r: { kode_prov: string; nama_prov: string }) => `${r.kode_prov}|${r.nama_prov}`
  ).sort((a: { nama_prov: string }, b: { nama_prov: string }) => 
    a.nama_prov.localeCompare(b.nama_prov, 'id', { sensitivity: 'base' })
  );

  const kabupaten = uniqueBy(
    master.kabupaten.filter((r: { kode_kab: string; kab_nama: string; kode_prov: string; nama_prov: string }) =>
      r.kode_kab?.toLowerCase().includes(query) ||
      r.kab_nama?.toLowerCase().includes(query)
    ),
    (r: { kode_kab: string; kab_nama: string }) => `${r.kode_kab}|${r.kab_nama}`
  ).sort((a: { kab_nama: string }, b: { kab_nama: string }) => 
    a.kab_nama.localeCompare(b.kab_nama, 'id', { sensitivity: 'base' })
  );

  const kecamatan = uniqueBy(
    master.kecamatan.filter((r: { kode_kec: string; kec_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string }) =>
      r.kode_kec?.toLowerCase().includes(query) ||
      r.kec_nama?.toLowerCase().includes(query)
    ),
    (r: { kode_kec: string; kec_nama: string }) => `${r.kode_kec}|${r.kec_nama}`
  ).sort((a: { kec_nama: string }, b: { kec_nama: string }) => 
    a.kec_nama.localeCompare(b.kec_nama, 'id', { sensitivity: 'base' })
  );

  const desa = uniqueBy(
    master.desa.filter((r: { kode_desa: string; desa_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string; kode_kec: string; kec_nama: string }) =>
      r.kode_desa?.toLowerCase().includes(query) ||
      r.desa_nama?.toLowerCase().includes(query)
    ),
    (r: { kode_desa: string; desa_nama: string }) => `${r.kode_desa}|${r.desa_nama}`
  ).sort((a: { desa_nama: string }, b: { desa_nama: string }) => 
    a.desa_nama.localeCompare(b.desa_nama, 'id', { sensitivity: 'base' })
  );

  return NextResponse.json({ provinsi, kabupaten, kecamatan, desa }, { status: 200 });
}
