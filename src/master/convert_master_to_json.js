const fs = require('fs');
const path = require('path');
const readline = require('readline');

const csvPath = path.join(__dirname, 'master_provinsi_kabkot_kecamatan_desa_untuk_magang - master_provinsi_kabkot_kecamatan_desa_untuk_magang.csv');
const jsonPath = path.join(__dirname, 'master_wilayah.json');

const provinsiSet = new Map();
const kabupatenSet = new Map();
const kecamatanSet = new Map();
const desaSet = new Map();

const rl = readline.createInterface({
  input: fs.createReadStream(csvPath),
  crlfDelay: Infinity
});

let isHeader = true;

rl.on('line', (line) => {
  if (isHeader) {
    isHeader = false;
    return;
  }
  const [kode_prov, nama_prov, kode_kab, kab_nama, kode_kec, kec_nama, kode_desa, desa_nama] = line.split(',');

  // Provinsi
  if (!provinsiSet.has(kode_prov)) {
    provinsiSet.set(kode_prov, { kode_prov, nama_prov });
  }

  // Kabupaten
  const kabKey = `${kode_prov}-${kode_kab}`;
  if (!kabupatenSet.has(kabKey)) {
    kabupatenSet.set(kabKey, { kode_kab, kab_nama, kode_prov, nama_prov });
  }

  // Kecamatan
  const kecKey = `${kode_prov}-${kode_kab}-${kode_kec}`;
  if (!kecamatanSet.has(kecKey)) {
    kecamatanSet.set(kecKey, { kode_kec, kec_nama, kode_prov, nama_prov, kode_kab, kab_nama });
  }

  // Desa
  const desaKey = `${kode_prov}-${kode_kab}-${kode_kec}-${kode_desa}`;
  if (!desaSet.has(desaKey)) {
    desaSet.set(desaKey, { kode_desa, desa_nama, kode_prov, nama_prov, kode_kab, kab_nama, kode_kec, kec_nama });
  }
});

rl.on('close', () => {
  const result = {
    provinsi: Array.from(provinsiSet.values()),
    kabupaten: Array.from(kabupatenSet.values()),
    kecamatan: Array.from(kecamatanSet.values()),
    desa: Array.from(desaSet.values()),
  };
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log('master_wilayah.json generated successfully!');
});
