// Import style dari global CSS di layout atau globals.css
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      if (!fileId) return;
      let metaObj: { separator: string; fileType: string; originalName?: string; fileName?: string } = { separator: ";", fileType: "csv", fileName: "" };
      try {
        const metaRes = await fetch(`/api/file/${fileId}?meta=true`);
        if (metaRes.ok) metaObj = await metaRes.json();
      } catch { }
      const res = await fetch(`/api/file/${fileId}`);
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
    <div style={{ minHeight: "80vh", }}>
      <Container size="xl" py={'xs'} style={{ maxWidth: '98vw' }}>
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
                  return (
                    <div
                      style={{ cursor: 'pointer', padding: 4, minHeight: 32, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'visible' }}
                      onMouseEnter={() => setHoveredCell({ row: row.index, col: idx })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => {
                        setPanelOpen(true);
                        setPanelValue(value);
                        setPanelCell({ row: row.index, col: idx });
                        setTimeout(() => {
                          if (searchInputRef.current) searchInputRef.current.focus();
                        }, 150);
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{value}</span>
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
              mantineTableProps={{
                striped: true,
                highlightOnHover: true,
                withColumnBorders: true,
                style: { borderRadius: 8, border: "1px solid #eee", background: "#fafbfc" },
              }}
              mantineTableHeadCellProps={{
                style: { fontSize: 13, fontWeight: 600, background: "#f0f0f0" },
              }}
              mantineTableBodyCellProps={{
                style: { fontSize: 12 },
              }}
              paginationDisplayMode="pages"
              mantinePaginationProps={{
                size: 'sm'
              }}
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
              onSave={(newValue: string, extra?: { [colIdx: number]: string }) => {
                if (panelCell) {
                  const newRows = [...rows];
                  newRows[panelCell.row + 1][panelCell.col] = newValue;
                  if (extra) {
                    // Pastikan urutan: kodeArr[0] (prov) ke cell paling kiri, kodeArr[n-1] (desa/kec/kab) ke cell yang ditekan
                    const kodeArr = Object.values(extra);
                    for (let j = 0; j < kodeArr.length; j++) {
                      const targetCol = panelCell.col - (kodeArr.length - 1 - j);
                      newRows[panelCell.row + 1][targetCol] = kodeArr[j];
                    }
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
