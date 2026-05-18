/**
 * SIMPERGUD RSUD BACKEND (Google Apps Script)
 * Versi: 1.0.1
 * Deskripsi: Menghandle transaksi persediaan barang RSUD ke Google Sheets
 */

// GANTI DENGAN ID SPREADSHEET ANDA
const SPREADSHEET_ID = '1YqTE8BFYOdkgeJt3Gs25W0GaAA0VfgJuW52gCHvl_c8';
const AUTH_SPREADSHEET_ID = '120rxSc2m21FYFATObzHtWu2DRhLxC2WjjjdUxXr_voU'; // Spreadsheet Khusus User
const FAKTUR_FOLDER_ID = '1EAnOCWBhA7PegkKcJP2Lf7nJR2ccFal8';
const ADMIN_EMAIL = 'aset.rsuddeliserdang@gmail.com'; 

function getSpreadsheet(id) {
  try {
    const targetId = id || SPREADSHEET_ID;
    if (targetId && targetId !== 'MAKSUD_ANDA_ID_DISINI') {
      return SpreadsheetApp.openById(targetId);
    }
  } catch (e) {}
  
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {}
  
  throw new Error("ID Spreadsheet tidak ditemukan atau tidak dapat diakses.");
}

/**
 * FUNGSI TRIGGER STOK
 */
function scheduledStockCheck() {
  const ss = getSpreadsheet();
  const masterSheet = ss.getSheetByName('MASTER_BARANG');
  const values = masterSheet.getDataRange().getValues();
  let alertsCount = 0;
  for (let i = 1; i < values.length; i++) {
    const item = {
      kode_barang: values[i][0], nama_barang: values[i][1], satuan: values[i][4],
      stok_minimum: values[i][5], monitor_stok: values[i][6], prioritas_alert: values[i][7],
      kirim_email_alert: values[i][8], lokasi_rak: values[i][10], stok_sekarang: values[i][12]
    };
    if (item.monitor_stok === 'Ya' && item.prioritas_alert === 'Kritis' && item.kirim_email_alert === 'Ya') {
      if (Number(item.stok_sekarang) <= Number(item.stok_minimum)) {
        checkAndSendEmailAlert(item);
        alertsCount++;
      }
    }
  }
  return `Check complete. Sent ${alertsCount} critical alerts.`;
}

function checkAndSendEmailAlert(item) {
  if (!item || !item.kode_barang) return;
  const isEligible = (item.monitor_stok === 'Ya' && item.kirim_email_alert === 'Ya');
  if (isEligible && Number(item.stok_sekarang) <= Number(item.stok_minimum)) {
    const subject = `[PERINGATAN STOK] ${item.nama_barang} (${item.stok_sekarang} ${item.satuan})`;
    const body = `Peringatan Stok Inventory\nStatus: ${item.prioritas_alert}\nNama: ${item.nama_barang}\nStok: ${item.stok_sekarang}\nMin: ${item.stok_minimum}`;
    try {
      MailApp.sendEmail(ADMIN_EMAIL, subject, body);
    } catch (e) { console.error(e.message); }
  }
}

