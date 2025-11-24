"use client";

import React, { useState } from "react";
import { Container, Paper, Title, Text, Group, TextInput, Table, Badge, Stack, Button } from "@mantine/core";

interface ProvinsiItem {
  kode_prov: string;
  nama_prov: string;
}
interface KabupatenItem {
  kode_kab: string;
  kab_nama: string;
  kode_prov: string;
  nama_prov: string;
}
interface KecamatanItem {
  kode_kec: string;
  kec_nama: string;
  kode_kab: string;
  kab_nama: string;
  kode_prov: string;
  nama_prov: string;
}
interface DesaItem {
  kode_desa: string;
  desa_nama: string;
  kode_kec: string;
  kec_nama: string;
  kode_kab: string;
  kab_nama: string;
  kode_prov: string;
  nama_prov: string;
}

export default function SaarchCodePage() {
  const [keyword, setKeyword] = useState("");
  const [expandedProvinsi, setExpandedProvinsi] = useState<string | null>(null);
  const [expandedKabupaten, setExpandedKabupaten] = useState<string | null>(null);
  const [expandedKecamatan, setExpandedKecamatan] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const formatKodeExcel = (kode: string) => {
    // Only format if kode is all digits and length <= 3
    if (/^\d{1,3}$/.test(kode)) {
      return "'" + kode.padStart(3, "0");
    }
    return kode;
  };

  const showCopy = (kode: string) => {
    const formatted = formatKodeExcel(kode);
    navigator.clipboard.writeText(formatted);
    setCopied(kode); 
    setTimeout(() => setCopied(null), 600);
  };

  // @ts-ignore
  const wilayahData = require("../../master/master_wilayah.json");
  const provinsi: ProvinsiItem[] = wilayahData.provinsi || [];
  const kabupaten: KabupatenItem[] = wilayahData.kabupaten || [];
  const kecamatan: KecamatanItem[] = wilayahData.kecamatan || [];
  const desa: DesaItem[] = wilayahData.desa || [];

  // Remove single quotes for search matching
  const normalize = (str: string) => str.toLowerCase().replace(/'/g, "");
  const key = normalize(keyword.trim());

  // Filter provinsi
  const filteredProvinsi = provinsi.filter((item) => {
    if (!key) return false;
    return normalize(item.nama_prov).includes(key);
  });

  // Filter kabupaten hanya di nama kabupaten
  const filteredKabupaten = kabupaten.filter((item) => {
    if (!key) return false;
    return normalize(item.kab_nama).includes(key);
  });

  // Filter kecamatan hanya di nama kecamatan
  const filteredKecamatan = kecamatan.filter((item) => {
    if (!key) return false;
    return normalize(item.kec_nama || "").includes(key);
  });

  // Filter desa hanya di nama desa
  const filteredDesa = desa.filter((item) => {
    if (!key) return false;
    return normalize(item.desa_nama || "").includes(key);
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Container size="xl" py="xl">
        <Paper shadow="sm" radius="md" p="xl" withBorder>
          <Group position="apart" mb="xl">
            <div>
              <Title order={2} mb="xs">
                Search Code
              </Title>
              <Text size="sm" color="dimmed">
                Cari wilayah dan kode wilayah berdasarkan kata kunci
              </Text>
            </div>
          </Group>

          <TextInput
            placeholder="Ketik nama wilayah, provinsi, atau kode..."
            value={keyword}
            onChange={(e) => setKeyword(e.currentTarget.value)}
            mb="lg"
            size="md"
          />

          <Stack>
            {key !== "" &&
              filteredProvinsi.length === 0 &&
              filteredKabupaten.length === 0 &&
              filteredKecamatan.length === 0 &&
              filteredDesa.length === 0 ? (
                <Text color="dimmed" ta="center" py="xl">
                  Tidak ditemukan hasil untuk kata kunci tersebut.
                </Text>
              ) : null}

            {/* Provinsi */}
            <Title order={4} mt="md" mb="xs">Provinsi</Title>
            {filteredProvinsi.length > 0 ? (
              <Table striped highlightOnHover withBorder withColumnBorders>
                <thead>
                  <tr>
                    <th>Nama Provinsi</th>
                    <th>Kode Provinsi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProvinsi.slice(0, 50).map((item) => (
                    <React.Fragment key={item.kode_prov}>
                      <tr>
                        <td>{item.nama_prov}</td>
                        <td>
                          <Badge
                            color="green"
                            variant="light"
                            style={{
                              cursor: "pointer",
                              transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                              transform: copied === item.kode_prov ? "scale(1.15)" : "scale(1)",
                              boxShadow: copied === item.kode_prov ? "0 0 0 4px #38d9a955" : undefined,
                              background: copied === item.kode_prov ? "#38d9a922" : undefined
                            }}
                            onClick={() => showCopy(item.kode_prov)}
                            title="Klik untuk salin kode"
                          >
                            {item.kode_prov}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            color={expandedProvinsi === item.kode_prov ? "gray" : "blue"}
                            variant={expandedProvinsi === item.kode_prov ? "outline" : "filled"}
                            size="xs"
                            radius="md"
                            onClick={() => setExpandedProvinsi(expandedProvinsi === item.kode_prov ? null : item.kode_prov)}
                          >
                            {expandedProvinsi === item.kode_prov ? 'Tutup Kabupaten' : 'Lihat Kabupaten'}
                          </Button>
                        </td>
                      </tr>
                      {expandedProvinsi === item.kode_prov && (
                        <tr>
                          <td colSpan={3}>
                            <Table striped highlightOnHover withBorder withColumnBorders>
                              <thead>
                                <tr>
                                  <th>Kabupaten/Kota</th>
                                  <th>Kode Kab</th>
                                </tr>
                              </thead>
                              <tbody>
                                {kabupaten.filter(kab => kab.kode_prov === item.kode_prov).map(kab => (
                                  <tr key={kab.kode_kab}>
                                    <td>{kab.kab_nama}</td>
                                    <td>
                                      <Badge
                                        color="blue"
                                        variant="light"
                                        style={{
                                          cursor: "pointer",
                                          transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                                          transform: copied === kab.kode_kab ? "scale(1.15)" : "scale(1)",
                                          boxShadow: copied === kab.kode_kab ? "0 0 0 4px #228be655" : undefined,
                                          background: copied === kab.kode_kab ? "#228be622" : undefined
                                        }}
                                        onClick={() => showCopy(kab.kode_kab)}
                                        title="Klik untuk salin kode"
                                      >
                                        {kab.kode_kab}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            ) : (
              key !== "" && (
                <Text
                  color="dimmed"
                  ta="center"
                  size="xs"
                  style={{ margin: "12px 0", opacity: 0.7, fontStyle: "italic", letterSpacing: 0.2 }}
                >
                  Tidak ditemukan provinsi untuk kata kunci "{keyword}".
                </Text>
              )
            )}

            {/* Kabupaten/Kota */}
            <Title order={4} mt="md" mb="xs">Kabupaten/Kota</Title>
            {filteredKabupaten.length > 0 ? (
              <Table striped highlightOnHover withBorder withColumnBorders>
                <thead>
                  <tr>
                    <th>Kabupaten/Kota</th>
                    <th>Kode Kab</th>
                    <th>Provinsi</th>
                    <th>Kode Prov</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKabupaten.slice(0, 50).map((item) => (
                    <React.Fragment key={item.kode_kab + item.kode_prov}>
                      <tr>
                        <td>{item.kab_nama}</td>
                        <td>
                          <Badge
                            color="blue"
                            variant="light"
                            style={{
                              cursor: "pointer",
                              transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                              transform: copied === item.kode_kab ? "scale(1.15)" : "scale(1)",
                              boxShadow: copied === item.kode_kab ? "0 0 0 4px #228be655" : undefined,
                              background: copied === item.kode_kab ? "#228be622" : undefined
                            }}
                            onClick={() => showCopy(item.kode_kab)}
                            title="Klik untuk salin kode"
                          >
                            {item.kode_kab}
                          </Badge>
                        </td>
                        <td>{item.nama_prov}</td>
                        <td>
                          <Badge
                            color="green"
                            variant="light"
                            style={{
                              cursor: "pointer",
                              transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                              transform: copied === item.kode_prov ? "scale(1.15)" : "scale(1)",
                              boxShadow: copied === item.kode_prov ? "0 0 0 4px #38d9a955" : undefined,
                              background: copied === item.kode_prov ? "#38d9a922" : undefined
                            }}
                            onClick={() => showCopy(item.kode_prov)}
                            title="Klik untuk salin kode"
                          >
                            {item.kode_prov}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            color={expandedKabupaten === item.kode_kab ? "gray" : "orange"}
                            variant={expandedKabupaten === item.kode_kab ? "outline" : "filled"}
                            size="xs"
                            radius="md"
                            onClick={() => setExpandedKabupaten(expandedKabupaten === item.kode_kab ? null : item.kode_kab)}
                          >
                            {expandedKabupaten === item.kode_kab ? 'Tutup Kecamatan' : 'Lihat Kecamatan'}
                          </Button>
                        </td>
                      </tr>
                      {expandedKabupaten === item.kode_kab && (
                        <tr>
                          <td colSpan={5}>
                            <Table striped highlightOnHover withBorder withColumnBorders>
                              <thead>
                                <tr>
                                  <th>Kecamatan</th>
                                  <th>Kode Kec</th>
                                </tr>
                              </thead>
                              <tbody>
                                {kecamatan
                                  .filter(kec => kec.kode_kab === item.kode_kab && kec.nama_prov === item.nama_prov)
                                  .map(kec => (
                                    <tr key={kec.kode_kec}>
                                      <td>{kec.kec_nama}</td>
                                      <td>
                                        <Badge
                                          color="orange"
                                          variant="light"
                                          style={{
                                            cursor: "pointer",
                                            transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                                            transform: copied === kec.kode_kec ? "scale(1.15)" : "scale(1)",
                                            boxShadow: copied === kec.kode_kec ? "0 0 0 4px #fd7e1455" : undefined,
                                            background: copied === kec.kode_kec ? "#fd7e1422" : undefined
                                          }}
                                          onClick={() => showCopy(kec.kode_kec)}
                                          title="Klik untuk salin kode"
                                        >
                                          {kec.kode_kec}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </Table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            ) : (
              key !== "" && (
                <Text
                  color="dimmed"
                  ta="center"
                  size="xs"
                  style={{ margin: "12px 0", opacity: 0.7, fontStyle: "italic", letterSpacing: 0.2 }}
                >
                  Tidak ditemukan kabupaten/kota untuk kata kunci "{keyword}".
                </Text>
              )
            )}

            {/* Kecamatan */}
            <Title order={4} mt="md" mb="xs">Kecamatan</Title>
            {filteredKecamatan.length > 0 ? (
              <Table striped highlightOnHover withBorder withColumnBorders>
                <thead>
                  <tr>
                    <th>Kecamatan</th>
                    <th>Kode Kec</th>
                    <th>Kabupaten/Kota</th>
                    <th>Kode Kab</th>
                    <th>Provinsi</th>
                    <th>Kode Prov</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKecamatan.slice(0, 50).map((item) => (
                    <React.Fragment key={item.kode_kec + item.kode_kab + item.kode_prov}>
                      <tr>
                        <td>{item.kec_nama}</td>
                        <td>
                          <Badge
                            color="orange"
                            variant="light"
                            style={{
                              cursor: "pointer",
                              transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                              transform: copied === item.kode_kec ? "scale(1.15)" : "scale(1)",
                              boxShadow: copied === item.kode_kec ? "0 0 0 4px #fd7e1455" : undefined,
                              background: copied === item.kode_kec ? "#fd7e1422" : undefined
                            }}
                            onClick={() => showCopy(item.kode_kec)}
                            title="Klik untuk salin kode"
                          >
                            {item.kode_kec}
                          </Badge>
                        </td>
                        <td>{item.kab_nama}</td>
                        <td>
                          <Badge
                            color="blue"
                            variant="light"
                            style={{
                              cursor: "pointer",
                              transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                              transform: copied === item.kode_kab ? "scale(1.15)" : "scale(1)",
                              boxShadow: copied === item.kode_kab ? "0 0 0 4px #228be655" : undefined,
                              background: copied === item.kode_kab ? "#228be622" : undefined
                            }}
                            onClick={() => showCopy(item.kode_kab)}
                            title="Klik untuk salin kode"
                          >
                            {item.kode_kab}
                          </Badge>
                        </td>
                        <td>{item.nama_prov}</td>
                        <td>
                          <Badge
                            color="green"
                            variant="light"
                            style={{
                              cursor: "pointer",
                              transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                              transform: copied === item.kode_prov ? "scale(1.15)" : "scale(1)",
                              boxShadow: copied === item.kode_prov ? "0 0 0 4px #38d9a955" : undefined,
                              background: copied === item.kode_prov ? "#38d9a922" : undefined
                            }}
                            onClick={() => showCopy(item.kode_prov)}
                            title="Klik untuk salin kode"
                          >
                            {item.kode_prov}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            color={expandedKecamatan.includes(item.kode_kec) ? "gray" : "pink"}
                            variant={expandedKecamatan.includes(item.kode_kec) ? "outline" : "filled"}
                            size="xs"
                            radius="md"
                            onClick={() => {
                              if (expandedKecamatan.includes(item.kode_kec)) {
                                setExpandedKecamatan(expandedKecamatan.filter(kec => kec !== item.kode_kec));
                              } else {
                                setExpandedKecamatan([...expandedKecamatan, item.kode_kec]);
                              }
                            }}
                          >
                            {expandedKecamatan.includes(item.kode_kec) ? 'Tutup Desa' : 'Lihat Desa'}
                          </Button>
                        </td>
                      </tr>
                      {expandedKecamatan.includes(item.kode_kec) && (
                        <tr>
                          <td colSpan={7}>
                            <Table striped highlightOnHover withBorder withColumnBorders>
                              <thead>
                                <tr>
                                  <th>Desa</th>
                                  <th>Kode Desa</th>
                                </tr>
                              </thead>
                              <tbody>
                                {desa
                                  .filter(ds =>
                                    ds.kode_kec === item.kode_kec &&
                                    ds.kode_kab === item.kode_kab &&
                                    ds.kode_prov === item.kode_prov
                                  )
                                  .map(ds => (
                                    <tr key={ds.kode_desa}>
                                      <td>{ds.desa_nama}</td>
                                      <td>
                                        <Badge
                                          color="pink"
                                          variant="light"
                                          style={{
                                            cursor: "pointer",
                                            transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                                            transform: copied === ds.kode_desa ? "scale(1.15)" : "scale(1)",
                                            boxShadow: copied === ds.kode_desa ? "0 0 0 4px #f0659555" : undefined,
                                            background: copied === ds.kode_desa ? "#f0659522" : undefined
                                          }}
                                          onClick={() => showCopy(ds.kode_desa)}
                                          title="Klik untuk salin kode"
                                        >
                                          {ds.kode_desa}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </Table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            ) : (
              key !== "" && (
                <Text
                  color="dimmed"
                  ta="center"
                  size="xs"
                  style={{ margin: "12px 0", opacity: 0.7, fontStyle: "italic", letterSpacing: 0.2 }}
                >
                  Tidak ditemukan kecamatan untuk kata kunci "{keyword}".
                </Text>
              )
            )}

            {/* Desa */}
            <Title order={4} mt="md" mb="xs">Desa</Title>
            {filteredDesa.length > 0 ? (
              <Table striped highlightOnHover withBorder withColumnBorders>
                <thead>
                  <tr>
                    <th>Desa</th>
                    <th>Kode Desa</th>
                    <th>Kecamatan</th>
                    <th>Kode Kec</th>
                    <th>Kabupaten/Kota</th>
                    <th>Kode Kab</th>
                    <th>Provinsi</th>
                    <th>Kode Prov</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDesa.slice(0, 50).map((item) => (
                    <tr key={item.kode_desa + item.kode_kec + item.kode_kab + item.kode_prov}>
                      <td>{item.desa_nama}</td>
                      <td>
                        <Badge
                          color="pink"
                          variant="light"
                          style={{
                            cursor: "pointer",
                            transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                            transform: copied === item.kode_desa ? "scale(1.15)" : "scale(1)",
                            boxShadow: copied === item.kode_desa ? "0 0 0 4px #f0659555" : undefined,
                            background: copied === item.kode_desa ? "#f0659522" : undefined
                          }}
                          onClick={() => showCopy(item.kode_desa)}
                          title="Klik untuk salin kode"
                        >
                          {item.kode_desa}
                        </Badge>
                      </td>
                      <td>{item.kec_nama}</td>
                      <td>
                        <Badge
                          color="orange"
                          variant="light"
                          style={{
                            cursor: "pointer",
                            transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                            transform: copied === item.kode_kec ? "scale(1.15)" : "scale(1)",
                            boxShadow: copied === item.kode_kec ? "0 0 0 4px #fd7e1455" : undefined,
                            background: copied === item.kode_kec ? "#fd7e1422" : undefined
                          }}
                          onClick={() => showCopy(item.kode_kec)}
                          title="Klik untuk salin kode"
                        >
                          {item.kode_kec}
                        </Badge>
                      </td>
                      <td>{item.kab_nama}</td>
                      <td>
                        <Badge
                          color="blue"
                          variant="light"
                          style={{
                            cursor: "pointer",
                            transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                            transform: copied === item.kode_kab ? "scale(1.15)" : "scale(1)",
                            boxShadow: copied === item.kode_kab ? "0 0 0 4px #228be655" : undefined,
                            background: copied === item.kode_kab ? "#228be622" : undefined
                          }}
                          onClick={() => showCopy(item.kode_kab)}
                          title="Klik untuk salin kode"
                        >
                          {item.kode_kab}
                        </Badge>
                      </td>
                      <td>{item.nama_prov}</td>
                      <td>
                        <Badge
                          color="green"
                          variant="light"
                          style={{
                            cursor: "pointer",
                            transition: "transform 0.25s, box-shadow 0.25s, background 0.25s",
                            transform: copied === item.kode_prov ? "scale(1.15)" : "scale(1)",
                            boxShadow: copied === item.kode_prov ? "0 0 0 4px #38d9a955" : undefined,
                            background: copied === item.kode_prov ? "#38d9a922" : undefined
                          }}
                          onClick={() => showCopy(item.kode_prov)}
                          title="Klik untuk salin kode"
                        >
                          {item.kode_prov}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              key !== "" && (
                <Text
                  color="dimmed"
                  ta="center"
                  size="xs"
                  style={{ margin: "12px 0", opacity: 0.7, fontStyle: "italic", letterSpacing: 0.2 }}
                >
                  Tidak ditemukan desa untuk kata kunci "{keyword}".
                </Text>
              )
            )}
          </Stack>
        </Paper>
      </Container>
    </div>
  );
}