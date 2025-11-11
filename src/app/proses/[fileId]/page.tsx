"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Text, Loader, Container, ActionIcon, Pagination, Group, Paper, Center, Stack, Button, Modal, Select } from "@mantine/core";
import { IconDatabaseOff, IconDeviceFloppy, IconFileTypeXls } from '@tabler/icons-react';
import CellDrawer from "../../../components/CellDrawer";
import { IconSearch } from '@tabler/icons-react';
import { MantineReactTable, MRT_ShowHideColumnsButton, MRT_ToggleFiltersButton, useMantineReactTable, type MRT_ColumnDef } from 'mantine-react-table';
import { ActiveUsers } from "@/components/ActiveUsers";
import { RealtimeNotifications } from "@/components/RealtimeNotifications";
import { useSocket } from "@/hooks/useSocket";

export default function ProsesDetailPage() {
  // ...existing code...
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ [colIdx: number]: string }>({});
  const { fileId } = useParams();
  const [header, setHeader] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]); // Menyimpan semua data untuk auto-save
  const [loading, setLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  
  // Track specific cell changes for incremental updates (using existing pendingChanges)
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelValue, setPanelValue] = useState("");
  const [panelCell, setPanelCell] = useState<{ row: number; col: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: { rowIndex: string; columnIndex: number; oldValue: string; newValue: string } }>({});
  const limit = 10;

  // Socket.IO integration
  const { 
    isConnected, 
    joinFileRoom, 
    leaveFileRoom, 
    emitFileUpdate, 
    onFileUpdated 
  } = useSocket();



  const saveChanges = useCallback(async () => {
    if (!hasChanges || !fileId || Object.keys(pendingChanges).length === 0) return;
    try {
      // Send only the specific changes, not the entire dataset
      const response = await fetch(`/v2/api/file/${fileId}/update-cells`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          changes: Object.values(pendingChanges)
        }),
      });
      if (response.ok) {
        setHasChanges(false);
        setPendingChanges({}); // Clear pending changes after successful save
        
                  // Emit real-time update to notify other users that data has been saved
        if (isConnected) {
          const changes = Object.values(pendingChanges);
          console.log(`Data saved, emitting ${changes.length} cell changes to other users`);
          
          // Add visual confirmation
          const successDiv = document.createElement('div');
          successDiv.innerHTML = `✅ ${changes.length} perubahan tersimpan & dikirim`;
          successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 1px solid rgba(255,255,255,0.2);
            animation: slideInRight 0.3s ease-out;
          `;
          
          // Add CSS animation for success notification
          if (!document.getElementById('success-animations')) {
            const style = document.createElement('style');
            style.id = 'success-animations';
            style.textContent = `
              @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { translate: translateX(100%); opacity: 0; }
              }
            `;
            document.head.appendChild(style);
          }
          
          document.body.appendChild(successDiv);
          
          // Smooth fade out
          setTimeout(() => {
            successDiv.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
              if (document.body.contains(successDiv)) {
                document.body.removeChild(successDiv);
              }
            }, 300);
          }, 2500);
          
          // Emit specific cell changes for each change made
          changes.forEach(change => {
            emitFileUpdate(fileId as string, 'update', {
              rowIndex: change.rowIndex,
              columnIndex: change.columnIndex,
              oldValue: change.oldValue,
              newValue: change.newValue,
              timestamp: new Date().toISOString()
            }, change.rowIndex);
          });
        }
      }
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }, [fileId, pendingChanges, hasChanges, isConnected, emitFileUpdate]);

  // Fetch data with pagination
  const fetchData = useCallback(async (page = 1, filters = activeFilters, silent = false) => {
    if (!fileId) return;
    if (!silent) {
      setLoading(true);
    } else {
      setSilentLoading(true);
    }
    try {
      // Build filter query string
      const filterQuery = Object.entries(filters)
        .filter(([, v]) => v)
        .map(([colIdx, value]) => `filter[${colIdx}]=${encodeURIComponent(value)}`)
        .join('&');
      const url = `/v2/api/file/${fileId}?page=${page}&limit=${limit}${filterQuery ? `&${filterQuery}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHeader(data.header || []);
        setRows(data.rows || []);
        setTotalRows(data.totalRows || 0);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(page);

        // Load all data untuk auto-save hanya sekali saat load awal (tanpa filter)
        if (page === 1 && allRows.length === 0 && data.totalRows > 0 && Object.keys(filters).length === 0) {
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
    if (!silent) {
      setLoading(false);
    } else {
      setSilentLoading(false);
    }
  }, [fileId, activeFilters, allRows.length]);

  // Join socket room when file opens
  useEffect(() => {
    if (fileId && isConnected) {
      joinFileRoom(fileId as string);
      
      return () => {
        leaveFileRoom(fileId as string);
      };
    }
  }, [fileId, isConnected, joinFileRoom, leaveFileRoom]);

  // Listen for real-time updates from other users
  useEffect(() => {
    if (!fileId) return;
    


    const unsubscribe = onFileUpdated((event) => {
      console.log('Received file update:', event);
      
        // Apply specific cell changes if provided, otherwise fallback to full refresh
      if (event.data && typeof event.data.rowIndex === 'string' && typeof event.data.columnIndex === 'number' && typeof event.data.newValue === 'string') {
        const { rowIndex: rowIndexValue, columnIndex, newValue } = event.data as { rowIndex: string; columnIndex: number; newValue: string };
        
        // Find the row in current page by row_index
        const pageRowIndex = rows.findIndex(row => row[0] === rowIndexValue);
        
        // Update the specific cell if it's on current page
        if (pageRowIndex !== -1 && columnIndex >= 0 && columnIndex < header.length) {
          console.log(`Applying specific cell update: row_index ${rowIndexValue} (page row ${pageRowIndex}), col ${columnIndex}, value: ${newValue}`);
          
          // Update current page rows
          setRows(prevRows => {
            const newRows = [...prevRows];
            newRows[pageRowIndex][columnIndex] = newValue;
            return newRows;
          });
          
          // Update allRows as well
          setAllRows(prevAllRows => {
            const newAllRows = [...prevAllRows];
            const allRowIndex = newAllRows.findIndex(r => r[0] === rowIndexValue);
            if (allRowIndex !== -1) {
              newAllRows[allRowIndex][columnIndex] = newValue;
            }
            return newAllRows;
          });
        }
        
        // Show specific cell update notification
        const notificationDiv = document.createElement('div');
        const cellName = header[columnIndex]?.replace(/^['"]|['"]$/g, "") || `Col ${columnIndex}`;
        notificationDiv.innerHTML = `📝 ${event.username || 'User lain'} mengubah "${cellName}" di baris dengan ID ${rowIndexValue}`;
        notificationDiv.style.cssText = `
          position: fixed;
          top: 80px;
          left: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          z-index: 10001;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          animation: slideInLeft 0.3s ease-out;
        `;
        
        // Add CSS animation if not exists
        if (!document.getElementById('realtime-animations')) {
          const style = document.createElement('style');
          style.id = 'realtime-animations';
          style.textContent = `
            @keyframes slideInLeft {
              from { transform: translateX(-100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutLeft {
              from { transform: translateX(0); opacity: 1; }
              to { transform: translateX(-100%); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }
        
        document.body.appendChild(notificationDiv);
        
        // Smooth fade out
        setTimeout(() => {
          notificationDiv.style.animation = 'slideOutLeft 0.3s ease-in';
          setTimeout(() => {
            if (document.body.contains(notificationDiv)) {
              document.body.removeChild(notificationDiv);
            }
          }, 300);
        }, 3500);
        
      } else {
        // Fallback: show generic notification and refresh data
        const notificationDiv = document.createElement('div');
        notificationDiv.innerHTML = `🔄 Data diperbarui oleh ${event.username || 'user lain'}`;
        notificationDiv.style.cssText = `
          position: fixed;
          top: 80px;
          left: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          z-index: 10001;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.2);
          animation: slideInLeft 0.3s ease-out;
        `;
        
        document.body.appendChild(notificationDiv);
        setTimeout(() => {
          notificationDiv.style.animation = 'slideOutLeft 0.3s ease-in';
          setTimeout(() => document.body.contains(notificationDiv) && document.body.removeChild(notificationDiv), 300);
        }, 3500);
        
        // Refresh data silently without showing loading overlay
        fetchData(currentPage, activeFilters, true);
      }
    });

    return unsubscribe;
  }, [fileId, onFileUpdated, currentPage, activeFilters, fetchData, header, rows]);

  // Keyboard shortcut handler for Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault(); // Prevent browser's default save dialog
        
        // Only save if there are changes
        if (hasChanges && Object.keys(pendingChanges).length > 0) {
          console.log('Keyboard shortcut triggered save');
          saveChanges();
        }
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasChanges, pendingChanges, saveChanges]);

  useEffect(() => {
    if (fileId) {
      fetchData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  // Refetch data when filters change
  useEffect(() => {
    if (fileId) {
      fetchData(1, activeFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters]);
  // Handle page change dengan auto-save
  const handlePageChange = async (page: number) => {
    await saveChanges();
    await fetchData(page, activeFilters);
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
                const oldValue = value;
                if (oldValue !== editValue) {
                  // Get row_index from the first column (index 0)
                  const rowIndexValue = rows[row.index][0]; // row_index is always in column 0
                  
                  // Update rows display
                  setRows(prevRows => {
                    const newRows = [...prevRows];
                    newRows[row.index][idx] = editValue;
                    return newRows;
                  });
                  
                  // Update allRows for complete data
                  setAllRows(prevAllRows => {
                    const newAllRows = [...prevAllRows];
                    // Find the row with matching row_index
                    const allRowIndex = newAllRows.findIndex(r => r[0] === rowIndexValue);
                    if (allRowIndex !== -1) {
                      newAllRows[allRowIndex][idx] = editValue;
                    }
                    return newAllRows;
                  });
                  
                  // Track this specific change for incremental updates using row_index
                  const changeKey = `${rowIndexValue}-${idx}`;
                  setPendingChanges(prevChanges => ({
                    ...prevChanges,
                    [changeKey]: {
                      rowIndex: rowIndexValue, // Use row_index value instead of array index
                      columnIndex: idx,
                      oldValue,
                      newValue: editValue
                    }
                  }));
                  
                  setHasChanges(true);
                  console.log(`Cell change tracked: row_index ${rowIndexValue}, col ${idx}, ${oldValue} → ${editValue}`);
                }
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
    [header, hoveredCell, rows]
  );

  // Table data: use backend-paginated rows only
  const tableData = useMemo(() => {
    return rows.map((row) => {
      const obj: Record<string, string> = {};
      row.forEach((cell, idx) => {
        obj[`col${idx}`] = cell || "";
      });
      return obj;
    });
  }, [rows]);

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
            <Button size="sm" variant="outline" onClick={() => setFilterModalOpen(true)}>
              Filter Data
            </Button>
          </Group>
          <Group>
            <Button
              size="sm"
              color={hasChanges ? "blue" : "gray"}
              leftIcon={<IconDeviceFloppy size={16} />}
              onClick={saveChanges}
              loading={loading}
              disabled={!hasChanges}
              title={`Simpan (${navigator.platform.includes('Mac') ? '⌘+S' : 'Ctrl+S'})`}
            >
              Simpan {hasChanges && <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '4px' }}>({navigator.platform.includes('Mac') ? '⌘+S' : 'Ctrl+S'})</span>}
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
                } catch {
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
            {/* Real-time components */}
            <Group position="apart" mb="md">
              <div>
                <Text size="lg" weight={500}>File: {fileId}</Text>
              </div>
              <ActiveUsers fileId={fileId as string} />
            </Group>
            
            <MantineReactTable table={table} />
            <Modal
              opened={filterModalOpen}
              onClose={() => setFilterModalOpen(false)}
              title="Filter Data"
              size="md"
            >
              <Stack>
                {header.map((col, idx) => (
                  <Select
                    key={idx}
                    label={col.replace(/^['"]|['"]$/g, "")}
                    placeholder={`Pilih nilai untuk ${col}`}
                    data={Array.from(new Set(allRows.map(row => row[idx]).filter(Boolean))).map(v => ({ value: v, label: v }))}
                    value={activeFilters[idx] || ''}
                    onChange={val => {
                      setActiveFilters(f => ({ ...f, [idx]: val || '' }));
                    }}
                    clearable
                  />
                ))}
                <Group position="right">
                  <Button size="sm" onClick={() => { setFilterModalOpen(false); }}>
                    Terapkan
                  </Button>
                  <Button size="sm" variant="outline" color="red" onClick={() => { setActiveFilters({}); setFilterModalOpen(false); }}>
                    Reset
                  </Button>
                </Group>
              </Stack>
            </Modal>

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
                      const oldValue = newRows[panelCell.row][colIdx] || '';
                      newRows[panelCell.row][colIdx] = kodeValue;

                      // Update allRows untuk auto-save
                      setAllRows(prevAllRows => {
                        const newAllRows = [...prevAllRows];
                        const rowIndexValue = rows[panelCell.row][0]; // row_index is in column 0
                        // Find the row with matching row_index
                        const allRowIndex = newAllRows.findIndex(r => r[0] === rowIndexValue);
                        if (allRowIndex !== -1) {
                          if (!newAllRows[allRowIndex][colIdx]) {
                            newAllRows[allRowIndex] = [...newAllRows[allRowIndex], ""];
                          }
                          newAllRows[allRowIndex][colIdx] = kodeValue;
                        }
                        return newAllRows;
                      });

                      // Track this change for incremental updates using row_index
                      const rowIndexValue = rows[panelCell.row][0]; // row_index is in column 0
                      const changeKey = `${rowIndexValue}-${colIdx}`;
                      setPendingChanges(prevChanges => ({
                        ...prevChanges,
                        [changeKey]: {
                          rowIndex: rowIndexValue,
                          columnIndex: colIdx,
                          oldValue,
                          newValue: kodeValue
                        }
                      }));
                      console.log(`CellDrawer change tracked (extra): row_index ${rowIndexValue}, col ${colIdx}, ${oldValue} → ${kodeValue}`);
                    });

                    if (changed) {
                      setHeader(headerRow);
                    }
                  } else {
                    // Jika tidak ada extra, isi cell awal drawer
                    const oldValue = newRows[panelCell.row][panelCell.col] || '';
                    newRows[panelCell.row][panelCell.col] = newValue;

                    // Update allRows untuk auto-save
                    setAllRows(prevAllRows => {
                      const newAllRows = [...prevAllRows];
                      const rowIndexValue = rows[panelCell.row][0]; // row_index is in column 0
                      // Find the row with matching row_index
                      const allRowIndex = newAllRows.findIndex(r => r[0] === rowIndexValue);
                      if (allRowIndex !== -1) {
                        newAllRows[allRowIndex][panelCell.col] = newValue;
                      }
                      return newAllRows;
                    });

                    // Track this change for incremental updates using row_index
                    const rowIndexValue = rows[panelCell.row][0]; // row_index is in column 0
                    const changeKey = `${rowIndexValue}-${panelCell.col}`;
                    setPendingChanges(prevChanges => ({
                      ...prevChanges,
                      [changeKey]: {
                        rowIndex: rowIndexValue,
                        columnIndex: panelCell.col,
                        oldValue,
                        newValue
                      }
                    }));
                    console.log(`CellDrawer change tracked (main): row_index ${rowIndexValue}, col ${panelCell.col}, ${oldValue} → ${newValue}`);
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
            
            {silentLoading && (
              <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: 'rgba(0,123,255,0.9)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <Loader size="sm" color="white" />
                Memperbarui data...
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
      
      {/* Real-time notifications */}
      <RealtimeNotifications fileId={fileId as string} />
    </div>
  );
}
