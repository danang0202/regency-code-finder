import { Drawer, Text, Divider, Box } from "@mantine/core";
import { IconSearch, IconCommand, IconKeyboard } from '@tabler/icons-react';
import { formatProv, formatKab, formatKec, formatDesa, getTargetCol } from "../helper/kode-wilayah.helper";
import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";

interface MasterResult {
  provinsi: Array<{ kode_prov: string; nama_prov: string }>;
  kabupaten: Array<{ kode_kab: string; kab_nama: string; kode_prov: string; nama_prov: string }>;
  kecamatan: Array<{ kode_kec: string; kec_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string }>;
  desa: Array<{ kode_desa: string; desa_nama: string; kode_prov: string; nama_prov: string; kode_kab: string; kab_nama: string; kode_kec: string; kec_nama: string }>;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  value: string;
  cell: { row: number; col: number } | null;
  onSave: (newValue: string, extra?: { [colIdx: number]: string }) => void;
}

export default function CellDrawer({ opened, onClose, value, cell, onSave }: Props) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(value);
  const [debouncedSearch] = useDebouncedValue(search, 500);
  const [results, setResults] = useState<MasterResult | null>(null);

  useEffect(() => {
    if (opened) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 220); // delay agar drawer sudah muncul
      return () => clearTimeout(timer);
    }
  }, [opened]);

  // Shortcut Ctrl+F untuk fokus ke search bar
  useEffect(() => {
    if (!opened) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [opened]);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  // debouncedSearch handled by useDebounced


  useEffect(() => {
    if (!debouncedSearch) {
      if (results !== null) setResults(null);
      return;
    }
    fetch(`/v2/api/search-master?query=${encodeURIComponent(debouncedSearch)}`)
      .then(res => res.ok ? res.json() : null)
      .then((data: MasterResult | null) => {
        setResults(data);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);


  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={500}
      padding="md"
      title={cell ? `Edit baris ${cell.row + 1}, kolom ${cell.col + 1}` : "Edit Cell"}
    >
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          ref={searchInputRef}
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          autoFocus
          placeholder="Cari kode atau nama wilayah..."
          style={{
            width: '100%',
            fontSize: 15,
            padding: '12px 44px 12px 44px',
            borderRadius: 12,
            border: '2px solid #1976d2',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.07)',
            outline: 'none',
            fontWeight: 500,
            color: '#222',
            transition: 'border 0.2s',
          }}
        />
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#1976d2', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
          <IconSearch size={22} stroke={2} />
        </span>
      </div>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ color: '#888', marginLeft: 4 }}>Gunakan shortcut</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1976d2', fontWeight: 500 }}>
          <IconCommand size={16} stroke={2} /> + F
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1976d2', fontWeight: 500 }}>
          <IconKeyboard size={16} stroke={2} /> + F
        </span>
        <span style={{ color: '#888', marginLeft: 4 }}>untuk fokus ke pencarian</span>
      </div>
      <Divider
        my="sm"
        variant="dashed"
        labelPosition="center"
        label={
          <>
            <IconSearch size={12} />
            <Box ml={5}>Search results</Box>
          </>
        }
      />
      <div>
        {results && (
          <>
            {results.provinsi.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text fw={600} mb={4} size={'sm'}>Provinsi yang cocok:</Text>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {results.provinsi.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1px solid #e0e0e0',
                        background: '#f8fbff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s',
                        marginBottom: 4,
                      }}
                      onClick={() => {
                        // Selalu isi ke kolom kdprov_etl
                        if (cell) {
                          const extra: { [colName: string]: string } = {
                            [getTargetCol('prov')]: formatProv(row.kode_prov)
                          };
                          onSave(formatProv(row.kode_prov), extra);
                          onClose();
                        }
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e3f2fd'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f8fbff'}
                    >
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2', marginBottom: 2 }}>{formatProv(row.kode_prov)} - {row.nama_prov}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {results.kabupaten.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text fw={600} size={'sm'} mb={4}>Kabupaten/Kota yang cocok:</Text>
                <div style={{ maxHeight: 'auto', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                  {results.kabupaten.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1px solid #e0e0e0',
                        background: '#f8fbff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s',
                        marginBottom: 4,
                      }}
                      onClick={() => {
                        // Selalu isi ke kolom kdkab_etl (dan kdprov_etl jika ada)
                        if (cell) {
                          const extra: { [colName: string]: string } = {
                            [getTargetCol('prov')]: formatProv(row.kode_prov),
                            [getTargetCol('kab')]: formatKab(row.kode_kab)
                          };
                          onSave(formatKab(row.kode_kab), extra);
                          onClose();
                        }
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e3f2fd'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f8fbff'}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1976d2', marginBottom: 2 }}>{formatKab(row.kode_kab)} - {row.kab_nama}</div>
                      <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                        <span style={{ color: '#888' }}>Provinsi:</span> <b style={{ color: '#1976d2' }}>{row.nama_prov}</b>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {results.kecamatan.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text fw={600} size={'sm'} mb={4}>Kecamatan yang cocok:</Text>
                <div style={{ maxHeight: 'auto', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                  {results.kecamatan.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1px solid #e0e0e0',
                        background: '#f8fbff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s',
                        marginBottom: 4,
                      }}
                      onClick={() => {
                        // Selalu isi ke kolom kdkec_etl (dan kdkab_etl, kdprov_etl jika ada)
                        if (cell) {
                          const extra: { [colName: string]: string } = {
                            [getTargetCol('prov')]: formatProv(row.kode_prov),
                            [getTargetCol('kab')]: formatKab(row.kode_kab),
                            [getTargetCol('kec')]: formatKec(row.kode_kec)
                          };
                          onSave(formatKec(row.kode_kec), extra);
                          onClose();
                        }
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e3f2fd'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f8fbff'}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1976d2', marginBottom: 2 }}>{formatKec(row.kode_kec)} - {row.kec_nama}</div>
                      <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                        <span style={{ color: '#888' }}>Kabupaten:</span> <b style={{ color: '#1976d2' }}>{row.kab_nama}</b> &nbsp;|&nbsp; <span style={{ color: '#888' }}>Provinsi:</span> <b style={{ color: '#1976d2' }}>{row.nama_prov}</b>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {results.desa.length > 0 && (
              <div>
                <Text fw={600} size={'sm'} mb={4}>Desa yang cocok:</Text>
                <div style={{ maxHeight: 'auto', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                  {results.desa.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: '1px solid #e0e0e0',
                        background: '#f8fbff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s',
                        marginBottom: 4,
                      }}
                      onClick={() => {
                        // Selalu isi ke kolom kddesa_etl (dan kdkec_etl, kdkab_etl, kdprov_etl jika ada)
                        if (cell) {
                          const extra: { [colName: string]: string } = {
                            [getTargetCol('prov')]: formatProv(row.kode_prov),
                            [getTargetCol('kab')]: formatKab(row.kode_kab),
                            [getTargetCol('kec')]: formatKec(row.kode_kec),
                            [getTargetCol('desa')]: formatDesa(row.kode_desa)
                          };
                          onSave(formatDesa(row.kode_desa), extra);
                          onClose();
                        }
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e3f2fd'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f8fbff'}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1976d2', marginBottom: 2 }}>{formatDesa(row.kode_desa)} - {row.desa_nama}</div>
                      <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                        <span style={{ color: '#888' }}>Kecamatan:</span> <b style={{ color: '#1976d2' }}>{row.kec_nama}</b> &nbsp;|&nbsp; <span style={{ color: '#888' }}>Kabupaten:</span> <b style={{ color: '#1976d2' }}>{row.kab_nama}</b> &nbsp;|&nbsp; <span style={{ color: '#888' }}>Provinsi:</span> <b style={{ color: '#1976d2' }}>{row.nama_prov}</b>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {results.provinsi.length === 0 && results.kabupaten.length === 0 && results.kecamatan.length === 0 && results.desa.length === 0 && (
              <Text color="dimmed">Tidak ditemukan</Text>
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}