function doGet(e) {
  const action = e.parameter.action;
  let ss;
  
  try {
    ss = getSpreadsheet();
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
  
  try {
    switch (action) {
      case 'ping':
        return jsonResponse({ status: 'ok' });
      case 'getMasters':
        return jsonResponse({
          barang: getSheetData(ss, 'MASTER_BARANG'),
          supplier: getSheetData(ss, 'SUPPLIER'),
          satuan: getSheetData(ss, 'SATUAN'),
          unit: getSheetData(ss, 'UNIT_RUANGAN')
        });
      case 'login':
        // Fallback login for GET (not recommended, but for testing)
        return jsonResponse(handleLogin(e.parameter.email, e.parameter.password));
      case 'getDashboard':
        const barang = getSheetData(ss, 'MASTER_BARANG');
        const mutasi = getSheetData(ss, 'TRX_MUTASI_STOK');
        const headerMasuk = getSheetData(ss, 'TRX_BARANG_MASUK_H');
        const headerKeluar = getSheetData(ss, 'TRX_BARANG_KELUAR_H');
        return jsonResponse({ barang, mutasi, headerMasuk, headerKeluar });
      case 'getMutasi':
        return jsonResponse(getSheetData(sheet, 'TRX_MUTASI_STOK'));
      case 'getRecentTrx':
      case 'getRecentTrxMasuk':
        return jsonResponse(getSheetData(sheet, 'TRX_BARANG_MASUK_H'));
      case 'getRecentTrxKeluar':
        return jsonResponse(getSheetData(sheet, 'TRX_BARANG_KELUAR_H'));
      case 'getTrxMasukDetail':
      case 'getTrxDetail':
        const trxIdMasuk = e.parameter.id_transaksi;
        const allDetailsMasuk = getSheetData(sheet, 'TRX_BARANG_MASUK_D');
        return jsonResponse(allDetailsMasuk.filter(d => d.id_transaksi === trxIdMasuk));
      case 'getTrxKeluarDetail':
        const trxIdKeluar = e.parameter.id_transaksi;
        const allDetailsKeluar = getSheetData(sheet, 'TRX_BARANG_KELUAR_D');
        return jsonResponse(allDetailsKeluar.filter(d => d.id_transaksi === trxIdKeluar));
      case 'getPermintaanPending':
        const allPermintaan = getSheetData(sheet, 'TRX_PERMINTAAN_H');
        return jsonResponse(allPermintaan.filter(p => p.status === 'PENDING'));
      case 'getPermintaanDetail':
        const reqId = e.parameter.id_permintaan;
        const allReqDetails = getSheetData(sheet, 'TRX_PERMINTAAN_D');
        return jsonResponse(allReqDetails.filter(d => d.id_permintaan === reqId));
      case 'getPermintaanAll':
        return jsonResponse(getSheetData(sheet, 'TRX_PERMINTAAN_H'));
      case 'getAllTrxDetails':
        return jsonResponse(getSheetData(sheet, 'TRX_BARANG_MASUK_D'));
      case 'getReportsData':
        return jsonResponse({
          barang: getSheetData(sheet, 'MASTER_BARANG'),
          mutasi: getSheetData(sheet, 'TRX_MUTASI_STOK'),
          headerMasuk: getSheetData(sheet, 'TRX_BARANG_MASUK_H'),
          detailMasuk: getSheetData(sheet, 'TRX_BARANG_MASUK_D'),
          headerKeluar: getSheetData(sheet, 'TRX_BARANG_KELUAR_H'),
          detailKeluar: getSheetData(sheet, 'TRX_BARANG_KELUAR_D'),
          supplier: getSheetData(sheet, 'SUPPLIER'),
          unit: getSheetData(sheet, 'UNIT_RUANGAN')
        });
      default:
        return jsonResponse({ error: 'Action not found in doGet: ' + (action || 'none') });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// END OF doGet

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return jsonResponse({ error: "No request body received" });
  }

  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: "Invalid JSON payload" });
  }

  const action = data.action;
  let ss;
  
  try {
    ss = getSpreadsheet();
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
  
  try {
    switch (action) {
      case 'saveBarangMasuk':
        return jsonResponse(handleSaveBarangMasuk(ss, data.payload));
      case 'login':
        return jsonResponse(handleLogin(data.payload.email, data.payload.password));
      case 'uploadFile':
        return jsonResponse(handleUploadFile(data.payload));
      case 'saveBarangKeluar':
        return jsonResponse(handleSaveBarangKeluar(ss, data.payload));
      case 'updateBarangKeluar':
        return jsonResponse(handleUpdateBarangKeluar(ss, data.payload));
      case 'deleteBarangKeluar':
        return jsonResponse(handleDeleteBarangKeluar(ss, data.payload));
      case 'updateBarangMasuk':
        return jsonResponse(handleUpdateBarangMasuk(ss, data.payload));
      case 'saveBarang':
        return jsonResponse(handleSaveBarang(ss, data.payload));
      case 'savePermintaan':
        return jsonResponse(handleSavePermintaan(ss, data.payload));
      case 'saveReviewPermintaan':
        return jsonResponse(handleSaveReviewPermintaan(ss, data.payload));
      case 'approvePermintaan':
        return jsonResponse(handleApprovePermintaan(ss, data.payload));
      case 'rejectPermintaan':
        return jsonResponse(handleRejectPermintaan(ss, data.payload));
      case 'revisionPermintaan':
        return jsonResponse(handleRevisionPermintaan(ss, data.payload));
      case 'updateBarang':
        return jsonResponse(handleUpdateBarang(ss, data.payload));
      case 'deleteBarang':
        return jsonResponse(handleDeleteBarang(ss, data.payload));
      case 'saveSupplier':
        return jsonResponse(handleSaveSupplier(ss, data.payload));
      case 'updateSupplier':
        return jsonResponse(handleUpdateSupplier(ss, data.payload));
      case 'saveSatuan':
        return jsonResponse(handleSaveSatuan(ss, data.payload));
      case 'updateSatuan':
        return jsonResponse(handleUpdateSatuan(ss, data.payload));
      case 'deleteSupplier':
        return jsonResponse(handleDeleteSupplier(ss, data.payload));
      case 'deleteSatuan':
        return jsonResponse(handleDeleteSatuan(ss, data.payload));
      case 'saveUnit':
        return jsonResponse(handleSaveUnit(ss, data.payload));
      case 'updateUnit':
        return jsonResponse(handleUpdateUnit(ss, data.payload));
      case 'deleteUnit':
        return jsonResponse(handleDeleteUnit(ss, data.payload));
      case 'saveSaldoAwal':
        return jsonResponse(handleSaveSaldoAwal(ss, data.payload));
      case 'seedData':
        return jsonResponse(handleSeedData(ss));
      default:
        return jsonResponse({ error: 'Action not found in doPost: ' + (action || 'none') });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

/**
 * CRUD Master Barang
 */
function handleSaveBarang(ss, payload) {
  const sheet = ss.getSheetByName('MASTER_BARANG');
  sheet.appendRow([
    payload.kode_barang,
    payload.nama_barang,
    payload.kategori,
    payload.sub_kategori,
    payload.satuan,
    payload.stok_minimum,
    payload.monitor_stok || 'Tidak',
    payload.prioritas_alert || 'Normal',
    payload.kirim_email_alert || 'Tidak',
    payload.merk,
    payload.lokasi_rak,
    payload.status || 'AKTIF',
    payload.stok_sekarang || 0,
    new Date() // LAST_STOCK_UPDATE
  ]);
  return { success: true };
}

function handleUpdateBarang(ss, payload) {
  const sheet = ss.getSheetByName('MASTER_BARANG');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == payload.kode_barang) {
      sheet.getRange(i + 1, 2, 1, 11).setValues([[
        payload.nama_barang,
        payload.kategori,
        payload.sub_kategori,
        payload.satuan,
        payload.stok_minimum,
        payload.monitor_stok,
        payload.prioritas_alert,
        payload.kirim_email_alert,
        payload.merk,
        payload.lokasi_rak,
        payload.status
      ]]);
      return { success: true };
    }
  }
  return { error: 'Barang not found' };
}

function handleDeleteBarang(ss, payload) {
  const sheet = ss.getSheetByName('MASTER_BARANG');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == payload.kode_barang) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'Barang not found' };
}

