/**
 * Helper for hierarchical region code search
 * Supports searching by province, province+kabupaten, province+kabupaten+kecamatan, and full hierarchy
 */

export interface HierarchicalCodeResult {
  provinsi: Array<{ kode_prov: string; nama_prov: string }>;
  kabupaten: Array<{ kode_kab: string; kab_nama: string; kode_prov: string; nama_prov: string }>;
  kecamatan: Array<{ kode_kec: string; kec_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string }>;
  desa: Array<{ kode_desa: string; desa_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string; kode_kec: string; kec_nama: string }>;
}

export interface ParsedCode {
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  desa?: string;
}

/**
 * Parse hierarchical code input
 * Supports formats like:
 * - "32" (province only)
 * - "32.07" or "3207" (province + kabupaten)
 * - "32.07.010" or "3207010" (province + kabupaten + kecamatan)
 * - "32.07.010.001" or "3207010001" (full hierarchy)
 */
export function parseHierarchicalCode(code: string): ParsedCode {
  const cleaned = code.trim();
  
  // Helper to remove leading zeros but keep at least one digit
  const normalizeCode = (val: string | undefined): string | undefined => {
    if (!val) return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) ? val : num.toString();
  };
  
  // Handle dot-separated format
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    const result: ParsedCode = {};
    
    if (parts.length >= 1 && parts[0]) {
      result.provinsi = parts[0].padStart(2, '0');
    }
    if (parts.length >= 2 && parts[1]) {
      result.kabupaten = normalizeCode(parts[1]);
    }
    if (parts.length >= 3 && parts[2]) {
      result.kecamatan = normalizeCode(parts[2]);
    }
    if (parts.length >= 4 && parts[3]) {
      result.desa = normalizeCode(parts[3]);
    }
    
    return result;
  }
  
  // Handle continuous format (e.g., "3207010001")
  const result: ParsedCode = {};
  
  // Province code (2 digits)
  if (cleaned.length >= 2) {
    result.provinsi = cleaned.substring(0, 2);
  } else if (cleaned.length === 1) {
    result.provinsi = cleaned.padStart(2, '0');
  }
  
  // Kabupaten code (next 2 digits) - remove leading zeros
  if (cleaned.length >= 4) {
    result.kabupaten = normalizeCode(cleaned.substring(2, 4));
  }
  
  // Kecamatan code (next 3 digits) - remove leading zeros
  if (cleaned.length >= 7) {
    result.kecamatan = normalizeCode(cleaned.substring(4, 7));
  }
  
  // Desa code (next 3 digits) - remove leading zeros
  if (cleaned.length >= 10) {
    result.desa = normalizeCode(cleaned.substring(7, 10));
  }
  
  return result;
}

/**
 * Search regions by hierarchical code
 */
export function searchByHierarchicalCode(
  masterData: {
    provinsi: Array<{ kode_prov: string; nama_prov: string }>;
    kabupaten: Array<{ kode_kab: string; kab_nama: string; kode_prov: string; nama_prov: string }>;
    kecamatan: Array<{ kode_kec: string; kec_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string }>;
    desa: Array<{ kode_desa: string; desa_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string; kode_kec: string; kec_nama: string }>;
  },
  parsedCode: ParsedCode
): HierarchicalCodeResult {
  const result: HierarchicalCodeResult = {
    provinsi: [],
    kabupaten: [],
    kecamatan: [],
    desa: []
  };
  
  // Helper for unique filtering
  function uniqueBy<T>(arr: T[], keyFn: (item: T) => string): T[] {
    const seen = new Set<string>();
    return arr.filter((item: T) => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  // Search provinsi
  if (parsedCode.provinsi) {
    result.provinsi = uniqueBy(
      masterData.provinsi.filter(p => p.kode_prov === parsedCode.provinsi),
      (p) => `${p.kode_prov}|${p.nama_prov}`
    );
  }
  
  // Search kabupaten
  if (parsedCode.provinsi) {
    const kabupatenFiltered = masterData.kabupaten.filter(k => {
      if (parsedCode.kabupaten) {
        // Filter by both province and kabupaten code
        return k.kode_prov === parsedCode.provinsi && k.kode_kab === parsedCode.kabupaten;
      } else {
        // Filter by province code only
        return k.kode_prov === parsedCode.provinsi;
      }
    });
    
    result.kabupaten = uniqueBy(
      kabupatenFiltered,
      (k) => `${k.kode_kab}|${k.kab_nama}`
    );
  }
  
  // Search kecamatan
  if (parsedCode.provinsi) {
    const kecamatanFiltered = masterData.kecamatan.filter(kec => {
      const matchProv = kec.kode_prov === parsedCode.provinsi;
      
      if (parsedCode.kecamatan && parsedCode.kabupaten) {
        // Filter by province, kabupaten, and kecamatan code
        return matchProv && kec.kode_kab === parsedCode.kabupaten && kec.kode_kec === parsedCode.kecamatan;
      } else if (parsedCode.kabupaten) {
        // Filter by province and kabupaten code only
        return matchProv && kec.kode_kab === parsedCode.kabupaten;
      } else {
        // Filter by province code only
        return matchProv;
      }
    });
    
    result.kecamatan = uniqueBy(
      kecamatanFiltered,
      (kec) => `${kec.kode_kec}|${kec.kec_nama}`
    );
  }
  
  // Search desa
  if (parsedCode.provinsi) {
    const desaFiltered = masterData.desa.filter(d => {
      const matchProv = d.kode_prov === parsedCode.provinsi;
      
      if (parsedCode.desa && parsedCode.kecamatan && parsedCode.kabupaten) {
        // Filter by full hierarchy
        return matchProv && d.kode_kab === parsedCode.kabupaten && 
               d.kode_kec === parsedCode.kecamatan && d.kode_desa === parsedCode.desa;
      } else if (parsedCode.kecamatan && parsedCode.kabupaten) {
        // Filter by province, kabupaten, and kecamatan code
        return matchProv && d.kode_kab === parsedCode.kabupaten && d.kode_kec === parsedCode.kecamatan;
      } else if (parsedCode.kabupaten) {
        // Filter by province and kabupaten code only
        return matchProv && d.kode_kab === parsedCode.kabupaten;
      } else {
        // Filter by province code only
        return matchProv;
      }
    });
    
    result.desa = uniqueBy(
      desaFiltered,
      (d) => `${d.kode_desa}|${d.desa_nama}`
    );
  }
  
  return result;
}
