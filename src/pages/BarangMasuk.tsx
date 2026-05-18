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
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  Info,
  MapPin,
  Box,
  Tag,
  Loader2,
  MoreVertical,
  Edit,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gasService } from '../services/gasService';
import { MasterBarang, Supplier, TrxMasukHeader, TrxMasukDetail } from '../types';
import { useMasterData } from '../context/MasterDataContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
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
  harga: number;
  total: number;
}

export default function BarangMasuk() {
  const { barangList, supplierList, loading: masterLoading } = useMasterData();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('entry');
  const [recentTrx, setRecentTrx] = useState<TrxMasukHeader[]>([]);
  const [allDetails, setAllDetails] = useState<TrxMasukDetail[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Detail State
  const [selectedTrx, setSelectedTrx] = useState<TrxMasukHeader | null>(null);
  const [trxDetail, setTrxDetail] = useState<TrxMasukDetail[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form State
  const [editingTrxId, setEditingTrxId] = useState<string | null>(null);
  const [header, setHeader] = useState({
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    no_faktur: '',
    supplier_id: '',
    supplier_nama: '',
    keterangan: '',
    file_faktur_url: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [items, setItems] = useState<FormItem[]>([
    { kode_barang: '', nama_barang: '', satuan: '', qty: 1, harga: 0, total: 0 }
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
      const trx = await gasService.getRecentTrx();
      const details = await gasService.getAllTrxDetails();
      
      // Update supplier_nama if Editing
      if (editingTrxId && header.supplier_id) {
        const sup = supplierList?.find((s: Supplier) => s.id_supplier === header.supplier_id);
        if (sup) setHeader(h => ({ ...h, supplier_nama: sup.nama_supplier }));
      }
      
      // Ensure numeric fields are actually numbers to avoid NaN
      const trxArray = Array.isArray(trx) ? trx : [];
      const sanitizedTrx = trxArray.map((t: any) => ({
        ...t,
        file_faktur_url: t.file_faktur_url || t.file_faktur || '',
        total: Number(t.total || 0)
      })).sort((a: any, b: any) => {
        const dateA = new Date(a.tanggal).getTime();
        const dateB = new Date(b.tanggal).getTime();
        return dateB - dateA;
      });
      setRecentTrx(sanitizedTrx);
      setAllDetails(Array.isArray(details) ? details : []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
      toast.error("Gagal memuat data dari Google Sheets");
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = () => {
    setItems([...items, { kode_barang: '', nama_barang: '', satuan: '', qty: 1, harga: 0, total: 0 }]);
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
    
    item.total = Number(item.qty) * Number(item.harga);
    newItems[index] = item;
    setItems(newItems);
  };

  const grandTotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const handleShowDetail = async (trx: TrxMasukHeader) => {
    setSelectedTrx(trx);
    setIsDetailOpen(true);
    setDetailLoading(true);
    try {
      const details = await gasService.getTrxDetail(trx.id_transaksi);
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
          qty: Number(getVal(d, ['qty', 'jumlah']) || 0),
          harga: Number(getVal(d, ['harga']) || 0),
          total: Number(getVal(d, ['total']) || 0)
        })));
      } else {
        setTrxDetail([]);
      }
    } catch (err) {
      toast.error("Gagal memuat detail transaksi");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEdit = async (trx: TrxMasukHeader) => {
    setLoading(true);
    try {
      const details = await gasService.getTrxDetail(trx.id_transaksi);
      
      // Map supplier name back to ID if supplier_id is missing
      const supplier = supplierList.find(s => 
        s.id_supplier === trx.supplier_id || 
        s.nama_supplier === ((trx as any).supplier || trx.supplier_nama)
      );
      
      // Format date for type="date" input
      let formattedDate = trx.tanggal;
      try {
        const dateObj = new Date(trx.tanggal);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = format(dateObj, 'yyyy-MM-dd');
        }
      } catch (e) {
        console.warn("Date parsing failed in handleEdit", e);
      }

      setEditingTrxId(trx.id_transaksi);
      setHeader({
        tanggal: formattedDate,
        no_faktur: trx.no_faktur,
        supplier_id: supplier?.id_supplier || trx.supplier_id || '',
        supplier_nama: supplier?.nama_supplier || trx.supplier_nama || '',
        keterangan: (trx as any).keterangan || trx.keterangan || '',
        file_faktur_url: (trx as any).file_faktur || (trx as any).file_faktur_url || '',
      });

      setItems(details.map((d: any) => {
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
          qty: Number(getVal(d, ['qty', 'jumlah']) || 0),
          harga: Number(getVal(d, ['harga']) || 0),
          total: Number(getVal(d, ['total']) || 0)
        };
      }));

      setActiveTab('entry');
      
      toast.info("Transaksi dimuat ke form untuk diubah");
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat detail untuk diedit");
    } finally {
      setLoading(false);
    }
  };

  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSave = async () => {
    if (!header.no_faktur || !header.supplier_id) {
      toast.error("Harap isi Nomor Faktur dan Supplier");
      return;
    }

    if (items.some(i => !i.kode_barang || i.qty <= 0)) {
       toast.error("Data barang dalam tabel tidak valid");
       return;
    }

    const toastId = toast.loading("Memulai proses simpan...");
    setLoading(true);

    try {
      let finalFileUrl = header.file_faktur_url;

      if (selectedFile) {
        toast.loading("Mengupload faktur ke Drive...", { id: toastId });
        setIsUploading(true);
        try {
          const supplierDoc = supplierList.find(s => s.id_supplier === header.supplier_id);
          const supplierName = supplierDoc?.nama_supplier || header.supplier_nama || 'SUP';
          // Get abbreviation (First letter of each word)
          const supplierShort = supplierName.split(/\s+/)
            .filter(word => word.length > 0)
            .map(word => word[0])
            .join('')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase();
          
          const tglFaktur = header.tanggal.replace(/-/g, '');
          const noFaktur = header.no_faktur.replace(/[^a-zA-Z0-9-]/g, '_');
          const fileExt = selectedFile.name.split('.').pop();
          
          const customFileName = `FAK_${supplierShort}_${tglFaktur}_${noFaktur}.${fileExt}`;

          const base64 = await fileToBase64(selectedFile);
          const uploadRes = await gasService.uploadFile({
            fileName: customFileName,
            mimeType: selectedFile.type,
            base64
          });
          
          if (uploadRes.success) {
            finalFileUrl = uploadRes.url;
            toast.success("Faktur berhasil diupload", { id: toastId });
          } else {
            console.error("Upload error:", uploadRes.error);
            toast.error("Gagal upload faktur, tetap melanjutkan simpan data...", { id: toastId });
          }
        } catch (uploadErr) {
          console.error("Upload exception:", uploadErr);
          toast.error("Gagal memproses file, tetap melanjutkan simpan data...", { id: toastId });
        } finally {
          setIsUploading(false);
        }
      }

      const supplierDoc = supplierList.find(s => s.id_supplier === header.supplier_id);
      toast.loading(editingTrxId ? "Mengupdate transaksi..." : "Menyimpan transaksi...", { id: toastId });
      
      const payload = {
        id_transaksi: editingTrxId || `BM-${Date.now()}`,
        tanggal: header.tanggal,
        no_faktur: header.no_faktur,
        supplier_id: header.supplier_id,
        supplier_nama: supplierDoc?.nama_supplier || 'Unknown',
        keterangan: header.keterangan,
        file_faktur_url: finalFileUrl,
        items: items,
        grand_total: grandTotal,
        user_input: auth.currentUser?.email || 'Anonymous'
      };

      if (editingTrxId) {
        await gasService.updateBarangMasuk(payload);
        toast.success("Transaksi Berhasil Diperbarui!", { id: toastId });
      } else {
        await gasService.saveBarangMasuk(payload);
        toast.success("Transaksi Berhasil Disimpan!", { id: toastId });
      }
      
      // Reset form
      setEditingTrxId(null);
      setSelectedFile(null);
      setHeader({
        tanggal: format(new Date(), 'yyyy-MM-dd'),
        no_faktur: '',
        supplier_id: '',
        supplier_nama: '',
        keterangan: '',
        file_faktur_url: '',
      });
      setItems([{ kode_barang: '', nama_barang: '', satuan: '', qty: 1, harga: 0, total: 0 }]);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan. Silakan coba lagi.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const historyColumns: Column<TrxMasukHeader>[] = [
    {
      header: 'ID Transaksi',
      accessorKey: 'id_transaksi',
      sortable: true,
      cell: (trx) => (
        <p className="text-[10px] text-sky-600 font-bold font-mono tracking-tighter uppercase italic">{trx.id_transaksi}</p>
      )
    },
    {
      header: 'No Faktur',
      accessorKey: 'no_faktur',
      sortable: true,
      cell: (trx) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 text-sky-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-2 shrink-0">
            <FileText size={20} />
          </div>
          <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{trx.no_faktur}</p>
        </div>
      )
    },
    {
      header: 'Supplier',
      accessorKey: 'supplier_nama',
      sortable: true,
      cell: (trx) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{(trx as any).supplier || trx.supplier_nama || '-'}</span>
          <span className="text-[10px] text-slate-400 italic">Vendor Rekanan</span>
        </div>
      )
    },
    {
      header: 'Tanggal',
      accessorKey: 'tanggal',
      sortable: true,
      cell: (trx) => (
        <span className="text-[10px] text-slate-500 font-black font-mono">
          {(() => {
            try {
              return format(new Date(trx.tanggal), 'dd MMMM yyyy', { locale: id });
            } catch (e) {
              return trx.tanggal;
            }
          })()}
        </span>
      )
    },
    {
      header: 'Total Faktur',
      accessorKey: 'grand_total',
      sortable: true,
      className: 'text-right',
      cell: (trx) => (
        <span className="font-mono font-black text-sm text-slate-900 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100 italic">
          Rp {new Intl.NumberFormat('id-ID').format((trx as any).total || trx.grand_total || 0)}
        </span>
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
                className="rounded-lg h-9 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-amber-50 hover:text-amber-600 cursor-pointer"
              >
                <Edit size={14} className="mr-2" />
                Ubah
              </DropdownMenuItem>
              {trx.file_faktur_url && (
                <DropdownMenuItem 
                  onClick={() => window.open(trx.file_faktur_url, '_blank')}
                  className="rounded-lg h-9 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-sky-50 hover:text-sky-600 cursor-pointer"
                >
                  <FileText size={14} className="mr-2" />
                  Lihat Faktur
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  const allItemsColumns: Column<TrxMasukDetail>[] = [
    {
      header: 'ID Transaksi',
      accessorKey: 'id_transaksi',
      sortable: true,
      cell: (item) => <span className="font-mono text-[10px] text-sky-600 font-black uppercase tracking-tighter italic">{item.id_transaksi}</span>
    },
    {
      header: 'Informasi Barang',
      accessorKey: 'nama_barang',
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-900 uppercase tracking-tight leading-tight">{item.nama_barang}</span>
          <span className="text-[10px] text-slate-400 font-black font-mono tracking-tighter opacity-60 uppercase">{item.kode_barang}</span>
        </div>
      )
    },
    {
      header: 'Satuan',
      accessorKey: 'satuan',
      sortable: true,
      cell: (item) => <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">{item.satuan}</span>
    },
    {
      header: 'Qty',
      accessorKey: 'qty',
      sortable: true,
      className: 'text-center',
      cell: (item) => <span className="font-black text-sm text-sky-900 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">{item.qty}</span>
    },
    {
      header: 'Harga Satuan',
      accessorKey: 'harga',
      sortable: true,
      className: 'text-right',
      cell: (item) => <span className="font-mono text-xs font-bold text-slate-600">Rp{new Intl.NumberFormat('id-ID').format(item.harga)}</span>
    },
    {
      header: 'Subtotal',
      accessorKey: 'total',
      sortable: true,
      className: 'text-right',
      cell: (item) => <span className="font-black font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded-lg">Rp{new Intl.NumberFormat('id-ID').format(item.total)}</span>
    }
  ];

  const cancelEdit = () => {
    setEditingTrxId(null);
    setSelectedFile(null);
    setHeader({
      tanggal: format(new Date(), 'yyyy-MM-dd'),
      no_faktur: '',
      supplier_id: '',
      supplier_nama: '',
      keterangan: '',
      file_faktur_url: '',
    });
    setItems([{ kode_barang: '', nama_barang: '', satuan: '', qty: 1, harga: 0, total: 0 }]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-6 pb-20"
    >
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-sky-200 bg-sky-50 shadow-sm overflow-hidden mb-6">
          <div className="bg-sky-600 h-1 w-full"></div>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-white text-sky-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-sky-100">
                <Package size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-sky-800 font-medium">
                  {errorMsg === 'VITE_GAS_WEBAPP_URL_MISSING' 
                    ? "Setup Database Google Sheets diperlukan untuk halaman ini." 
                    : errorMsg}
                </p>
              </div>
              <Button size="sm" onClick={() => window.location.reload()} className="h-8 text-[10px] bg-sky-600">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Barang Masuk</h2>
          <p className="text-slate-500 italic text-[10px] md:text-xs">Penerimaan stok dari supplier / vendor RSUD</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
          <TabsList className="bg-white border p-1 rounded-xl h-auto md:h-12 shadow-sm mb-0 flex flex-nowrap items-center gap-1 min-w-full md:min-w-0 whitespace-nowrap">
            <TabsTrigger value="entry" className="rounded-lg px-4 md:px-6 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all h-10 text-[10px] sm:text-xs font-bold uppercase flex-1 shrink-0">
              <Plus size={16} className="mr-2" />
              Input Faktur
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg px-4 md:px-6 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all h-10 text-[10px] sm:text-xs font-bold uppercase flex-1 shrink-0">
              <Clock size={16} className="mr-2" />
              Riwayat
            </TabsTrigger>
            <TabsTrigger value="all-items" className="rounded-lg px-4 md:px-6 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all h-10 text-[10px] sm:text-xs font-bold uppercase flex-1 shrink-0">
              <Package size={16} className="mr-2" />
              Semua Item
            </TabsTrigger>
          </TabsList>
        </div>

          <TabsContent value="entry" className="space-y-6 pt-4 mt-0 outline-none">
            <AnimatePresence>
              {editingTrxId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center">
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-900">Mode Edit Transaksi</p>
                        <p className="text-xs text-amber-700">Anda sedang mengubah transaksi <span className="font-mono font-bold">#{editingTrxId}</span></p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-amber-700 hover:bg-amber-100 h-8 text-[10px] font-bold uppercase">
                      Batal Edit
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <section className={cn(
              "bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end relative overflow-hidden transition-opacity duration-300",
              loading && "opacity-50 pointer-events-none"
            )}>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                </div>
              )}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Pilih Supplier</label>
              <SearchSelect 
                options={(supplierList || []).map(s => ({
                  value: s.id_supplier,
                  label: s.nama_supplier,
                  subLabel: s.alamat,
                  original: s
                }))}
                selectedValue={header.supplier_id}
                placeholder="Cari Supplier..."
                searchPlaceholder="Ketik Nama Supplier..."
                isLoading={masterLoading}
                onSelect={(value, original) => {
                  setHeader({
                    ...header, 
                    supplier_id: value,
                    supplier_nama: original?.nama_supplier || ''
                  });
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Nomor Faktur</label>
              <Input 
                placeholder="F-000..." 
                value={header.no_faktur}
                onChange={(e) => setHeader({...header, no_faktur: e.target.value})}
                className="text-sm h-10 bg-slate-50 border border-slate-200 rounded-md focus:ring-sky-600/20"
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Tgl. Penerimaan</label>
              <DatePicker 
                date={header.tanggal ? parseISO(header.tanggal) : undefined}
                setDate={(date) => setHeader({...header, tanggal: date ? format(date, 'yyyy-MM-dd') : ''})}
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 md:col-span-4">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Keterangan / Upload Berkas (Opsional)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  placeholder="Catatan tambahan..." 
                  value={header.keterangan}
                  onChange={(e) => setHeader({...header, keterangan: e.target.value})}
                  className="text-sm h-10 bg-slate-50 border border-slate-200 rounded-md"
                />
                <div className="flex gap-2 items-center">
                  <Input 
                    type="file" 
                    onChange={handleFileChange}
                    className="text-[11px] h-10 file:mr-2 md:file:mr-4 file:py-1.5 file:px-2 md:file:px-3 file:rounded-md file:border-0 file:text-[10px] md:file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer border border-dashed border-slate-300 rounded-md flex-1 px-2 pt-1.5 overflow-hidden" 
                  />
                  {header.file_faktur_url && (
                    <a 
                      href={header.file_faktur_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 px-3 border-sky-200 text-sky-600 hover:bg-sky-50 flex items-center justify-center shrink-0")}
                    >
                      <FileText size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detail Item Barang</h2>
              <Button onClick={addItemRow} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold h-8 uppercase transition-colors">
                <Plus size={14} className="mr-1.5" />
                Tambah Baris
              </Button>
            </div>
            
            <div className="table-scroll">
              <Table>
                <TableHeader className="bg-white sticky top-0 shadow-[0_1px_0_rgba(0,0,0,0.05)] text-[11px] uppercase text-slate-500 font-bold">
                  <TableRow className="border-b border-slate-100">
                    <TableHead className="w-12 px-4">No</TableHead>
                    <TableHead className="px-4">Nama Barang / Kode</TableHead>
                    <TableHead className="w-24 px-4">Satuan</TableHead>
                    <TableHead className="w-40 px-4 text-right">Harga (Rp)</TableHead>
                    <TableHead className="w-24 px-4 text-center">Qty</TableHead>
                    <TableHead className="w-40 px-4 text-right">Subtotal</TableHead>
                    <TableHead className="w-16 px-4 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={`form-row-${idx}`} className="hover:bg-slate-50 divide-x divide-slate-50">
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
                                total: Number(newItems[idx].qty) * Number(newItems[idx].harga)
                              };
                              setItems(newItems);
                            }}
                          />
                          
                          {item.kode_barang && (
                            <div className="p-2 bg-sky-50/50 rounded-lg border border-sky-100 animate-in fade-in slide-in-from-top-1 duration-300">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <Box size={12} className="text-sky-600 shrink-0" />
                                <span className="text-[10px] text-slate-600 font-medium truncate">
                                  Stok Saat Ini: <span className="font-bold text-sky-700">{barangList.find(b => b.kode_barang === item.kode_barang)?.stok_sekarang}</span> {item.satuan}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 text-sm font-medium uppercase text-slate-600">{item.satuan || '-'}</TableCell>
                      <TableCell className="px-4">
                        <Input 
                          type="number" 
                          value={item.harga}
                          onChange={(e) => updateItem(idx, 'harga', parseFloat(e.target.value) || 0)}
                          className="h-8 border-none text-right font-mono bg-transparent focus:bg-white focus:ring-1 focus:ring-sky-600/20"
                        />
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        <Input 
                          type="number" 
                          value={item.qty}
                          onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                          className="h-8 w-16 mx-auto border-none text-center font-bold text-sky-700 bg-transparent focus:bg-white focus:ring-1 focus:ring-sky-600/20"
                        />
                      </TableCell>
                      <TableCell className="px-4 text-right font-bold text-slate-900 font-mono">
                        {new Intl.NumberFormat('id-ID').format(item.total)}
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItemRow(idx)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-[#111827] text-white px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-10 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <div>Total Baris: <span className="text-white ml-1 text-sm">{items.length}</span></div>
                <div>Total Qty (Pcs): <span className="text-white ml-1 text-sm">{totalQty}</span></div>
              </div>
              <div className="text-center md:text-right">
                <span className="text-[10px] md:text-[11px] uppercase tracking-widest text-slate-400 font-bold block md:inline md:mr-4 mb-1 md:mb-0">Grand Total Faktur</span>
                <span className="text-xl md:text-2xl font-bold font-mono text-emerald-400 italic">
                  Rp {new Intl.NumberFormat('id-ID').format(grandTotal)}
                </span>
              </div>
            </div>
          </section>

          <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Sistem Siap Digunakan</span>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              {editingTrxId ? (
                <Button variant="outline" onClick={cancelEdit} className="flex-1 md:flex-none px-4 md:px-6 h-10 border-slate-200 text-slate-600 text-xs font-bold uppercase hover:bg-slate-50">
                  Batal
                </Button>
              ) : (
                <Button variant="outline" onClick={() => window.location.reload()} className="flex-1 md:flex-none px-4 md:px-6 h-10 border-slate-200 text-slate-600 text-xs font-bold uppercase hover:bg-slate-50">
                  Reset
                </Button>
              )}
              <Button onClick={handleSave} disabled={loading} className="flex-2 md:flex-none px-6 md:px-8 h-10 bg-sky-600 text-white text-xs font-bold uppercase hover:bg-sky-700 shadow-lg shadow-sky-200/50">
                 {loading ? "..." : editingTrxId ? "Update" : "Simpan Faktur"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-[2rem]">
             <DataTable
               data={recentTrx}
               columns={historyColumns}
               loading={loading}
               searchPlaceholder="Cari berdasarkan No Faktur, ID atau Supplier..."
               emptyMessage="Belum ada riwayat transaksi masuk yang ditemukan."
             />
          </Card>
        </TabsContent>

        <TabsContent value="all-items">
          <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-[2rem]">
             <DataTable
                data={allDetails}
                columns={allItemsColumns}
                loading={loading}
                searchPlaceholder="Cari item barang..."
                emptyMessage="Tidak ada item barang masuk yang tercatat."
             />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl bg-white p-0 overflow-hidden rounded-2xl border-none shadow-2xl flex flex-col max-h-[90vh]">
          {selectedTrx && (
            <>
              <div className="bg-sky-600 p-6 text-white shrink-0">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <Badge className="bg-white/20 text-white mb-2 border-none font-mono tracking-wider">FAKTUR: {selectedTrx.no_faktur}</Badge>
                    <DialogTitle className="text-2xl font-bold tracking-tight truncate">Detail Transaksi Masuk</DialogTitle>
                    <p className="text-sky-100 text-xs mt-1 truncate">ID: {selectedTrx.id_transaksi} • User: {selectedTrx.user_input}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-sky-200 mb-0.5">Tanggal Penerimaan</p>
                    <p className="text-lg font-bold">
                      {(() => {
                        try {
                          return format(new Date(selectedTrx.tanggal), 'dd MMMM yyyy', { locale: id });
                        } catch (e) {
                          return selectedTrx.tanggal;
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-100 shrink-0">
                <div className="bg-white p-5 border-r border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier / Vendor</p>
                  <p className="text-lg font-bold text-slate-900 leading-tight">{(selectedTrx as any).supplier || selectedTrx.supplier_nama}</p>
                </div>
                <div className="bg-white p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Keterangan Tambahan</p>
                  <p className="text-sm text-slate-600 italic">{(selectedTrx as any).keterangan || 'Tidak ada keterangan tambahan.'}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-0 min-h-[300px]">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10">
                    <TableRow className="border-b-2 border-slate-100">
                      <TableHead className="w-16 px-6 text-[11px] font-bold uppercase">No</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase">Item Barang</TableHead>
                      <TableHead className="w-24 text-center text-[11px] font-bold uppercase">Satuan</TableHead>
                      <TableHead className="w-36 text-right text-[11px] font-bold uppercase px-4">Harga Satuan</TableHead>
                      <TableHead className="w-20 text-center text-[11px] font-bold uppercase">Qty</TableHead>
                      <TableHead className="w-40 text-right px-6 text-[11px] font-bold uppercase">Total Harga</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center">
                           <div className="flex flex-col items-center gap-2 text-slate-400">
                             <Clock className="animate-spin" size={24} />
                             <span className="text-xs font-medium">Memuat rincian barang...</span>
                           </div>
                        </TableCell>
                      </TableRow>
                    ) : trxDetail.map((item, idx) => (
                      <TableRow key={`detail-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-6 font-mono text-[10px] text-slate-400">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                        <TableCell className="py-4">
                          <p className="font-bold text-slate-900 leading-tight mb-0.5">{item.nama_barang}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{item.kode_barang}</p>
                        </TableCell>
                        <TableCell className="text-center">
                           <Badge variant="outline" className="text-[10px] font-bold text-slate-600 uppercase border-slate-200">{item.satuan}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600 px-4">
                           {new Intl.NumberFormat('id-ID').format(item.harga)}
                        </TableCell>
                        <TableCell className="text-center">
                           <span className="font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-md text-sm">{item.qty}</span>
                        </TableCell>
                        <TableCell className="text-right px-6 font-bold font-mono text-slate-900">
                           {new Intl.NumberFormat('id-ID').format(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="px-8 py-6 bg-[#0f172a] text-white shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <FileText className="text-sky-400" size={24} />
                   </div>
                   <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">ID Transaksi Digital</p>
                     <p className="font-mono text-sm text-sky-300 font-bold tracking-tight">{selectedTrx.id_transaksi}</p>
                   </div>
                </div>
                <div className="flex items-center gap-6">
                  {selectedTrx.file_faktur_url && (
                    <a 
                      href={selectedTrx.file_faktur_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white/5 border-white/10 text-white hover:bg-white/10 h-10 px-6 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center")}
                    >
                      <Upload size={14} className="mr-2" />
                      Lihat Faktur
                    </a>
                  )}
                  <div className="flex flex-col items-center md:items-end">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Pembayaran Faktur</p>
                    <p className="text-3xl font-black font-mono text-emerald-400 tracking-tight leading-none italic">
                      <span className="text-sm mr-1.5 not-italic opacity-70">Rp</span>
                      {new Intl.NumberFormat('id-ID').format((selectedTrx as any).total || selectedTrx.grand_total || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