/**
 * CRUD Supplier & Satuan
 */
function handleSaveSupplier(ss, payload) {
  const sheet = ss.getSheetByName('SUPPLIER');
  sheet.appendRow([payload.id_supplier, payload.nama_supplier, payload.kontak, payload.alamat, payload.status || 'AKTIF']);
  return { success: true };
}

function handleSaveSatuan(ss, payload) {
  const sheet = ss.getSheetByName('SATUAN');
  sheet.appendRow([payload.kode, payload.nama_satuan, payload.alias_input, payload.keterangan, payload.status || 'AKTIF']);
  return { success: true };
}

function handleUpdateSupplier(ss, payload) {
  const sheet = ss.getSheetByName('SUPPLIER');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == payload.id_supplier) {
      sheet.getRange(i + 1, 2, 1, 4).setValues([[
        payload.nama_supplier,
        payload.kontak,
        payload.alamat,
        payload.status
      ]]);
      return { success: true };
    }
  }
  return { error: 'Supplier not found' };
}

function handleUpdateSatuan(ss, payload) {
  const sheet = ss.getSheetByName('SATUAN');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == payload.kode) {
      sheet.getRange(i + 1, 2, 1, 4).setValues([[
        payload.nama_satuan,
        payload.alias_input,
        payload.keterangan,
        payload.status
      ]]);
      return { success: true };
    }
  }
  return { error: 'Satuan not found' };
}

function handleDeleteSupplier(ss, payload) {
  const sheet = ss.getSheetByName('SUPPLIER');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == payload.id_supplier) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'Supplier not found' };
}

function handleDeleteSatuan(ss, payload) {
  const sheet = ss.getSheetByName('SATUAN');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == payload.kode) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'Satuan not found' };
}

/**
 * CRUD Unit / Ruangan
 */
function handleSaveUnit(ss, payload) {
  const sheet = ss.getSheetByName('UNIT_RUANGAN');
  sheet.appendRow([payload.id_unit, payload.nama_unit, payload.bidang, payload.status || 'AKTIF']);
  return { success: true };
}

function handleUpdateUnit(ss, payload) {
  const sheet = ss.getSheetByName('UNIT_RUANGAN');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == payload.id_unit) {
      sheet.getRange(i + 1, 2, 1, 3).setValues([[
        payload.nama_unit,
        payload.bidang,
        payload.status
      ]]);
      return { success: true };
    }
  }
  return { error: 'Unit not found' };
}

function handleDeleteUnit(ss, payload) {
  const sheet = ss.getSheetByName('UNIT_RUANGAN');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == payload.id_unit) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'Unit not found' };
}

/**
 * Handle Simpan Saldo Awal
 */
function handleSaveSaldoAwal(ss, payload) {
  const masterSheet = ss.getSheetByName('MASTER_BARANG');
  const mutasiSheet = ss.getSheetByName('TRX_MUTASI_STOK');
  const now = new Date();
  
  payload.items.forEach(item => {
    // 1. Update Stok di Master
    const masterValues = masterSheet.getDataRange().getValues();
    let currentSaldo = 0;
    
    for (let i = 1; i < masterValues.length; i++) {
        if (masterValues[i][0] == item.kode_barang) {
            currentSaldo = Number(masterValues[i][12] || 0);
            const newSaldo = currentSaldo + Number(item.qty);
            masterSheet.getRange(i + 1, 13).setValue(newSaldo);
            masterSheet.getRange(i + 1, 14).setValue(now);
            currentSaldo = newSaldo;
            break;
        }
    }
    
    // 2. Simpan Mutasi Baru sebagai SALDO AWAL
    mutasiSheet.appendRow([
      payload.tanggal || now,
      item.kode_barang,
      item.nama_barang,
      'SALDO AWAL',
      item.qty,
      0,
      currentSaldo,
      payload.keterangan || 'INPUT SALDO AWAL'
    ]);
  });
  
  return { success: true };
}

/**
 * Handle Simpan Transaksi Barang Masuk
 */
