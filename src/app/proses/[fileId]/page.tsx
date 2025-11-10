"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Text, Loader, Container, ActionIcon, Pagination, Group, Paper, Center, Stack, Button } from "@mantine/core";
import { IconDatabaseOff, IconDeviceFloppy, IconDisc, IconFileTypeXls } from '@tabler/icons-react';
import CellDrawer from "../../../components/CellDrawer";
import { IconSearch } from '@tabler/icons-react';
import { MantineReactTable, MRT_GlobalFilterTextInput, MRT_ShowHideColumnsButton, MRT_ToggleFiltersButton, useMantineReactTable, type MRT_ColumnDef } from 'mantine-react-table';

export default function ProsesDetailPage() {
  const { fileId } = useParams();
  const [header, setHeader] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]); // Menyimpan semua data untuk auto-save
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelValue, setPanelValue] = useState("");
  const [panelCell, setPanelCell] = useState<{ row: number; col: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const limit = 10;

  const saveChanges = useCallback(async () => {
    if (!hasChanges || !fileId) return;
    try {
      const response = await fetch(`/v2/api/file/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          header,
          allRows
        }),
      });
      if (response.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }, [fileId, header, allRows]);

  // Fetch data with pagination
  const fetchData = useCallback(async (page = 1) => {
    if (!fileId) return;
    setLoading(true);
    try {
      const res = await fetch(`/v2/api/file/${fileId}?page=${page}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setHeader(data.header || []);
        setRows(data.rows || []);
        setTotalRows(data.totalRows || 0);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(page);

        // Load all data untuk auto-save hanya sekali saat load awal
        if (page === 1 && allRows.length === 0 && data.totalRows > 0) {
          const allRes = await fetch(`/v2/api/file/${fileId}?page=1&limit=${data.totalRows}`);
          if (allRes.ok) {
            const allData = await allRes.json();
            setAllRows(allData.rows || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setRows([]);
    }
    setLoading(false);
  }, [fileId]);

  useEffect(() => {
    if (fileId) {
      fetchData(1);
    }
  }, [fileId]);

  // Handle page change dengan auto-save
  const handlePageChange = async (page: number) => {
    await saveChanges();
    await fetchData(page);
  };

  // Define table columns
  const columns = useMemo<MRT_ColumnDef<Record<string, string>>[]>(
    () => header.map((headerName, idx) => ({
      accessorKey: `col${idx}`,
      header: headerName.replace(/^['"]|['"]$/g, ""),
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
                setRows(prevRows => {
                  const newRows = [...prevRows];
                  newRows[row.index][idx] = editValue;
                  return newRows;
                });
                setAllRows(prevAllRows => {
                  const newAllRows = [...prevAllRows];
                  const globalRowIndex = (currentPage - 1) * limit + row.index;
                  if (newAllRows[globalRowIndex]) {
                    newAllRows[globalRowIndex][idx] = editValue;
                  }
                  return newAllRows;
                });
                setHasChanges(true);
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
    })),
    [header, hoveredCell, currentPage, limit]
  );

  // Table data
  const tableData = useMemo(() =>
    rows.map((row) => {
      const obj: Record<string, string> = {};
      row.forEach((cell, idx) => {
        obj[`col${idx}`] = cell || "";
      });
      return obj;
    }),
    [rows]
  );

  // Configure table instance
  const table = useMantineReactTable({
    columns,
    data: tableData,
    enableColumnResizing: true,
    enableStickyHeader: true,
    enableStickyFooter: false,
    enableColumnOrdering: true,
    enablePinning: true,
    enablePagination: false,
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withColumnBorders: true,
      withBorder: true,
      style: {
        tableLayout: 'fixed',
      },
    },
    mantineTableContainerProps: {
      style: {
        maxHeight: '70vh',
      }
    },
    mantineTableBodyCellProps: {
      style: { fontSize: 12, padding: '4px 8px' },
    },
    mantinePaperProps: {
      shadow: "0px",
      withBorder: false
    },
    renderTopToolbar: ({ table }) => {
      return (
        <Group position="apart" mb="xs" spacing={5}>
          <Group>
            <MRT_ShowHideColumnsButton table={table} />
            <MRT_ToggleFiltersButton table={table} />
          </Group>
          <Group>
            <Button
              size="sm"
              color={hasChanges ? "blue" : "gray"}
              leftIcon={<IconDeviceFloppy size={16} />}
              onClick={saveChanges}
              loading={loading}
              disabled={!hasChanges}
            >
              Simpan
            </Button>
            <Button
              size="sm"
              color="green"
              leftIcon={<IconFileTypeXls size={16} />} 
              variant="filled"
              onClick={async () => {
                if (!fileId) return;
                try {
                  const res = await fetch(`/v2/api/file/${fileId}/download`);
                  if (!res.ok) return;
                  const blob = await res.blob();
                  let filename = `data_${fileId}.csv`;
                  const disposition = res.headers.get('Content-Disposition');
                  if (disposition) {
                    const match = disposition.match(/filename="?([^";]+)"?/);
                    if (match) filename = match[1];
                  }
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  }, 100);
                } catch (err) {
                  // Optionally show error
                }
              }}
            >
              Download
            </Button>
          </Group>
        </Group>
      );
    }
  });

  return (
    <div>
      <Container size="xl" py={'xs'} style={{ maxWidth: '98vw', position: 'relative' }}>
        {header.length > 0 ? (
          <>
            <MantineReactTable table={table} />

            <Group position="apart">
              <div>
                <Text size="sm" color="dimmed">
                  Menampilkan {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, totalRows)} dari {totalRows} data
                </Text>
              </div>
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={handlePageChange}
                size="md"
              />
            </Group>

            <CellDrawer
              opened={panelOpen}
              onClose={() => setPanelOpen(false)}
              value={panelValue}
              cell={panelCell}
              onSave={(newValue: string, extra?: { [colName: string]: string }) => {
                if (panelCell) {
                  let newRows = [...rows];
                  let headerRow = [...header];
                  let changed = false;

                  // Normalisasi header: trim, lowercase, hapus kutip
                  const normalize = (s: string) => s.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
                  const normalizedHeader = headerRow.map(h => normalize(h));

                  if (extra) {
                    // Jika ada extra, isi kolom-kolom di extra
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
                          colIdx = headerRow.length - 1;
                          changed = true;
                          normalizedHeader.push(normColName);

                          // Extend semua rows dengan kolom baru
                          newRows = newRows.map(row => [...row, ""]);
                          setAllRows(prevAllRows => prevAllRows.map(row => [...row, ""]));
                        }
                      }

                      // Update current page data
                      newRows[panelCell.row][colIdx] = kodeValue;

                      // Update allRows untuk auto-save
                      setAllRows(prevAllRows => {
                        const newAllRows = [...prevAllRows];
                        const globalRowIndex = (currentPage - 1) * limit + panelCell.row;
                        if (newAllRows[globalRowIndex]) {
                          if (!newAllRows[globalRowIndex][colIdx]) {
                            newAllRows[globalRowIndex] = [...newAllRows[globalRowIndex], ""];
                          }
                          newAllRows[globalRowIndex][colIdx] = kodeValue;
                        }
                        return newAllRows;
                      });
                    });

                    if (changed) {
                      setHeader(headerRow);
                    }
                  } else {
                    // Jika tidak ada extra, isi cell awal drawer
                    newRows[panelCell.row][panelCell.col] = newValue;

                    // Update allRows untuk auto-save
                    setAllRows(prevAllRows => {
                      const newAllRows = [...prevAllRows];
                      const globalRowIndex = (currentPage - 1) * limit + panelCell.row;
                      if (newAllRows[globalRowIndex]) {
                        newAllRows[globalRowIndex][panelCell.col] = newValue;
                      }
                      return newAllRows;
                    });
                  }

                  setRows(newRows);
                  setHasChanges(true);
                }
                setPanelOpen(false);
              }}
            />

            {loading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(255,255,255,0.6)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Loader size="lg" variant="dots" />
              </div>
            )}
          </>
        ) : (
          <Center style={{ minHeight: '40vh' }}>
            <Paper shadow="md" radius="md" p="xl" withBorder style={{ background: '#fff6f6', borderColor: '#ffe0e0', minWidth: 340 }}>
              <Stack align="center" spacing="xs">
                <IconDatabaseOff size={48} color="#fa5252" />
                <Text size="lg" weight={700} color="#fa5252">
                  Data tidak ditemukan
                </Text>
                <Text size="sm" color="dimmed" align="center">
                  File kosong, rusak, atau format tidak sesuai.<br />
                  <span style={{ color: '#fa5252', fontWeight: 500 }}>Silakan upload ulang file yang valid.</span>
                </Text>
              </Stack>
            </Paper>
          </Center>
        )}
      </Container>
    </div>
  );
}
