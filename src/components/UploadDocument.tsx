"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Paper,
  Group,
  Text,
  FileButton,
  Button,
  Radio,
  Stack,
} from "@mantine/core";
import { IconCloudUpload } from "@tabler/icons-react";
import * as XLSX from "xlsx";

export default function UploadDocument() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isCsv, setIsCsv] = useState(false);
  const [separator, setSeparator] = useState(",");
  const [lastCsvText, setLastCsvText] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [fileObj, setFileObj] = useState<File | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setFileObj(file);
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".csv")) {
      setIsCsv(true);
      const text = await file.text();
      setLastCsvText(text);
      parseCsv(text, separator);
    } else if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) {
      setIsCsv(false);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown as string[][];
          setPreview(json.slice(0, 3));
    } else {
      setPreview([]);
      setIsCsv(false);
    }
  };

  const parseCsv = (text: string, sep: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows = lines.map((l) => l.split(sep));
        setPreview(rows.slice(0, 3));
  };

  return (
    <Paper shadow="lg" radius="md" p={32} withBorder style={{ maxWidth: 700, margin: "40px auto", background: "var(--mantine-color-body)" }}>
      <Stack spacing={20} align="center">
        <Text size={24} weight={700} align="center" mb={-4}>
          Upload Document
        </Text>
        <Text size="sm" color="dimmed" align="center" mb={4}>
          Pilih file Excel (.xlsx/.xls) atau CSV untuk diunggah dan dipreview. Untuk CSV, Anda bisa memilih separator.
        </Text>
        <FileButton
          onChange={handleFile}
          accept=".csv,.xlsx,.xls"
        >
          {(props) => (
            <Button size="sm" leftIcon={<IconCloudUpload size={18} />} {...props} style={{ minWidth: 120 }}>
              Pilih File
            </Button>
          )}
        </FileButton>

        {fileName && <Text size="sm" color="blue" weight={500}>File: {fileName}</Text>}

        {isCsv && (
          <div style={{ width: "100%", marginTop: 8 }}>
            <Text size="xs" mb={2} align="center" color="dimmed">Pilih separator CSV:</Text>
            <Group position="center" spacing={16} mt={4}>
              <Radio.Group
                value={separator}
                onChange={(v: string) => {
                  setSeparator(v);
                  if (lastCsvText) parseCsv(lastCsvText, v);
                }}
                size="sm"
                style={{ display: "flex", gap: 16 }}
              >
                <Radio value="," label="," />
                <Radio value=";" label=";" />
                <Radio value="\t" label="Tab" />
                <Radio value="|" label="|" />
              </Radio.Group>
            </Group>
          </div>
        )}

        {preview.length > 0 && (
          <div style={{ width: "100%" }}>
            <Text size="xs" weight={600} mb={6} align="center" color="dimmed">
              Preview (3 row pertama)
            </Text>
            <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #eee", background: "#fafbfc", padding: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {preview[0].map((cell, j) => (
                      <th key={j} style={{ padding: 6, border: "1px solid #e3e3e3", fontSize: 12, background: "#f0f0f0", fontWeight: 600 }}>
                        {String(cell).replace(/^["']|["']$/g, "")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ padding: 6, border: "1px solid #e3e3e3", fontSize: 12 }}>
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <Button size="sm" color="blue" onClick={async () => {
                if (!fileObj) return;
                const uuid = uuidv4();
                const data = new FormData();
                data.append('file', fileObj, uuid);
                data.append('originalName', fileObj.name);
                data.append('separator', isCsv ? separator : '');
                data.append('fileType', isCsv ? 'csv' : 'excel');
                const res = await fetch('/api/upload', { method: 'POST', body: data });
                if (res.ok) {
                  window.location.href = `/proses/${uuid}`;
                }
              }}>Proses Data Ini</Button>
            </div>
          </div>
        )}
      </Stack>
    </Paper>
  );
}