function handleSaveBarangMasuk(ss, payload) {
  const headerSheet = ss.getSheetByName('TRX_BARANG_MASUK_H');
  const detailSheet = ss.getSheetByName('TRX_BARANG_MASUK_D');
  const masterSheet = ss.getSheetByName('MASTER_BARANG');
  const mutasiSheet = ss.getSheetByName('TRX_MUTASI_STOK');
  
  const now = new Date();
  
  // 1. Simpan Header
  headerSheet.appendRow([
    payload.id_transaksi,
    payload.tanggal,
    payload.no_faktur,
    payload.supplier_nama,
    payload.keterangan,
    payload.file_faktur_url || '',
    payload.grand_total,
    payload.user_input,
    now
  ]);
  
  // 2. Loop Items
  processItems(payload, masterSheet, detailSheet, mutasiSheet, now, 'MASUK');
  
  return { success: true, id: payload.id_transaksi };
}

/**
 * Handle Upload File ke Google Drive
 */
function handleUploadFile(payload) {
  try {
    if (!FAKTUR_FOLDER_ID || FAKTUR_FOLDER_ID === '1EAnOCWBhA7PegkKcJP2Lf7nJR2ccFal8_Placeholder') {
       // Note: we use the value provided by user
    }
    const folder = DriveApp.getFolderById(FAKTUR_FOLDER_ID);
    const contentType = payload.mimeType || 'application/octet-stream';
    const blob = Utilities.newBlob(Utilities.base64Decode(payload.base64), contentType, payload.fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { 
      success: true, 
      url: file.getUrl(),
      fileId: file.getId(),
      downloadUrl: file.getDownloadUrl()
    };
  } catch (e) {
    return { error: 'Gagal upload ke Drive: ' + e.message };
  }
}

/**
 * Handle Simpan Transaksi Barang Keluar
 */
function handleSaveBarangKeluar(ss, payload) {
  const headerSheet = ss.getSheetByName('TRX_BARANG_KELUAR_H');
  const detailSheet = ss.getSheetByName('TRX_BARANG_KELUAR_D');
  const masterSheet = ss.getSheetByName('MASTER_BARANG');
  const mutasiSheet = ss.getSheetByName('TRX_MUTASI_STOK');
  
  const now = new Date();
  
  // 1. Simpan Header
  headerSheet.appendRow([
    payload.id_transaksi,
    payload.tanggal,
    payload.unit_id,
    payload.unit_nama,
    payload.keterangan,
    payload.user_input,
    now
  ]);
  
  // 2. Loop Items (Decrement Stok)
  payload.items.forEach(item => {
    // Simpan Detail
    detailSheet.appendRow([
      payload.id_transaksi,
      item.kode_barang,
      item.nama_barang,
      item.satuan,
      item.qty
    ]);
    
    // Update Stok di Master (KURANGI)
    const masterValues = masterSheet.getDataRange().getValues();
    let currentSaldo = 0;
    
    for (let i = 1; i < masterValues.length; i++) {
        if (masterValues[i][0] == item.kode_barang) {
            currentSaldo = Number(masterValues[i][12] || 0);
            const newSaldo = currentSaldo - Number(item.qty);
            masterSheet.getRange(i + 1, 13).setValue(newSaldo);
            masterSheet.getRange(i + 1, 14).setValue(now); // LAST_STOCK_UPDATE
            currentSaldo = newSaldo;
            break;
        }
    }
    
    // Simpan Mutasi Baru
    mutasiSheet.appendRow([
      now,
      item.kode_barang,
      item.nama_barang,
      'KELUAR',
      0,
      item.qty,
      currentSaldo,
      payload.id_transaksi
    ]);
  });
  
  return { success: true, id: payload.id_transaksi };
}

function handleUpdateBarangKeluar(ss, payload) {
  const headerSheet = ss.getSheetByName('TRX_BARANG_KELUAR_H');
  const detailSheet = ss.getSheetByName('TRX_BARANG_KELUAR_D');
  const masterSheet = ss.getSheetByName('MASTER_BARANG');
  const mutasiSheet = ss.getSheetByName('TRX_MUTASI_STOK');
  const now = new Date();

  // 1. REVERSAL STOK (Tambahkan kembali stok yang dulu dikurangi)
  const detailValues = detailSheet.getDataRange().getValues();
  const masterValues = masterSheet.getDataRange().getValues();

  for (let i = detailValues.length - 1; i >= 1; i--) {
    if (detailValues[i][0] == payload.id_transaksi) {
      const kodeBarang = detailValues[i][1];
      const qtyLama = Number(detailValues[i][4]);
      
      for (let j = 1; j < masterValues.length; j++) {
        if (masterValues[j][0] == kodeBarang) {
          const saldoSekarang = Number(masterValues[j][12]);
          masterSheet.getRange(j + 1, 13).setValue(saldoSekarang + qtyLama);
          masterSheet.getRange(j + 1, 14).setValue(now);
          break;
        }
      }
      detailSheet.deleteRow(i + 1);
    }
  }

  // 2. Hapus Mutasi Lama
  const mutasiValues = mutasiSheet.getDataRange().getValues();
  for (let i = mutasiValues.length - 1; i >= 1; i--) {
     if (mutasiValues[i][7] == payload.id_transaksi) {
       mutasiSheet.deleteRow(i + 1);
     }
  }

  // 3. Update Header
  const headerValues = headerSheet.getDataRange().getValues();
  for (let i = 1; i < headerValues.length; i++) {
    if (headerValues[i][0] == payload.id_transaksi) {
      headerSheet.getRange(i + 1, 2, 1, 4).setValues([[
        payload.tanggal,
        payload.unit_id,
        payload.unit_nama,
        payload.keterangan
      ]]);
      break;
    }
  }

  // 4. Masukkan Detail Baru (Kurangi stok kembali)
  payload.items.forEach(item => {
    detailSheet.appendRow([
      payload.id_transaksi,
      item.kode_barang,
      item.nama_barang,
      item.satuan,
      item.qty
    ]);
    
    // Update Master
    const mValues = masterSheet.getDataRange().getValues();
    let currentSaldo = 0;
    for (let k = 1; k < mValues.length; k++) {
        if (mValues[k][0] == item.kode_barang) {
            currentSaldo = Number(mValues[k][12] || 0);
            const newSaldo = currentSaldo - Number(item.qty);
            masterSheet.getRange(k + 1, 13).setValue(newSaldo);
            masterSheet.getRange(k + 1, 14).setValue(now);
            
            // Trigger Email Alert check
            checkAndSendEmailAlert({
              kode_barang: mValues[k][0],
              nama_barang: mValues[k][1],
              stok_minimum: mValues[k][5],
              monitor_stok: mValues[k][6],
              prioritas_alert: mValues[k][7],
              kirim_email_alert: mValues[k][8],
              satuan: mValues[k][4],
              lokasi_rak: mValues[k][10],
              stok_sekarang: newSaldo
            });
            
            currentSaldo = newSaldo;
            break;
        }
    }
    
    // Mutasi
    mutasiSheet.appendRow([
      now,
      item.kode_barang,
      item.nama_barang,
      'KELUAR (UPDATE)',
      0,
      item.qty,
      currentSaldo,
      payload.id_transaksi
    ]);
  });

  return { success: true };
}

function handleDeleteBarangKeluar(ss, payload) {
  const headerSheet = ss.getSheetByName('TRX_BARANG_KELUAR_H');
  const detailSheet = ss.getSheetByName('TRX_BARANG_KELUAR_D');
  const masterSheet = ss.getSheetByName('MASTER_BARANG');
  const mutasiSheet = ss.getSheetByName('TRX_MUTASI_STOK');

  // 1. Reversal
  const detailValues = detailSheet.getDataRange().getValues();
  const masterValues = masterSheet.getDataRange().getValues();

  for (let i = detailValues.length - 1; i >= 1; i--) {
    if (detailValues[i][0] == payload.id_transaksi) {
      const kodeBarang = detailValues[i][1];
      const qtyLama = Number(detailValues[i][4]);
      
      for (let j = 1; j < masterValues.length; j++) {
        if (masterValues[j][0] == kodeBarang) {
          const saldoSekarang = Number(masterValues[j][12]);
          masterSheet.getRange(j + 1, 13).setValue(saldoSekarang + qtyLama);
          masterSheet.getRange(j + 1, 14).setValue(new Date());
          break;
        }
      }
      detailSheet.deleteRow(i + 1);
    }
  }

  // 2. Hapus Header
  const headerValues = headerSheet.getDataRange().getValues();
  for (let i = headerValues.length - 1; i >= 1; i--) {
    if (headerValues[i][0] == payload.id_transaksi) {
      headerSheet.deleteRow(i + 1);
      break;
    }
  }

  // 3. Hapus Mutasi
  const mutasiValues = mutasiSheet.getDataRange().getValues();
  for (let i = mutasiValues.length - 1; i >= 1; i--) {
     if (mutasiValues[i][7] == payload.id_transaksi) {
       mutasiSheet.deleteRow(i + 1);
     }
  }

  return { success: true };
}

/**
 * LOGIK PERMINTAAN BARANG
 */
function handleSavePermintaan(ss, payload) {
  const headerSheet = ss.getSheetByName('TRX_PERMINTAAN_H');
  const detailSheet = ss.getSheetByName('TRX_PERMINTAAN_D');
  const now = new Date();

  headerSheet.appendRow([
    payload.id_permintaan,
    payload.tanggal,
    payload.unit_id,
    payload.unit_nama,
    payload.keterangan,
    'PENDING',
    payload.peminta,
    now
  ]);

  payload.items.forEach(item => {
    detailSheet.appendRow([
      payload.id_permintaan,
      item.kode_barang,
      item.nama_barang,
      item.satuan,
      item.qty, // QTY_DIMINTA
      item.qty, // QTY_DISETUJUI (initial value same as requested)
      ''        // CATATAN_REVIEW
    ]);
  });

  return { success: true, id: payload.id_permintaan };
}

function handleSaveReviewPermintaan(ss, payload) {
  const detailSheet = ss.getSheetByName('TRX_PERMINTAAN_D');
  const values = detailSheet.getDataRange().getValues();
  
  // 1. Delete existing details for this request
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]).trim() === String(payload.id_permintaan).trim()) {
      detailSheet.deleteRow(i + 1);
    }
  }
  
  // 2. Insert new reviewed details
  payload.items.forEach(item => {
    detailSheet.appendRow([
      payload.id_permintaan,
      item.kode_barang,
      item.nama_barang || '',
      item.satuan || '',
      item.qty_diminta || 0,
      item.qty_disetujui || 0,
      item.catatan_review || ''
    ]);
  });
  
  return { success: true };
}

