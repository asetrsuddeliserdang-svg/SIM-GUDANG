/**
 * GAS SERVICE
 * Menghubungkan Frontend React ke Google Sheets API via Apps Script Web App
 */

const rawUrl = import.meta.env.VITE_GAS_WEBAPP_URL;
const GAS_URL = rawUrl ? rawUrl.trim() : "";

class GASService {
  private async request(method: 'GET' | 'POST', body?: any, params: Record<string, string> = {}) {
    if (!GAS_URL || GAS_URL === "" || GAS_URL.includes('GANTI_DENGAN_URL')) {
      const msg = 'Konfigurasi VITE_GAS_WEBAPP_URL belum valid. Silakan pasang URL Web App (akhiran /exec) di Settings > Environment Variables.';
      console.warn(msg);
      throw new Error(msg);
    }

    if (!GAS_URL.startsWith('https://')) {
      const msg = 'URL Google Apps Script tidak valid. URL harus diawali dengan https://';
      console.warn(msg);
      throw new Error(msg);
    }

    if (!GAS_URL.includes('/macros/s/') || !GAS_URL.includes('/exec')) {
      const msg = 'URL Google Apps Script tidak valid. Pastikan Anda menyalin "Web App URL" (akhiran /exec), bukan URL editor atau URL Spreadsheet.';
      console.warn(msg);
      throw new Error(msg);
    }

    let fetchUrl = GAS_URL;
    try {
      const urlObj = new URL(GAS_URL);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          urlObj.searchParams.append(key, params[key]);
        }
      });
      fetchUrl = urlObj.toString();
    } catch (e) {
      throw new Error(`URL Google Apps Script tidak valid: "${GAS_URL}".`);
    }

    const options: RequestInit = {
      method,
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
    };

    if (method === 'POST') {
      options.body = JSON.stringify(body);
      // text/plain avoids CORS preflight OPTIONS request which GAS doesn't support well
      options.headers = {
        'Content-Type': 'text/plain;charset=utf-8',
      };
    }

    console.log(`[GAS] ${method} -> ${fetchUrl.split('?')[0]}?action=${params.action || (body?body.action:'')}`);

    try {
      const response = await fetch(fetchUrl, options);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      
      // Basic check for HTML response which usually means redirected to a Google login page
      if (text.startsWith('<!DOCTYPE html>') || text.includes('<html')) {
        throw new Error('Respon dari Google bukan JSON. Pastikan Web App di-deploy dengan akses "Anyone" (Siapa Saja) dan Anda sudah memberi izin (Authorize) di Google Apps Script.');
      }

      try {
        const json = JSON.parse(text);
        if (json.error) {
          throw new Error(json.error);
        }
        return json;
      } catch (parseError) {
        console.error('GAS Raw Response:', text.substring(0, 500));
        throw new Error('Gagal membaca data dari Google Sheets. Pastikan skrip Google Apps Script tidak error.');
      }
    } catch (error: any) {
      const isFailedToFetch = error.message === 'Failed to fetch' || error.name === 'TypeError';
      
      console.error('GAS Request Failed:', {
        url: fetchUrl.substring(0, 60) + '...',
        method,
        error: error.message
      });
      
      if (isFailedToFetch) {
        const msg = `Gagal terhubung ke Google Apps Script. 
        
        PENYEBAB UMUM:
        1. Web App belum di-deploy sebagai "Anyone" (Siapa Saja).
        2. Anda belum klik "Authorize" (Izinkan) di Editor Google Apps Script.
        3. Browser/AdBlocker memblokir request ke script.google.com.
        4. URL Web App salah (harus berakhir /exec).
        
        SOLUSI:
        - Buka Code.gs di Google Apps Script, klik "Deploy" > "New Deployment".
        - Pastikan "Who has access" dipilih "Anyone".
        - Tes akses dengan membuka URL tersebut di Tab Baru browser.`;
        throw new Error(msg);
      }
      throw error;
    }
  }

  // Utility to check if connection is possible
  async testConnection() {
    try {
      await this.request('GET', null, { action: 'ping' });
      return true;
    } catch (e) {
      return false;
    }
  }

  // GET Methods
  async getMasters() {
    return this.request('GET', null, { action: 'getMasters' });
  }

  async getDashboard() {
    return this.request('GET', null, { action: 'getDashboard' });
  }

  async getRecentTrx() {
    return this.request('GET', null, { action: 'getRecentTrx' });
  }

  async getRecentTrxKeluar() {
    return this.request('GET', null, { action: 'getRecentTrxKeluar' });
  }

  async getMutasi() {
    return this.request('GET', null, { action: 'getMutasi' });
  }

  async getTrxDetail(id_transaksi: string) {
    return this.request('GET', null, { action: 'getTrxMasukDetail', id_transaksi });
  }

  async getTrxKeluarDetail(id_transaksi: string) {
    return this.request('GET', null, { action: 'getTrxKeluarDetail', id_transaksi });
  }

  async getAllTrxDetails() {
    return this.request('GET', null, { action: 'getAllTrxDetails' });
  }

  async getReportsData(): Promise<{
    barang: any[];
    mutasi: any[];
    headerMasuk: any[];
    detailMasuk: any[];
    headerKeluar: any[];
    detailKeluar: any[];
    supplier: any[];
    unit: any[];
  }> {
    return this.request('GET', null, { action: 'getReportsData' });
  }

  // POST Methods
  async uploadFile(payload: { fileName: string, mimeType: string, base64: string }) {
    return this.request('POST', { action: 'uploadFile', payload });
  }

  async saveBarangMasuk(payload: any) {
    return this.request('POST', { action: 'saveBarangMasuk', payload });
  }

  async saveBarangKeluar(payload: any) {
    return this.request('POST', { action: 'saveBarangKeluar', payload });
  }

  async updateBarangKeluar(payload: any) {
    return this.request('POST', { action: 'updateBarangKeluar', payload });
  }

  async deleteBarangKeluar(payload: any) {
    return this.request('POST', { action: 'deleteBarangKeluar', payload });
  }

  async savePermintaan(payload: any) {
    return this.request('POST', { action: 'savePermintaan', payload });
  }

  async approvePermintaan(payload: any) {
    return this.request('POST', { action: 'approvePermintaan', payload });
  }

  async rejectPermintaan(payload: any) {
    return this.request('POST', { action: 'rejectPermintaan', payload });
  }

  async revisionPermintaan(payload: any) {
    return this.request('POST', { action: 'revisionPermintaan', payload });
  }

  async saveReviewPermintaan(payload: { id_permintaan: string, items: any[], user_reviewer: string }) {
    return this.request('POST', { action: 'saveReviewPermintaan', payload });
  }

  async getPermintaanPending() {
    return this.request('GET', null, { action: 'getPermintaanPending' });
  }

  async getPermintaanAll() {
    return this.request('GET', null, { action: 'getPermintaanAll' });
  }

  async getPermintaanDetail(id_permintaan: string) {
    return this.request('GET', null, { action: 'getPermintaanDetail', id_permintaan });
  }

  async updateBarangMasuk(payload: any) {
    return this.request('POST', { action: 'updateBarangMasuk', payload });
  }

  async saveBarang(payload: any) {
    return this.request('POST', { action: 'saveBarang', payload });
  }

  async updateBarang(payload: any) {
    return this.request('POST', { action: 'updateBarang', payload });
  }

  async deleteBarang(kode_barang: string) {
    return this.request('POST', { action: 'deleteBarang', payload: { kode_barang } });
  }

  async saveSupplier(payload: any) {
    return this.request('POST', { action: 'saveSupplier', payload });
  }

  async updateSupplier(payload: any) {
    return this.request('POST', { action: 'updateSupplier', payload });
  }

  async saveSatuan(payload: any) {
    return this.request('POST', { action: 'saveSatuan', payload });
  }

  async updateSatuan(payload: any) {
    return this.request('POST', { action: 'updateSatuan', payload });
  }

  async saveUnit(payload: any) {
    return this.request('POST', { action: 'saveUnit', payload });
  }

  async updateUnit(payload: any) {
    return this.request('POST', { action: 'updateUnit', payload });
  }

  async deleteSupplier(id_supplier: string) {
    return this.request('POST', { action: 'deleteSupplier', payload: { id_supplier } });
  }

  async deleteSatuan(kode: string) {
    return this.request('POST', { action: 'deleteSatuan', payload: { kode } });
  }

  async deleteUnit(id_unit: string) {
    return this.request('POST', { action: 'deleteUnit', payload: { id_unit } });
  }

  async saveSaldoAwal(payload: any) {
    return this.request('POST', { action: 'saveSaldoAwal', payload });
  }

  async seedDatabase() {
    return this.request('POST', { action: 'seedData' });
  }
}

export const gasService = new GASService();
