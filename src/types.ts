export enum UserRole {
  ADMIN = 'ADMIN',
  GUDANG = 'GUDANG',
  UNIT = 'UNIT',
  DIREKTUR = 'DIREKTUR'
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'AKTIF' | 'NON-AKTIF';
}

export interface Kategori {
  id?: string;
  id_kategori: string;
  nama_kategori: string;
  keterangan: string;
  status: 'AKTIF' | 'NON-AKTIF';
}

export interface Satuan {
  id?: string;
  kode: string;
  nama_satuan: string;
  alias_input: string;
  keterangan: string;
  status: 'AKTIF' | 'NON-AKTIF';
}

export interface Unit {
  id?: string;
  id_unit: string;
  nama_unit: string;
  bidang: string;
  status: 'AKTIF' | 'NON-AKTIF';
}

export interface Supplier {
  id?: string;
  id_supplier: string;
  nama_supplier: string;
  kontak: string;
  alamat: string;
  status: 'AKTIF' | 'NON-AKTIF';
}

export interface MasterBarang {
  id?: string;
  kode_barang: string;
  nama_barang: string;
  kategori: string;
  sub_kategori: string;
  satuan: string;
  stok_minimum: number;
  monitor_stok: 'Ya' | 'Tidak';
  prioritas_alert: 'Normal' | 'Penting' | 'Kritis';
  kirim_email_alert: 'Ya' | 'Tidak';
  merk: string;
  lokasi_rak: string;
  status: 'AKTIF' | 'NON-AKTIF';
  stok_sekarang: number;
  last_stock_update: string;
}

export interface TrxMasukHeader {
  id?: string;
  id_transaksi: string;
  tanggal: string;
  no_faktur: string;
  supplier_id: string;
  supplier_nama: string;
  keterangan: string;
  file_faktur_url?: string;
  total_qty: number;
  grand_total: number;
  user_input: string;
  created_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface TrxMasukDetail {
  id?: string;
  id_transaksi: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  qty: number;
  harga: number;
  total: number;
}

export interface TrxKeluarHeader {
  id?: string;
  id_transaksi: string;
  tanggal: string;
  unit_id: string;
  unit_nama: string;
  keterangan: string;
  user_input: string;
  created_at?: string;
}

export interface TrxKeluarDetail {
  id?: string;
  id_transaksi: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  qty: number;
}

export interface MutasiStok {
  id?: string;
  tanggal: string;
  kode_barang: string;
  nama_barang: string;
  jenis: 'MASUK' | 'KELUAR' | 'MUTASI' | 'ADJUSTMENT' | 'SALDO AWAL';
  masuk: number;
  keluar: number;
  saldo: number;
  referensi: string;
}

export interface TrxPermintaanHeader {
  id?: string;
  id_permintaan: string;
  tanggal: string;
  unit_id: string;
  unit_nama: string;
  peminta: string;
  keterangan: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface TrxPermintaanDetail {
  id?: string;
  id_permintaan: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  qty: number;
  qty_diminta: number;
  qty_disetujui: number;
  catatan_review: string;
  is_new?: boolean;
}