function handleApprovePermintaan(ss, payload) {
  const reqHeaderSheet = ss.getSheetByName('TRX_PERMINTAAN_H');
  const reqDetailSheet = ss.getSheetByName('TRX_PERMINTAAN_D');
  const bkHeaderSheet = ss.getSheetByName('TRX_BARANG_KELUAR_H');
  const bkDetailSheet = ss.getSheetByName('TRX_BARANG_KELUAR_D');
  const masterSheet = ss.getSheetByName('MASTER_BARANG');
  const mutasiSheet = ss.getSheetByName('TRX_MUTASI_STOK');
  const now = new Date();

  if (!reqHeaderSheet || !reqDetailSheet || !bkHeaderSheet || !bkDetailSheet || !masterSheet || !mutasiSheet) {
    return { error: 'Salah satu sheet transaksi tidak ditemukan. Jalankan Seed Database.' };
  }

  // 1. Ambil Data Permintaan
  const rows = reqHeaderSheet.getDataRange().getValues();
  let reqData = null;
  let rowIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    const idInSheet = String(rows[i][0]).trim();
    const idInPayload = String(payload.id_permintaan).trim();
    const statusInSheet = String(rows[i][5]).trim().toUpperCase();

    if (idInSheet === idInPayload && statusInSheet === 'PENDING') {
      reqData = rows[i];
      rowIndex = i + 1;
      break;
    }
  }

  if (!reqData) {
    return { error: 'Permintaan (' + payload.id_permintaan + ') tidak ditemukan atau status bukan PENDING' };
  }

  // 2. Update Details in TRX_PERMINTAAN_D first (based on final review)
  if (payload.item_updates) {
    const detailValues = reqDetailSheet.getDataRange().getValues();
    // Delete old
    for (let i = detailValues.length - 1; i >= 1; i--) {
      if (String(detailValues[i][0]).trim() === String(payload.id_permintaan).trim()) {
        reqDetailSheet.deleteRow(i + 1);
      }
    }
    // Re-insert final approved items
    payload.item_updates.forEach(item => {
      reqDetailSheet.appendRow([
        payload.id_permintaan,
        item.kode_barang,
        item.nama_barang || '',
        item.satuan || '', 
        item.qty_diminta || 0,
        item.qty_disetujui || 0,
        item.catatan_review || ''
      ]);
    });
  }

  // 3. Simpan ke Barang Keluar (Distribusi)
  const idBK = `BK-${Date.now()}`;
  bkHeaderSheet.appendRow([
    idBK,
    Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd"),
    reqData[2], // unit_id
    reqData[3], // unit_nama
    `DISTRIBUSI PERMINTAAN: ${payload.id_permintaan}`,
    payload.user_approver || 'Admin',
    now
  ]);

  // 4. Proses Item & Update Stok berdasarkan Qty Disetujui
  const itemsToProcess = payload.item_updates || [];
  const masterValues = masterSheet.getDataRange().getValues();
  
  itemsToProcess.forEach(item => {
    const kodeBarang = item.kode_barang;
    const qty = Number(item.qty_disetujui);
    
    let namaBarang = item.nama_barang;
    let satuan = item.satuan;
    let currentSaldo = 0;
    
    for (let k = 1; k < masterValues.length; k++) {
      if (String(masterValues[k][0]).trim() === String(kodeBarang).trim()) {
        if (!namaBarang) namaBarang = masterValues[k][1];
        if (!satuan) satuan = masterValues[k][4];
        
        currentSaldo = Number(masterValues[k][12] || 0);
        const newSaldo = currentSaldo - qty;
        masterSheet.getRange(k + 1, 13).setValue(newSaldo);
        masterSheet.getRange(k + 1, 14).setValue(now);
        
        // Trigger Email Alert check
        checkAndSendEmailAlert({
          kode_barang: masterValues[k][0],
          nama_barang: masterValues[k][1],
          stok_minimum: masterValues[k][5],
          monitor_stok: masterValues[k][6],
          prioritas_alert: masterValues[k][7],
          kirim_email_alert: masterValues[k][8],
          satuan: masterValues[k][4],
          lokasi_rak: masterValues[k][10],
          stok_sekarang: newSaldo
        });
        
        currentSaldo = newSaldo;
        break;
      }
    }

    bkDetailSheet.appendRow([idBK, kodeBarang, namaBarang || '', satuan || '', qty]);

    // Mutasi
    mutasiSheet.appendRow([
      now, kodeBarang, namaBarang || '', 'KELUAR (PERMINTAAN)', 0, qty, currentSaldo, idBK
    ]);
  });

  // 5. Update Status Permintaan
  reqHeaderSheet.getRange(rowIndex, 6).setValue('APPROVED');
  
  return { success: true, id_bk: idBK };
}

