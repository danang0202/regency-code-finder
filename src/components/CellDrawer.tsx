import { Drawer, TextInput, Button, Group, Text } from "@mantine/core";
import { Tooltip } from "@mantine/core";
import { formatKodeWilayah } from "../helper/formatKodeWilayah";
import { useEffect, useRef, useState } from "react";

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
  const [debouncedSearch, setDebouncedSearch] = useState(value);
  const [results, setResults] = useState<MasterResult | null>(null);

  useEffect(() => {
    if (opened && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [opened]);

  useEffect(() => {
    setSearch(value);
    setDebouncedSearch(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);


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
  }, [debouncedSearch]);

  // Helper usage for kode wilayah
  const formatProv = (kode: string) => formatKodeWilayah(kode, 2);
  const formatKab = (kode: string) => formatKodeWilayah(kode, 2);
  const formatKec = (kode: string) => formatKodeWilayah(kode, 3);
  const formatDesa = (kode: string) => formatKodeWilayah(kode, 3);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={500}
      padding="md"
      title={cell ? `Edit baris ${cell.row + 1}, kolom ${cell.col + 1}` : "Edit Cell"}
    >
      <TextInput
        ref={searchInputRef}
        label="Cari kode/nama wilayah"
        value={search}
        onChange={e => setSearch(e.currentTarget.value)}
        autoFocus
      />
      <Group mt="md">
        <Button
          onClick={() => {
            onSave(search);
            onClose();
          }}
          color="blue"
        >Simpan</Button>
        <Button variant="default" onClick={onClose}>Batal</Button>
      </Group>
      <div style={{ marginTop: 24 }}>
        {results && (
          <>
            {results.provinsi.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text fw={600} mb={4}>Provinsi yang cocok:</Text>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {results.provinsi.map((row, i) => (
                    <div
                      key={i}
                      style={{ padding: '4px 0', borderBottom: '1px solid #eee', cursor: 'pointer' }}
                      onClick={() => {
                        if (cell) {
                          onSave(formatProv(row.kode_prov));
                          onClose();
                        }
                      }}
                    >
                      <b>{formatProv(row.kode_prov)}</b> - {row.nama_prov}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {results.kabupaten.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text fw={600} mb={4}>Kabupaten/Kota yang cocok:</Text>
                <div style={{ maxHeight: 'auto', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                  {results.kabupaten.map((row, i) => (
                    <Tooltip
                      key={i}
                      label={<span>Provinsi: <b>{row.nama_prov}</b></span>}
                      position="bottom"
                      withArrow
                      color="#fff"
                      style={{ color: '#444', fontSize: 13 }}
                    >
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #e0e0e0',
                          background: '#f8fbff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                        }}
                        onClick={() => {
                          if (cell) {
                            const kodeArr = [formatProv(row.kode_prov), formatKab(row.kode_kab)];
                            const extra: { [colIdx: number]: string } = {};
                            for (let j = 0; j < kodeArr.length; j++) {
                              extra[cell.col - (kodeArr.length - 1 - j)] = kodeArr[j];
                            }
                            onSave(formatKab(row.kode_kab), extra);
                            onClose();
                          }
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2' }}>{formatKab(row.kode_kab)} - {row.kab_nama}</div>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
            {results.kecamatan.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text fw={600} mb={4}>Kecamatan yang cocok:</Text>
                <div style={{ maxHeight: 'auto', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                  {results.kecamatan.map((row, i) => (
                    <Tooltip
                      key={i}
                      label={<span>
                        Provinsi: <b>{row.nama_prov}</b><br />
                        Kabupaten: <b>{row.kab_nama}</b>
                      </span>}
                      position="bottom"
                      withArrow
                      color="#fff"
                      style={{ color: '#444', fontSize: 13 }}
                    >
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #e0e0e0',
                          background: '#f8fbff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                        }}
                        onClick={() => {
                          if (cell) {
                            const kodeArr = [formatProv(row.kode_prov), formatKab(row.kode_kab), formatKec(row.kode_kec)];
                            const extra: { [colIdx: number]: string } = {};
                            for (let j = 0; j < kodeArr.length; j++) {
                              extra[cell.col - (kodeArr.length - 1 - j)] = kodeArr[j];
                            }
                            onSave(formatKec(row.kode_kec), extra);
                            onClose();
                          }
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2' }}>{formatKec(row.kode_kec)} - {row.kec_nama}</div>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
            {results.desa.length > 0 && (
              <div>
                <Text fw={600} mb={4}>Desa yang cocok:</Text>
                <div style={{ maxHeight: 'auto', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                  {results.desa.map((row, i) => (
                    <Tooltip
                      key={i}
                      label={<span>
                        Provinsi: <b>{row.nama_prov}</b><br />
                        Kabupaten: <b>{row.kab_nama}</b><br />
                        Kecamatan: <b>{row.kec_nama}</b>
                      </span>}
                      position="top"
                      withArrow
                      color="#fff"
                      style={{ color: '#444', fontSize: 13 }}
                    >
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #e0e0e0',
                          background: '#f8fbff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                        }}
                        onClick={() => {
                          if (cell) {
                            const kodeArr = [formatProv(row.kode_prov), formatKab(row.kode_kab), formatKec(row.kode_kec), formatDesa(row.kode_desa)];
                            const extra: { [colIdx: number]: string } = {};
                            for (let j = 0; j < kodeArr.length; j++) {
                              extra[cell.col - (kodeArr.length - 1 - j)] = kodeArr[j];
                            }
                            onSave(formatDesa(row.kode_desa), extra);
                            onClose();
                          }
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2' }}>{formatDesa(row.kode_desa)} - {row.desa_nama}</div>
                      </div>
                    </Tooltip>
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
