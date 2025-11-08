"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Text, Loader, Container, ActionIcon } from "@mantine/core";
import CellDrawer from "../../../components/CellDrawer";
import { IconSearch } from '@tabler/icons-react';
import { MantineReactTable } from 'mantine-react-table';
import * as XLSX from "xlsx";

export default function ProsesDetailPage() {
  const { fileId } = useParams();
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelValue, setPanelValue] = useState("");
  const [panelCell, setPanelCell] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!fileId) return;
      let metaObj: { separator: string; fileType: string; originalName?: string; fileName?: string } = { separator: ";", fileType: "csv", fileName: "" };
      try {
  const metaRes = await fetch(`/v2/api/file/${fileId}?meta=true`);
        if (metaRes.ok) metaObj = await metaRes.json();
      } catch { }
  const res = await fetch(`/v2/api/file/${fileId}`);
      const blob = await res.blob();
      if (metaObj.fileType === "csv") {
        const text = await blob.text();
        if (!text.includes(metaObj.separator)) {
          setRows([]);
          setLoading(false);
          return;
        }
        const lines = text.split(/\r?\n/).filter(Boolean);
        const data = lines.map((l) => l.split(metaObj.separator));
        setRows(data);
      } else if (metaObj.fileType === "excel") {
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
        setRows(data);
      } else {
        setRows([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [fileId]);

  return (
    <div>
      <Container size="xl" py={'xs'} style={{ maxWidth: '98vw', paddingBottom: 32 }}>
        {loading ? (
          <Loader />
        ) : rows.length > 0 ? (
          <>
            <MantineReactTable
            
              columns={rows[0].map((header, idx) => ({
                accessorKey: `col${idx}`,
                header: header.replace(/^['"]|['"]$/g, ""),
                enableColumnOrdering: true,
                enablePinning: true,
                Cell: ({ cell, row }) => {
                  const value = cell.getValue<string>();
                  const isHovered = hoveredCell && hoveredCell.row === row.index && hoveredCell.col === idx;
                  const [editing, setEditing] = useState(false);
                  const [editValue, setEditValue] = useState(value);
                  const inputRef = useRef<HTMLInputElement>(null);

                  useEffect(() => {
                    if (editing && inputRef.current) {
                      inputRef.current.focus();
                    }
                  }, [editing]);

                  if (editing) {
                    return (
                      <input
                        ref={inputRef}
                        value={editValue}
                        style={{ width: '100%', minHeight: 32, fontSize: 12, padding: 4 }}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => {
                          setEditing(false);
                          // Simpan perubahan ke state rows
                          setRows(prevRows => {
                            const newRows = [...prevRows];
                            newRows[row.index + 1][idx] = editValue;
                            return newRows;
                          });
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            setEditing(false);
                            setPanelOpen(true);
                            setPanelValue(editValue);
                            setPanelCell({ row: row.index, col: idx });
                          }
                        }}
                      />
                    );
                  }
                  return (
                    <div
                      style={{ cursor: 'pointer', padding: 4, minHeight: 32, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'visible' }}
                      onMouseEnter={() => setHoveredCell({ row: row.index, col: idx })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => {
                        setEditing(true);
                        setEditValue(value);
                      }}
                    >
                      <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', width: '100%' }}>{value}</span>
                      {isHovered && (
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="blue"
                          style={{ marginLeft: 4, zIndex: 9999 }}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            window.open(`https://www.google.com/search?q=${encodeURIComponent(value)}`, '_blank');
                          }}
                        >
                          <IconSearch size={16} />
                        </ActionIcon>
                      )}
                    </div>
                  );
                },
              }))}
              data={rows.slice(1).map((row) => {
                const obj: Record<string, string> = {};
                row.forEach((cell, idx) => {
                  obj[`col${idx}`] = cell;
                });
                return obj;
              })}
              enableColumnResizing
              enableStickyHeader
              enableStickyFooter={false}
              enableColumnOrdering
              enablePinning
              enablePagination={false}
              mantineTableProps={{
                striped: true,
                highlightOnHover: true,
                withColumnBorders: true,
                style: {
                  borderRadius: 8,
                  border: "1px solid #eee",
                  background: "#fafbfc",
                  tableLayout: 'fixed',
                },
              }}
              mantineTableContainerProps={{
                style: {
                  maxHeight: '80vh',
                  overflowY: 'auto',
                }
              }}
              mantineTableHeadCellProps={{
                style: { fontSize: 12, fontWeight: 600, background: "#fff" },
              }}
              mantineTableBodyCellProps={{
                style: { fontSize: 12, padding: '4px 8px' },
              }}
              // pagination dihapus, semua data langsung tampil
              mantinePaperProps={{
                shadow: "0px",
                withBorder: false
              }}
            />
            <CellDrawer
              opened={panelOpen}
              onClose={() => setPanelOpen(false)}
              value={panelValue}
              cell={panelCell}
              onSave={(newValue: string, extra?: { [colName: string]: string }) => {
                if (panelCell) {
                  let newRows = [...rows];
                  let headerRow = newRows[0];
                  let changed = false;
                  // Normalisasi header: trim, lowercase, hapus kutip
                  const normalize = (s: string) => s.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
                  const normalizedHeader = headerRow.map(h => normalize(h));
                  if (extra) {
                    // Jika ada extra, hanya isi kolom-kolom di extra
                    Object.entries(extra).forEach(([colName, kodeValue]) => {
                      const normColName = normalize(colName);
                      let colIdx = normalizedHeader.indexOf(normColName);
                      if (colIdx === -1) {
                        // Cari nama header yang identik (case-insensitive, tanpa kutip)
                        const existingHeader = headerRow.find(h => normalize(h) === normColName);
                        if (existingHeader) {
                          colIdx = headerRow.indexOf(existingHeader);
                        } else {
                          // Tambahkan kolom baru jika benar-benar belum ada
                          headerRow = [...headerRow, colName.trim()];
                          newRows[0] = headerRow;
                          newRows = newRows.map((row, i) => i === 0 ? row : [...row, ""]);
                          colIdx = headerRow.length - 1;
                          changed = true;
                          normalizedHeader.push(normColName);
                        }
                      }
                      newRows[panelCell.row + 1][colIdx] = kodeValue;
                    });
                    if (changed) setRows(newRows); // update header jika berubah
                  } else {
                    // Jika tidak ada extra, isi cell awal drawer
                    newRows[panelCell.row + 1][panelCell.col] = newValue;
                  }
                  setRows(newRows);
                }
                setPanelOpen(false);
              }}
            />
          </>
        ) : (
          <Text color="red">Data tidak ditemukan atau file kosong.</Text>
        )}
      </Container>
    </div>
  );
}