function handleRejectPermintaan(ss, payload) {
  const sheet = ss.getSheetByName('TRX_PERMINTAAN_H');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(payload.id_permintaan).trim()) {
      sheet.getRange(i + 1, 6).setValue('REJECTED');
      return { success: true };
    }
  }
  return { error: 'Permintaan (' + payload.id_permintaan + ') tidak ditemukan' };
}

function handleRevisionPermintaan(ss, payload) {
  const sheet = ss.getSheetByName('TRX_PERMINTAAN_H');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(payload.id_permintaan).trim()) {
      sheet.getRange(i + 1, 6).setValue('REVISION');
      return { success: true };
    }
  }
  return { error: 'Permintaan (' + payload.id_permintaan + ') tidak ditemukan' };
}

function handleUpdateBarangMasuk(ss, payload) {
  const headerSheet = ss.getSheetByName('TRX_BARANG_MASUK_H');
  const detailSheet = ss.getSheetByName('TRX_BARANG_MASUK_D');
  const masterSheet = ss.getSheetByName('MASTER_BARANG');
  const mutasiSheet = ss.getSheetByName('TRX_MUTASI_STOK');
  const now = new Date();

  // 1. REVERSAL STOK (Kembalikan stok lama sebelum di-update)
  const detailValues = detailSheet.getDataRange().getValues();
  const masterValues = masterSheet.getDataRange().getValues();

  for (let i = detailValues.length - 1; i >= 1; i--) {
    if (detailValues[i][0] == payload.id_transaksi) {
      const kodeBarang = detailValues[i][1];
      const qtyLama = Number(detailValues[i][4]);
      
      // Update Master (Kurangi stok yang dulu pernah ditambah)
      for (let j = 1; j < masterValues.length; j++) {
        if (masterValues[j][0] == kodeBarang) {
          const saldoSekarang = Number(masterValues[j][12]);
          masterSheet.getRange(j + 1, 13).setValue(saldoSekarang - qtyLama);
          masterSheet.getRange(j + 1, 14).setValue(now);
          break;
        }
      }
      // Hapus detail lama
      detailSheet.deleteRow(i + 1);
    }
  }

  // 2. Hapus Mutasi Lama
  const mutasiValues = mutasiSheet.getDataRange().getValues();
  for (let i = mutasiValues.length - 1; i >= 1; i--) {
     if (mutasiValues[i][7] == payload.id_transaksi) {
       mutasiSheet.deleteRow(i + 1);
     }
  }

  // 3. Update Header
  const headerValues = headerSheet.getDataRange().getValues();
  for (let i = 1; i < headerValues.length; i++) {
    if (headerValues[i][0] == payload.id_transaksi) {
      headerSheet.getRange(i + 1, 2, 1, 6).setValues([[
        payload.tanggal,
        payload.no_faktur,
        payload.supplier_nama,
        payload.keterangan,
        payload.file_faktur_url || '',
        payload.grand_total
      ]]);
      break;
    }
  }

  // 4. Masukkan Detail & Update Stok Baru
  processItems(payload, masterSheet, detailSheet, mutasiSheet, now, 'MASUK (UPDATE)');

  return { success: true };
}

