export function formatKodeWilayah(kode: string, len: number): string {
  if (!kode) return ''.padStart(len, '0');
  return kode.padStart(len, '0');
}
