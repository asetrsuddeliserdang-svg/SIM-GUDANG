import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button, buttonVariants } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { SearchBarang } from '@/components/SearchBarang';
import { SearchSelect } from '@/components/SearchSelect';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Calendar as CalendarIcon, 
  Package, 
  Search, 
  Clock,
  CheckCircle2,
  FileText,
  ChevronRight,
  Box,
  Loader2,
  Home,
  MoreVertical,
  Edit,
  Eye,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gasService } from '../services/gasService';
import { Unit, TrxKeluarHeader, TrxKeluarDetail } from '../types';
import { useMasterData } from '../context/MasterDataContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

import { DataTable, Column } from '../components/DataTable';
import { DatePicker } from '../components/ui/date-picker';
import { parseISO } from 'date-fns';

interface FormItem {
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  qty: number;
}

export default function BarangKeluar() {
  const { user } = useAuth();
  const { barangList, unitList, loading: masterLoading } = useMasterData();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('entry');
  const [recentTrx, setRecentTrx] = useState<TrxKeluarHeader[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CRUD State
  const [isEditing, setIsEditing] = useState(false);
  const [editTrxId, setEditTrxId] = useState<string | null>(null);

  // Detail State
  const [selectedTrx, setSelectedTrx] = useState<TrxKeluarHeader | null>(null);
  const [trxDetail, setTrxDetail] = useState<TrxKeluarDetail[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form State
  const [header, setHeader] = useState({
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    unit_id: '',
    unit_nama: '',
    keterangan: '',
  });

  const [items, setItems] = useState<FormItem[]>([
    { kode_barang: '', nama_barang: '', satuan: '', qty: 1 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setErrorMsg(null);
    if (!import.meta.env.VITE_GAS_WEBAPP_URL) {
      setErrorMsg('VITE_GAS_WEBAPP_URL_MISSING');
      return;
    }
    setLoading(true);
    try {
      const trx = await gasService.getRecentTrxKeluar();
      if (Array.isArray(trx)) {
        // Default sort by date descending
        const sortedTrx = [...trx].sort((a, b) => {
          const dateA = new Date(a.tanggal).getTime();
          const dateB = new Date(b.tanggal).getTime();
          return dateB - dateA;
        });
        setRecentTrx(sortedTrx);
      } else if (trx && typeof trx === 'object' && 'error' in trx) {
        throw new Error(trx.error);
      } else {
        setRecentTrx([]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
      toast.error("Gagal memuat data dari Google Sheets");
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = () => {
    setItems([...items, { kode_barang: '', nama_barang: '', satuan: '', qty: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof FormItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'kode_barang') {
      const selected = barangList.find(b => b.kode_barang === value);
      if (selected) {
        item.nama_barang = selected.nama_barang;
        item.satuan = selected.satuan;
      }
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const historyColumns: Column<TrxKeluarHeader>[] = [
    {
      header: 'ID Transaksi',
      accessorKey: 'id_transaksi',
      sortable: true,
      cell: (trx) => (
        <p className="font-black text-sky-900 font-mono text-[10px] uppercase tracking-tighter italic leading-none">{trx.id_transaksi}</p>
      )
    },
    {
      header: 'Tanggal',
      accessorKey: 'tanggal',
      sortable: true,
      cell: (trx) => (
        <div className="flex items-center gap-1">
          <CalendarIcon size={12} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-600">
            {(() => {
              try {
                return format(new Date(trx.tanggal), 'dd MMMM yyyy', { locale: id });
              } catch (e) {
                return trx.tanggal;
              }
            })()}
          </span>
        </div>
      )
    },
    {
      header: 'Unit / Ruangan',
      accessorKey: 'unit_nama',
      sortable: true,
      sticky: 'left',
      cell: (trx) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 text-sky-400 rounded-xl flex items-center justify-center shadow-lg">
             <Home size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{trx.unit_nama}</span>
            <span className="text-[10px] text-slate-400 font-black font-mono tracking-tighter">ID: {trx.unit_id}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Keterangan',
      accessorKey: 'keterangan',
      cell: (trx) => (
        <p className="text-[10px] text-slate-400 italic max-w-[200px] truncate uppercase font-bold">
          {trx.keterangan || 'Tanpa Catatan'}
        </p>
      )
    },
    {
      header: 'Aksi',
      accessorKey: 'id_transaksi',
      className: 'text-right sticky right-0 bg-white group-hover:bg-sky-50 transition-colors',
      cell: (trx) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 w-8 p-0 hover:bg-sky-50")}>
              <MoreVertical size={16} className="text-slate-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-slate-100 p-1.5 bg-white">
              <DropdownMenuItem 
                onClick={() => handleShowDetail(trx)}
                className="rounded-lg h-9 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-sky-50 hover:text-sky-600 cursor-pointer"
              >
                <Eye size={14} className="mr-2" />
                Detail
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleEdit(trx)}
                className="rounded-lg h-9 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer"
              >
                <Edit size={14} className="mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDelete(trx)}
                className="rounded-lg h-9 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash size={14} className="mr-2" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  const handleEdit = async (trx: TrxKeluarHeader) => {
    setActiveTab('entry');
    setIsEditing(true);
    setEditTrxId(trx.id_transaksi);
    setLoading(true);
    
    // Set Header with date formatting for input type="date"
    let formattedDate = trx.tanggal;
    try {
      const dateObj = new Date(trx.tanggal);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = format(dateObj, 'yyyy-MM-dd');
      }
    } catch (e) {
      console.warn("Date parsing failed in handleEdit", e);
    }

    setHeader({
      tanggal: formattedDate,
      unit_id: trx.unit_id,
      unit_nama: trx.unit_nama,
      keterangan: trx.keterangan || '',
    });

    try {
      const details = await gasService.getTrxKeluarDetail(trx.id_transaksi);
      const itemsArray = Array.isArray(details) ? details : [];
      
      if (itemsArray.length > 0) {
        setItems(itemsArray.map(d => {
          // Helper to get property regardless of case or underscore/space
          const getVal = (obj: any, keys: string[]) => {
            for (const key of keys) {
              if (obj[key] !== undefined) return obj[key];
              if (obj[key.toLowerCase()] !== undefined) return obj[key.toLowerCase()];
              if (obj[key.toUpperCase()] !== undefined) return obj[key.toUpperCase()];
              const spaceKey = key.replace(/_/g, ' ');
              if (obj[spaceKey] !== undefined) return obj[spaceKey];
              if (obj[spaceKey.toLowerCase()] !== undefined) return obj[spaceKey.toLowerCase()];
              if (obj[spaceKey.toUpperCase()] !== undefined) return obj[spaceKey.toUpperCase()];
            }
            return '';
          };

          return {
            kode_barang: getVal(d, ['kode_barang', 'kode barang', 'kode']),
            nama_barang: getVal(d, ['nama_barang', 'nama barang', 'nama']),
            satuan: getVal(d, ['satuan']),
            qty: Number(getVal(d, ['qty', 'jumlah']) || 0)
          };
        }));
      } else {
        // Fallback or empty items if none found
        setItems([{ kode_barang: '', nama_barang: '', satuan: '', qty: 1 }]);
      }
      toast.info(`Mengedit transaksi ${trx.id_transaksi}`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat detail untuk diedit");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (trx: TrxKeluarHeader) => {
    if (!window.confirm(`Hapus transaksi ${trx.id_transaksi}?\nStok akan dikembalikan ke Master Barang.`)) return;

    const toastId = toast.loading("Menghapus transaksi...");
    try {
      await gasService.deleteBarangKeluar({ id_transaksi: trx.id_transaksi });
      toast.success("Transaksi berhasil dihapus", { id: toastId });
      fetchData();
    } catch (err) {
      toast.error("Gagal menghapus transaksi", { id: toastId });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTrxId(null);
    setHeader({
      tanggal: format(new Date(), 'yyyy-MM-dd'),
      unit_id: '',
      unit_nama: '',
      keterangan: '',
    });
    setItems([{ kode_barang: '', nama_barang: '', satuan: '', qty: 1 }]);
  };

  const handleShowDetail = async (trx: TrxKeluarHeader) => {
    setSelectedTrx(trx);
    setIsDetailOpen(true);
    setDetailLoading(true);
    try {
      const details = await gasService.getTrxKeluarDetail(trx.id_transaksi);
      if (Array.isArray(details)) {
        const getVal = (obj: any, keys: string[]) => {
          for (const key of keys) {
            if (obj[key] !== undefined) return obj[key];
            if (obj[key.toLowerCase()] !== undefined) return obj[key.toLowerCase()];
            if (obj[key.toUpperCase()] !== undefined) return obj[key.toUpperCase()];
            const spaceKey = key.replace(/_/g, ' ');
            if (obj[spaceKey] !== undefined) return obj[spaceKey];
            if (obj[spaceKey.toLowerCase()] !== undefined) return obj[spaceKey.toLowerCase()];
            if (obj[spaceKey.toUpperCase()] !== undefined) return obj[spaceKey.toUpperCase()];
          }
          return '';
        };

        setTrxDetail(details.map(d => ({
          id_transaksi: trx.id_transaksi,
          kode_barang: getVal(d, ['kode_barang', 'kode barang', 'kode']),
          nama_barang: getVal(d, ['nama_barang', 'nama barang', 'nama']),
          satuan: getVal(d, ['satuan']),
          qty: Number(getVal(d, ['qty', 'jumlah']) || 0)
        })));
      } else if (details && typeof details === 'object' && 'error' in details) {
        throw new Error(details.error);
      } else {
        setTrxDetail([]);
      }
    } catch (err) {
      toast.error("Gagal memuat detail transaksi");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async () => {
    if (!header.unit_id) {
      toast.error("Harap pilih Unit / Ruangan tujuan");
      return;
    }

    if (items.some(i => !i.kode_barang || i.qty <= 0)) {
       toast.error("Data barang dalam tabel tidak valid");
       return;
    }

    // Stok Validation
    for (const item of items) {
      const master = barangList.find(b => b.kode_barang === item.kode_barang);
      if (master && item.qty > master.stok_sekarang) {
        toast.error(`Stok "${item.nama_barang}" tidak mencukupi. Tersedia: ${master.stok_sekarang}`);
        return;
      }
    }

    const unitDoc = unitList.find(u => u.id_unit === header.unit_id);
    const toastId = toast.loading(isEditing ? "Memperbarui transaksi..." : "Menyimpan transaksi keluar...");
    setLoading(true);

    try {
      const payload = {
        id_transaksi: isEditing ? editTrxId : `BK-${Date.now()}`,
        tanggal: header.tanggal,
        unit_id: header.unit_id,
        unit_nama: unitDoc?.nama_unit || header.unit_nama || 'Unknown',
        keterangan: header.keterangan,
        items: items,
        user_input: user?.email || 'Anonymous'
      };

      if (isEditing) {
        await gasService.updateBarangKeluar(payload);
        toast.success("Transaksi Berhasil Diperbarui!", { id: toastId });
      } else {
        await gasService.saveBarangKeluar(payload);
        toast.success("Barang Keluar Berhasil Disimpan!", { id: toastId });
      }
      
      // Reset form
      handleCancelEdit();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan. Silakan coba lagi.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-6 pb-20"
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Barang Keluar</h2>
          <p className="text-slate-500 italic text-[10px] md:text-xs">Pendistribusian barang medis/non-medis ke unit atau ruangan</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
          <TabsList className="bg-white border p-1 rounded-xl h-auto md:h-12 shadow-sm mb-0 flex flex-nowrap items-center gap-1 min-w-full md:min-w-0 whitespace-nowrap">
            <TabsTrigger value="entry" className="rounded-lg px-4 md:px-6 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all h-10 text-[10px] sm:text-xs font-bold uppercase flex-1 shrink-0">
              <Plus size={16} className="mr-2" />
              {isEditing ? `Edit ${editTrxId}` : 'Input Baru'}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg px-4 md:px-6 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all h-10 text-[10px] sm:text-xs font-bold uppercase flex-1 shrink-0">
              <Clock size={16} className="mr-2" />
              Riwayat
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="entry" className="space-y-6 pt-4 mt-0 outline-none">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end relative overflow-hidden transition-opacity duration-300">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/10 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
              </div>
            )}
            <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Unit / Ruangan Tujuan</label>
              <SearchSelect 
                options={unitList.map(u => ({
                  value: u.id_unit,
                  label: u.nama_unit,
                  subLabel: u.bidang,
                  original: u
                }))}
                selectedValue={header.unit_id}
                placeholder="Pilih Unit / Ruangan..."
                searchPlaceholder="Ketik Nama atau Bidang Unit..."
                isLoading={masterLoading}
                onSelect={(value, original) => {
                  setHeader({
                    ...header, 
                    unit_id: value,
                    unit_nama: original?.nama_unit || ''
                  });
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Tgl. Pengeluaran</label>
              <DatePicker 
                date={header.tanggal ? parseISO(header.tanggal) : undefined}
                setDate={(date) => setHeader({...header, tanggal: date ? format(date, 'yyyy-MM-dd') : ''})}
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Keterangan / Catatan</label>
              <Input 
                placeholder="Mis: Permintaan Unit..." 
                value={header.keterangan}
                onChange={(e) => setHeader({...header, keterangan: e.target.value})}
                className="text-sm h-10 bg-slate-50 border border-slate-200 rounded-md focus:ring-sky-600/20"
              />
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Item Barang Yang Dikeluarkan</h2>
              <Button onClick={addItemRow} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold h-8 uppercase transition-colors">
                <Plus size={14} className="mr-1.5" />
                Tambah Barang
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white text-[11px] uppercase text-slate-500 font-bold">
                  <TableRow>
                    <TableHead className="w-12 px-4">No</TableHead>
                    <TableHead className="px-4">Nama Barang / Kode</TableHead>
                    <TableHead className="w-32 px-4">Satuan</TableHead>
                    <TableHead className="w-32 px-4 text-center">Qty Keluar</TableHead>
                    <TableHead className="w-16 px-4 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={`form-row-keluar-${idx}`} className="hover:bg-slate-50 divide-x divide-slate-50">
                      <TableCell className="px-4 font-mono text-[11px] text-slate-400">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <SearchBarang 
                            barangList={barangList}
                            selectedKode={item.kode_barang}
                            isLoading={loading}
                            onSelect={(selected) => {
                              const newItems = [...items];
                              newItems[idx] = {
                                ...newItems[idx],
                                kode_barang: selected.kode_barang,
                                nama_barang: selected.nama_barang,
                                satuan: selected.satuan,
                                qty: selected.stok_sekarang > 0 ? Math.min(newItems[idx].qty, selected.stok_sekarang) : 0
                              };
                              setItems(newItems);
                            }}
                          />
                          
                          {item.kode_barang && (
                            <div className={cn(
                              "p-2 rounded-lg border",
                              (barangList.find(b => b.kode_barang === item.kode_barang)?.stok_sekarang || 0) > 0 
                                ? "bg-emerald-50/50 border-emerald-100" 
                                : "bg-red-50/50 border-red-100"
                            )}>
                              <div className="flex items-center gap-1.5">
                                <Box size={12} className={cn(
                                  (barangList.find(b => b.kode_barang === item.kode_barang)?.stok_sekarang || 0) > 0 
                                    ? "text-emerald-600" 
                                    : "text-red-600"
                                )} />
                                <span className={cn(
                                  "text-[10px] font-medium",
                                  (barangList.find(b => b.kode_barang === item.kode_barang)?.stok_sekarang || 0) > 0 
                                    ? "text-slate-600" 
                                    : "text-red-700"
                                )}>
                                  Stok Tersedia: <span className="font-bold">
                                    {barangList.find(b => b.kode_barang === item.kode_barang)?.stok_sekarang || 0}
                                  </span> {item.satuan}
                                  {(barangList.find(b => b.kode_barang === item.kode_barang)?.stok_sekarang || 0) <= 0 && " (STOK KOSONG)"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 text-sm font-medium uppercase text-slate-600">{item.satuan || '-'}</TableCell>
                      <TableCell className="px-4 text-center">
                        <Input 
                          type="number" 
                          value={item.qty}
                          disabled={(barangList.find(b => b.kode_barang === item.kode_barang)?.stok_sekarang || 0) <= 0}
                          max={barangList.find(b => b.kode_barang === item.kode_barang)?.stok_sekarang || 0}
                          min={0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const max = barangList.find(b => b.kode_barang === item.kode_barang)?.stok_sekarang || 0;
                            if (val > max) {
                              toast.warning(`Jumlah melebihi stok yang ada (${max})`);
                              updateItem(idx, 'qty', max);
                            } else {
                              updateItem(idx, 'qty', val);
                            }
                          }}
                          className={cn(
                            "h-8 w-20 mx-auto border-none text-center font-bold bg-transparent focus:bg-white focus:ring-1 focus:ring-sky-600/20",
                            (barangList.find(b => b.kode_barang === item.kode_barang)?.stok_sekarang || 0) > 0 
                              ? "text-sky-700" 
                              : "text-red-400 cursor-not-allowed"
                          )}
                        />
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItemRow(idx)}
                          className="text-red-400 hover:text-red-600 h-8 w-8"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
             {isEditing && (
               <Button onClick={handleCancelEdit} variant="outline" className="flex-1 sm:flex-none px-6 md:px-8 h-10 border-red-200 text-red-600 text-[10px] sm:text-xs font-bold uppercase hover:bg-red-50">
                  Batal Edit
               </Button>
             )}
             <Button onClick={handleSave} disabled={loading} className="flex-1 sm:flex-none px-6 md:px-8 h-10 bg-sky-600 text-white text-[10px] sm:text-xs font-bold uppercase hover:bg-sky-700 shadow-lg shadow-sky-200/50">
                <CheckCircle2 size={16} className="mr-2" />
                {isEditing ? 'Simpan Perubahan' : 'Konfirmasi & Simpan'}
             </Button>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-[2rem]">
             <DataTable
                data={recentTrx}
                columns={historyColumns}
                loading={loading}
                searchPlaceholder="Cari berdasarkan Unit atau ID Transaksi..."
                emptyMessage="Belum ada riwayat distribusi barang yang ditemukan."
                className="border-none"
             />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden rounded-2xl border-none shadow-2xl flex flex-col max-h-[90vh]">
          {selectedTrx && (
            <>
              <div className="bg-sky-600 p-6 text-white shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <DialogTitle className="text-xl font-bold tracking-tight">Rincian Barang Keluar</DialogTitle>
                    <p className="text-sky-100 text-[10px] mt-1 font-mono tracking-widest">
                      {selectedTrx.id_transaksi} ({(() => {
                        try {
                          return format(new Date(selectedTrx.tanggal), 'dd MMMM yyyy', { locale: id });
                        } catch (e) {
                          return selectedTrx.tanggal;
                        }
                      })()})
                    </p>
                  </div>
                  <Home className="text-white/20" size={48} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-b flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                 <div>Tujuan: <span className="text-slate-900 ml-1">{selectedTrx.unit_nama}</span></div>
                 <div>User Input: <span className="text-slate-900 ml-1 font-mono">{selectedTrx.user_input}</span></div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-[300px]">
                <Table>
                  <TableHeader className="bg-white sticky top-0 z-10 border-b">
                    <TableRow className="text-[10px] uppercase text-slate-400 font-bold">
                      <TableHead className="w-16 px-6">No</TableHead>
                      <TableHead>Item Barang</TableHead>
                      <TableHead className="text-center">Satuan</TableHead>
                      <TableHead className="text-center px-6">Jumlah Keluar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-64 text-center">
                           <Loader2 className="animate-spin inline-block text-sky-600" />
                        </TableCell>
                      </TableRow>
                    ) : trxDetail.map((item, idx) => (
                      <TableRow key={`detail-keluar-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="px-6 font-mono text-[10px] text-slate-400">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                        <TableCell className="py-4">
                          <p className="font-bold text-slate-900 leading-tight mb-0.5">{item.nama_barang}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{item.kode_barang}</p>
                        </TableCell>
                        <TableCell className="text-center">
                           <Badge variant="outline" className="text-[10px] font-bold text-slate-500 uppercase">{item.satuan}</Badge>
                        </TableCell>
                        <TableCell className="text-center px-6 font-bold text-sky-700 text-lg">
                           {item.qty}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="p-4 bg-slate-50 border-t shrink-0">
                 <Button onClick={() => setIsDetailOpen(false)} className="bg-sky-600 hover:bg-sky-700 px-8 text-xs font-bold uppercase tracking-widest">
                    TUTUP
                 </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