function processItems(payload, masterSheet, detailSheet, mutasiSheet, timestamp, jenis) {
  payload.items.forEach(item => {
    // Simpan Detail Baru
    detailSheet.appendRow([
      payload.id_transaksi,
      item.kode_barang,
      item.nama_barang,
      item.satuan,
      item.qty,
      item.harga,
      item.total
    ]);
    
    // Update Stok di Master
    const masterValues = masterSheet.getDataRange().getValues();
    let currentSaldo = 0;
    
    for (let i = 1; i < masterValues.length; i++) {
        if (masterValues[i][0] == item.kode_barang) {
            currentSaldo = Number(masterValues[i][12] || 0);
            const newSaldo = currentSaldo + Number(item.qty);
            masterSheet.getRange(i + 1, 13).setValue(newSaldo);
            masterSheet.getRange(i + 1, 14).setValue(timestamp);
            currentSaldo = newSaldo;
            break;
        }
    }
    
    // Simpan Mutasi Baru
    mutasiSheet.appendRow([
      timestamp,
      item.kode_barang,
      item.nama_barang,
      jenis,
      jenis.includes('MASUK') ? item.qty : 0,
      jenis.includes('KELUAR') ? item.qty : 0,
      currentSaldo,
      payload.id_transaksi
    ]);
  });
}

