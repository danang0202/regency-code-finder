/**
 * Master region search utilities
 */

export interface MasterResult {
  provinsi: Array<{ kode_prov: string; nama_prov: string }>;
  kabupaten: Array<{ kode_kab: string; kab_nama: string; kode_prov: string; nama_prov: string }>;
  kecamatan: Array<{ kode_kec: string; kec_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string }>;
  desa: Array<{ kode_desa: string; desa_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string; kode_kec: string; kec_nama: string }>;
}

/**
 * Search master region data from API
 */
export async function searchMasterRegion(query: string): Promise<MasterResult | null> {
  if (!query.trim()) {
    return null;
  }

  try {
    const response = await fetch(`/v2/api/search-master?query=${encodeURIComponent(query)}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Region item component props interface
 */
export interface RegionItemProps {
  onClick: () => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Common region item styles
 */
export const regionItemStyles: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #e0e0e0',
  background: '#f8fbff',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  cursor: 'pointer',
  position: 'relative',
  transition: 'background 0.2s',
  marginBottom: 4,
};

/**
 * Region item hover handlers
 */
export const regionItemHoverHandlers = {
  onMouseEnter: (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.background = '#e3f2fd';
  },
  onMouseLeave: (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.background = '#f8fbff';
  }
};