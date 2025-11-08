// Helper untuk format kode wilayah dan penentuan kolom target
export function formatKodeWilayah(kode: string, len: number): string {
  if (!kode) return ''.padStart(len, '0');
  return kode.padStart(len, '0');
}

export const formatProv = (kode: string) => formatKodeWilayah(kode, 2);
export const formatKab = (kode: string) => formatKodeWilayah(kode, 2);
export const formatKec = (kode: string) => formatKodeWilayah(kode, 3);
export const formatDesa = (kode: string) => formatKodeWilayah(kode, 3);

export const getTargetCol = (jenis: 'prov' | 'kab' | 'kec' | 'desa') => {
  switch (jenis) {
    case 'prov': return 'kdprov_etl';
    case 'kab': return 'kdkab_etl';
    case 'kec': return 'kdkec_etl';
    case 'desa': return 'kddesa_etl';
    default: return '';
  }
};