function handleLogin(email, password) {
  try {
    const ss = getSpreadsheet(AUTH_SPREADSHEET_ID);
    const sheet = ss.getSheetByName('users');
    if (!sheet) return { success: false, error: 'Sheet users tidak ditemukan' };
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indexes
    let emailIdx = -1, passIdx = -1, nameIdx = -1, roleIdx = -1, statusIdx = -1;
    headers.forEach((h, i) => {
      const lower = h.toLowerCase();
      if (lower === 'email') emailIdx = i;
      if (lower === 'password') passIdx = i;
      if (lower === 'name') nameIdx = i;
      if (lower === 'role') roleIdx = i;
      if (lower === 'status') statusIdx = i;
    });
    
    if (emailIdx === -1 || passIdx === -1) {
       return { success: false, error: 'Kolom email atau password tidak ditemukan di sheet users' };
    }
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][emailIdx]).trim() === String(email).trim() && 
          String(data[i][passIdx]).trim() === String(password).trim()) {
        
        const statusStr = String(data[i][statusIdx] || '').toLowerCase();
        if (statusStr !== 'aktif' && statusStr !== 'true' && statusStr !== '1') {
          return { success: false, error: 'Akun Anda sedang tidak aktif' };
        }
        
        return {
          success: true,
          user: {
            email: data[i][emailIdx],
            name: data[i][nameIdx] || 'User',
            role: String(data[i][roleIdx] || 'UNIT').toUpperCase().replace('STAFF', 'UNIT'),
            token: Utilities.base64Encode(data[i][emailIdx] + ':' + Date.now())
          }
        };
      }
    }
    return { success: false, error: 'Email atau password salah' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0];
  const data = [];
  
  for (let i = 1; i < values.length; i++) {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.toLowerCase()] = values[i][index];
    });
    data.push(obj);
  }
  return data;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleSeedData(ss) {
  // Logic untuk buat header sheet jika belum ada
  const sheets = [
    'SATUAN', 
    'SUPPLIER', 
    'UNIT_RUANGAN', 
    'MASTER_BARANG', 
    'TRX_BARANG_MASUK_H', 
    'TRX_BARANG_MASUK_D', 
    'TRX_BARANG_KELUAR_H', 
    'TRX_BARANG_KELUAR_D', 
    'TRX_MUTASI_STOK',
    'TRX_PERMINTAAN_H',
    'TRX_PERMINTAAN_D'
  ];
  const headers = {
    'SATUAN': ['KODE', 'NAMA_SATUAN', 'ALIAS_INPUT', 'KETERANGAN', 'STATUS'],
    'SUPPLIER': ['ID_SUPPLIER', 'NAMA_SUPPLIER', 'KONTAK', 'ALAMAT', 'STATUS'],
    'UNIT_RUANGAN': ['ID_UNIT', 'NAMA_UNIT', 'BIDANG', 'STATUS'],
    'MASTER_BARANG': ['KODE_BARANG', 'NAMA_BARANG', 'KATEGORI', 'SUB_KATEGORI', 'SATUAN', 'STOK_MINIMUM', 'MONITOR_STOK', 'PRIORITAS_ALERT', 'KIRIM_EMAIL_ALERT', 'MERK', 'LOKASI_RAK', 'STATUS', 'STOK_SEKARANG', 'LAST_STOCK_UPDATE'],
    'TRX_BARANG_MASUK_H': ['ID_TRANSAKSI', 'TANGGAL', 'NO_FAKTUR', 'SUPPLIER', 'KETERANGAN', 'FILE_FAKTUR', 'TOTAL', 'USER_INPUT', 'CREATED_AT'],
    'TRX_BARANG_MASUK_D': ['ID_TRANSAKSI', 'KODE_BARANG', 'NAMA_BARANG', 'SATUAN', 'QTY', 'HARGA', 'TOTAL'],
    'TRX_BARANG_KELUAR_H': ['ID_TRANSAKSI', 'TANGGAL', 'UNIT_ID', 'UNIT_NAMA', 'KETERANGAN', 'USER_INPUT', 'CREATED_AT'],
    'TRX_BARANG_KELUAR_D': ['ID_TRANSAKSI', 'KODE_BARANG', 'NAMA_BARANG', 'SATUAN', 'QTY'],
    'TRX_MUTASI_STOK': ['TANGGAL', 'KODE_BARANG', 'NAMA_BARANG', 'JENIS', 'MASUK', 'KELUAR', 'SALDO', 'REFERENSI'],
    'TRX_PERMINTAAN_H': ['ID_PERMINTAAN', 'TANGGAL', 'UNIT_ID', 'UNIT_NAMA', 'KETERANGAN', 'STATUS', 'PEMINTA', 'CREATED_AT'],
    'TRX_PERMINTAAN_D': ['ID_PERMINTAAN', 'KODE_BARANG', 'NAMA_BARANG', 'SATUAN', 'QTY_DIMINTA', 'QTY_DISETUJUI', 'CATATAN_REVIEW']
  };

  sheets.forEach(name => {
    let s = ss.getSheetByName(name);
    if (!s) {
      s = ss.insertSheet(name);
      s.appendRow(headers[name]);
    } else {
      // Check headers
      const currentHeaders = s.getRange(1, 1, 1, s.getLastColumn() || 1).getValues()[0];
      const requiredHeaders = headers[name];
      
      // Basic check: if length differs or first few mismatch, force update headers
      if (currentHeaders.length < requiredHeaders.length) {
         // Caution: this might shift data if not careful, 
         // but for TRX_PERMINTAAN_D we added columns at the end, so it's safer.
         // Let's just append missing headers if any? No, better to force the defined headers.
         s.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
      }
    }
  });

  return { success: true };
}
