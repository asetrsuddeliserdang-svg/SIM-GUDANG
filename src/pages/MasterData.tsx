import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button, buttonVariants } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Package, Truck, Ruler, Plus, Search, Layers, Edit, Trash2, X, Save, Settings, RefreshCw, Loader2, Home, AlertCircle, Trash, MoreVertical } from 'lucide-react';
import { gasService } from '../services/gasService';
import { MasterBarang, Supplier, Satuan, Unit } from '@/types';
import { useMasterData } from '../context/MasterDataContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, Column, StockIndicator } from '../components/DataTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export default function MasterData() {
  const { barangList: barang, supplierList: suppliers, satuanList: satuans, unitList: units, loading: masterLoading, error, refreshData } = useMasterData();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // CRUD State
  const [activeTab, setActiveTab] = useState('barang');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isSatuanDialogOpen, setIsSatuanDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<MasterBarang | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingSatuan, setEditingSatuan] = useState<Satuan | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  
  const [formData, setFormData] = useState<Partial<MasterBarang>>({
    kode_barang: '',
    nama_barang: '',
    kategori: 'BMHP',
    sub_kategori: '',
    satuan: '',
    stok_minimum: 0,
    monitor_stok: 'Ya',
    prioritas_alert: 'Normal',
    kirim_email_alert: 'Tidak',
    merk: '',
    lokasi_rak: '',
    status: 'AKTIF',
    stok_sekarang: 0
  });

  const [supplierFormData, setSupplierFormData] = useState<Partial<Supplier>>({
    id_supplier: '',
    nama_supplier: '',
    kontak: '',
    alamat: '',
    status: 'AKTIF'
  });

  const [satuanFormData, setSatuanFormData] = useState<Partial<Satuan>>({
    kode: '',
    nama_satuan: '',
    alias_input: '',
    keterangan: '',
    status: 'AKTIF'
  });

  const [unitFormData, setUnitFormData] = useState<Partial<Unit>>({
    id_unit: '',
    nama_unit: '',
    bidang: '',
    status: 'AKTIF'
  });

  useEffect(() => {
    // Initial fetch handled by context
  }, []);

  const generateNextId = (prefix: string, list: any[], key: string, padding: number = 3) => {
    if (!list || list.length === 0) return `${prefix}${'1'.padStart(padding, '0')}`;
    
    const ids = list.map(item => {
      const val = item[key];
      if (typeof val === 'string' && val.startsWith(prefix)) {
        const numPart = val.substring(prefix.length);
        const num = parseInt(numPart, 10);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    });
    
    const maxId = Math.max(...ids, 0);
    return `${prefix}${(maxId + 1).toString().padStart(padding, '0')}`;
  };

  const handleCreate = () => {
    if (activeTab === 'barang') {
      setEditingItem(null);
      setFormData({
        kode_barang: generateNextId('BRG-', barang, 'kode_barang', 4),
        nama_barang: '',
        kategori: 'BMHP',
        sub_kategori: '',
        satuan: satuans[0]?.nama_satuan || 'Pcs',
        stok_minimum: 5,
        monitor_stok: 'Ya',
        prioritas_alert: 'Normal',
        kirim_email_alert: 'Tidak',
        merk: '',
        lokasi_rak: '',
        status: 'AKTIF',
        stok_sekarang: 0
      });
      setIsDialogOpen(true);
    } else if (activeTab === 'supplier') {
      setSupplierFormData({
        id_supplier: generateNextId('SUP-', suppliers, 'id_supplier', 3),
        nama_supplier: '',
        kontak: '',
        alamat: '',
        status: 'AKTIF'
      });
      setIsSupplierDialogOpen(true);
    } else if (activeTab === 'satuan') {
      setSatuanFormData({
        kode: generateNextId('SAT-', satuans, 'kode', 3),
        nama_satuan: '',
        alias_input: '',
        keterangan: '',
        status: 'AKTIF'
      });
      setIsSatuanDialogOpen(true);
    } else if (activeTab === 'unit') {
      setUnitFormData({
        id_unit: generateNextId('UNIT-', units, 'id_unit', 3),
        nama_unit: '',
        bidang: '',
        status: 'AKTIF'
      });
      setIsUnitDialogOpen(true);
    }
  };

  const handleEdit = (item: MasterBarang) => {
    setEditingItem(item);
    setFormData({
      ...item,
      kategori: item.kategori || 'BMHP',
      satuan: item.satuan || '',
      monitor_stok: item.monitor_stok || 'Tidak',
      prioritas_alert: item.prioritas_alert || 'Normal',
      kirim_email_alert: item.kirim_email_alert || 'Tidak',
      status: item.status || 'AKTIF',
    });
    setIsDialogOpen(true);
  };

  const handleEditSupplier = (item: Supplier) => {
    setEditingSupplier(item);
    setSupplierFormData({
      ...item,
      status: item.status || 'AKTIF'
    });
    setIsSupplierDialogOpen(true);
  };

  const handleEditSatuan = (item: Satuan) => {
    setEditingSatuan(item);
    setSatuanFormData({
      ...item,
      status: item.status || 'AKTIF'
    });
    setIsSatuanDialogOpen(true);
  };

  const handleEditUnit = (item: Unit) => {
    setEditingUnit(item);
    setUnitFormData({
      ...item,
      status: item.status || 'AKTIF',
      bidang: item.bidang || ''
    });
    setIsUnitDialogOpen(true);
  };

  const handleDelete = async (kode: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) return;
    
    const toastId = toast.loading("Menghapus data...");
    try {
      await gasService.deleteBarang(kode);
      toast.success("Barang berhasil dihapus", { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus barang", { id: toastId });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Menyimpan data...");
    
    try {
      if (editingItem) {
        await gasService.updateBarang(formData);
        toast.success("Barang berhasil diupdate", { id: toastId });
      } else {
        await gasService.saveBarang(formData);
        toast.success("Barang berhasil ditambah", { id: toastId });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Menyimpan data supplier...");
    try {
      if (editingSupplier) {
        await gasService.updateSupplier(supplierFormData);
        toast.success("Supplier berhasil diupdate", { id: toastId });
      } else {
        await gasService.saveSupplier(supplierFormData);
        toast.success("Supplier berhasil ditambah", { id: toastId });
      }
      setEditingSupplier(null);
      setIsSupplierDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan supplier", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Hapus supplier ini?')) return;
    const toastId = toast.loading("Menghapus data...");
    try {
      await gasService.deleteSupplier(id);
      toast.success("Supplier berhasil dihapus", { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus supplier", { id: toastId });
    }
  };

  const handleSaveSatuan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Menyimpan data satuan...");
    try {
      if (editingSatuan) {
        await gasService.updateSatuan(satuanFormData);
        toast.success("Satuan berhasil diupdate", { id: toastId });
      } else {
        await gasService.saveSatuan(satuanFormData);
        toast.success("Satuan berhasil ditambah", { id: toastId });
      }
      setEditingSatuan(null);
      setIsSatuanDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan satuan", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSatuan = async (kode: string) => {
    if (!confirm('Hapus satuan ini?')) return;
    const toastId = toast.loading("Menghapus data...");
    try {
      await gasService.deleteSatuan(kode);
      toast.success("Satuan berhasil dihapus", { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus satuan", { id: toastId });
    }
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Menyimpan data unit...");
    try {
      if (editingUnit) {
        await gasService.updateUnit(unitFormData);
        toast.success("Unit berhasil diupdate", { id: toastId });
      } else {
        await gasService.saveUnit(unitFormData);
        toast.success("Unit berhasil ditambah", { id: toastId });
      }
      setEditingUnit(null);
      setIsUnitDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan unit", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Hapus unit ini?')) return;
    const toastId = toast.loading("Menghapus data...");
    try {
      await gasService.deleteUnit(id);
      toast.success("Unit berhasil dihapus", { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus unit", { id: toastId });
    }
  };

  const barangColumns: Column<MasterBarang>[] = [
    { 
      header: 'Kode', 
      accessorKey: 'kode_barang', 
      sticky: 'left',
      sortable: true,
      width: '120px',
      cell: (item) => <span className="font-black text-sky-700 font-mono tracking-tighter">{item.kode_barang}</span>
    },
    { 
      header: 'Nama Barang', 
      accessorKey: 'nama_barang', 
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 text-sm leading-tight">{item.nama_barang}</span>
            {item.last_stock_update && (
              <span className="text-[9px] text-slate-300 font-medium whitespace-nowrap">Updated: {new Date(item.last_stock_update).toLocaleDateString('id-ID')}</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{item.merk || '-'}</span>
        </div>
      )
    },
    { 
      header: 'Kategori', 
      accessorKey: 'kategori', 
      sortable: true,
      cell: (item) => <Badge variant="outline" className="bg-slate-50 text-[10px] font-black tracking-tight border-slate-200 text-slate-500 uppercase">{item.kategori}</Badge>
    },
    { 
      header: 'Status Stok', 
      accessorKey: 'stok_sekarang', 
      sortable: true,
      cell: (item) => <StockIndicator current={Number(item.stok_sekarang)} min={Number(item.stok_minimum)} />
    },
    { 
      header: 'Satuan', 
      accessorKey: 'satuan', 
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded inline-block w-fit">{item.satuan}</span>
          {item.monitor_stok === 'Ya' && (
            <div className="flex items-center gap-1 mt-1">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[8px] font-black px-1 py-0 border-none uppercase",
                  item.prioritas_alert === 'Kritis' ? "bg-red-100 text-red-600" : 
                  item.prioritas_alert === 'Penting' ? "bg-orange-100 text-orange-600" :
                  "bg-sky-100 text-sky-600"
                )}
              >
                {item.prioritas_alert} Alert
              </Badge>
              {item.kirim_email_alert === 'Ya' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Email Alert Active" />}
            </div>
          )}
        </div>
      )
    },
    { 
      header: 'Status', 
      accessorKey: 'status', 
      sortable: true,
      cell: (item) => (
        <Badge className={cn(
          "rounded-md text-[10px] px-2 py-0.5 font-black uppercase tracking-widest",
          item.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        )}>
          {item.status}
        </Badge>
      )
    },
    {
      header: 'Aksi',
      sticky: 'right',
      width: '100px',
      className: "text-right",
      cell: (item) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger 
              onClick={(e) => e.stopPropagation()}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 w-8 p-0 text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all")}
            >
              <MoreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 rounded-xl border-slate-100 p-1 bg-white">
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-sky-50 hover:text-sky-600 cursor-pointer"
              >
                <Edit size={14} className="mr-2" />
                Ubah
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleDelete(item.kode_barang); }}
                className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 cursor-pointer"
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

  const supplierColumns: Column<Supplier>[] = [
    { 
      header: 'ID', 
      accessorKey: 'id_supplier', 
      sticky: 'left',
      sortable: true,
      width: '100px',
      cell: (item) => <span className="font-black text-sky-700 font-mono tracking-tighter">{item.id_supplier}</span>
    },
    { 
      header: 'Nama Supplier', 
      accessorKey: 'nama_supplier', 
      sortable: true,
      cell: (item) => <span className="font-black text-slate-900">{item.nama_supplier}</span>
    },
    { 
      header: 'Kontak', 
      accessorKey: 'kontak', 
      sortable: true,
      cell: (item) => <span className="text-[11px] font-medium text-slate-500">{item.kontak}</span>
    },
    { 
      header: 'Alamat', 
      accessorKey: 'alamat', 
      cell: (item) => <span className="text-[11px] text-slate-400 max-w-[200px] truncate block">{item.alamat}</span>
    },
    { 
      header: 'Status', 
      accessorKey: 'status', 
      sortable: true,
      cell: (item) => (
        <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100 uppercase">{item.status}</Badge>
      )
    },
    {
      header: 'Aksi',
      sticky: 'right',
      width: '100px',
      className: "text-right",
      cell: (item) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger 
              onClick={(e) => e.stopPropagation()}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 w-8 p-0 text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all")}
            >
              <MoreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 rounded-xl border-slate-100 p-1 bg-white">
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleEditSupplier(item); }}
                className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-sky-50 hover:text-sky-600 cursor-pointer"
              >
                <Edit size={14} className="mr-2" />
                Ubah
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleDeleteSupplier(item.id_supplier); }}
                className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 cursor-pointer"
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

  const satuanColumns: Column<Satuan>[] = [
    { 
      header: 'Kode', 
      accessorKey: 'kode', 
      sticky: 'left',
      sortable: true,
      width: '100px',
      cell: (item) => <span className="font-black text-sky-700 font-mono tracking-tighter">{item.kode}</span>
    },
    { 
      header: 'Nama Satuan', 
      accessorKey: 'nama_satuan', 
      sortable: true,
      cell: (item) => <span className="font-black text-slate-900 uppercase">{item.nama_satuan}</span>
    },
    { 
      header: 'Alias', 
      accessorKey: 'alias_input', 
      sortable: true,
      cell: (item) => <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded">{item.alias_input}</span>
    },
    { 
      header: 'Status', 
      accessorKey: 'status', 
      sortable: true,
      cell: (item) => <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100 uppercase">{item.status}</Badge>
    },
    {
      header: 'Aksi',
      sticky: 'right',
      width: '100px',
      className: "text-right",
      cell: (item) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger 
              onClick={(e) => e.stopPropagation()}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 w-8 p-0 text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all")}
            >
              <MoreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 rounded-xl border-slate-100 p-1 bg-white">
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleEditSatuan(item); }}
                className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-sky-50 hover:text-sky-600 cursor-pointer"
              >
                <Edit size={14} className="mr-2" />
                Ubah
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleDeleteSatuan(item.kode); }}
                className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 cursor-pointer"
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

  const unitColumns: Column<Unit>[] = [
    { 
      header: 'ID', 
      accessorKey: 'id_unit', 
      sticky: 'left',
      sortable: true,
      width: '100px',
      cell: (item) => <span className="font-black text-sky-700 font-mono tracking-tighter">{item.id_unit}</span>
    },
    { 
      header: 'Nama Unit', 
      accessorKey: 'nama_unit', 
      sortable: true,
      cell: (item) => <span className="font-black text-slate-900">{item.nama_unit}</span>
    },
    { 
      header: 'Bidang', 
      accessorKey: 'bidang', 
      sortable: true,
      cell: (item) => <Badge variant="outline" className="bg-slate-50 text-[10px] font-black tracking-tight border-slate-200 text-slate-500 uppercase">{item.bidang}</Badge>
    },
    { 
      header: 'Status', 
      accessorKey: 'status', 
      sortable: true,
      cell: (item) => <Badge className={cn(
        "rounded-md text-[10px] px-2 py-0.5 font-black uppercase tracking-widest",
        item.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
      )}>{item.status}</Badge>
    },
    {
      header: 'Aksi',
      sticky: 'right',
      width: '100px',
      className: "text-right",
      cell: (item) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger 
              onClick={(e) => e.stopPropagation()}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 w-8 p-0 text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all")}
            >
              <MoreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 rounded-xl border-slate-100 p-1 bg-white">
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleEditUnit(item); }}
                className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-sky-50 hover:text-sky-600 cursor-pointer"
              >
                <Edit size={14} className="mr-2" />
                Ubah
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleDeleteUnit(item.id_unit); }}
                className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 cursor-pointer"
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

  const fetchData = async () => {
    setLoading(true);
    await refreshData();
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-20"
    >
      {/* Error Alert */}
      {(errorMsg || error) && (
        <Card className="border-red-200 bg-red-50 shadow-sm overflow-hidden mb-2">
          <div className="bg-red-500 h-1 w-full"></div>
          <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle size={20} className="shrink-0" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-tight">Koneksi Backend Gagal</p>
                <p className="text-[10px] font-medium leading-relaxed max-w-2xl whitespace-pre-line">{errorMsg || error}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
               <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  try {
                    toast.loading('Inisialisasi database...', { id: 'seed-master' });
                    await gasService.seedDatabase();
                    toast.success('Berhasil!', { id: 'seed-master' });
                    refreshData();
                  } catch (e: any) {
                    toast.error(e.message, { id: 'seed-master' });
                  }
                }}
                className="bg-white border-red-200 text-red-700 text-[9px] font-black uppercase h-9 px-4 rounded-xl shadow-sm"
               >
                 Seed Database
               </Button>
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refreshData()}
                className="text-red-700 hover:bg-red-100 text-[9px] font-black uppercase h-9 px-4 rounded-xl"
               >
                 Refresh
               </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 transform -rotate-1 shrink-0">
            <Package size={24} className="md:w-[26px] md:h-[26px]" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none">Master Data</h2>
            <p className="text-slate-500 italic text-[10px] md:text-xs font-medium mt-1">Pengelolaan data dasar persediaan gudang RSUD</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={fetchData} size="sm" className="bg-white border-slate-200 gap-2 h-10 shadow-sm rounded-xl flex-1 sm:flex-none">
              <RefreshCw size={14} className={cn(loading && "animate-spin")} />
              <span className="text-[10px] font-black uppercase tracking-widest">Sync Data</span>
            </Button>
            <Button size="sm" onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 h-10 rounded-xl px-5 transition-all active:scale-95 flex-1 sm:flex-none">
              <Plus size={16} className="mr-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">Tambah</span>
            </Button>
        </div>
      </div>

      <Tabs defaultValue="barang" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-4 -mx-1 px-1 custom-scrollbar">
          <TabsList className="bg-white border border-slate-200 p-1.5 rounded-2xl h-14 mb-0 shadow-xl shadow-slate-200/20 inline-flex items-center gap-1.5 whitespace-nowrap min-w-full md:min-w-0">
            <TabsTrigger value="barang" className="rounded-xl px-4 md:px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all h-11 font-black text-[10px] sm:text-[11px] uppercase tracking-widest">
              <Package size={16} className="mr-2 md:mr-3 shrink-0" />
              Barang
            </TabsTrigger>
            <TabsTrigger value="supplier" className="rounded-xl px-4 md:px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all h-11 font-black text-[10px] sm:text-[11px] uppercase tracking-widest">
              <Truck size={16} className="mr-2 md:mr-3 shrink-0" />
              Supplier
            </TabsTrigger>
            <TabsTrigger value="satuan" className="rounded-xl px-4 md:px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all h-11 font-black text-[10px] sm:text-[11px] uppercase tracking-widest">
              <Ruler size={16} className="mr-2 md:mr-3 shrink-0" />
              Satuan
            </TabsTrigger>
            <TabsTrigger value="unit" className="rounded-xl px-4 md:px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all h-11 font-black text-[10px] sm:text-[11px] uppercase tracking-widest">
              <Home size={16} className="mr-2 md:mr-3 shrink-0" />
              Unit / Ruangan
            </TabsTrigger>
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="barang" className="mt-0 outline-none">
              <DataTable 
                data={barang} 
                columns={barangColumns} 
                searchPlaceholder="Cari berdasarkan kode atau nama barang..."
                onRowClick={handleEdit}
                loading={masterLoading || loading}
              />
            </TabsContent>

            <TabsContent value="supplier" className="mt-0 outline-none">
              <DataTable 
                data={suppliers} 
                columns={supplierColumns} 
                searchPlaceholder="Cari supplier..."
                onRowClick={handleEditSupplier}
                loading={masterLoading || loading}
              />
            </TabsContent>

            <TabsContent value="satuan" className="mt-0 outline-none">
              <DataTable 
                data={satuans} 
                columns={satuanColumns} 
                searchPlaceholder="Cari satuan..."
                onRowClick={handleEditSatuan}
                loading={masterLoading || loading}
              />
            </TabsContent>

            <TabsContent value="unit" className="mt-0 outline-none">
              <DataTable 
                data={units} 
                columns={unitColumns} 
                searchPlaceholder="Cari unit atau bidang..."
                onRowClick={handleEditUnit}
                loading={masterLoading || loading}
              />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
      {/* ... keeping Dialogs as is but maybe styling them slightly better if needed ... */}


      {/* CRUD Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl bg-white p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <form onSubmit={handleSave}>
            <div className="bg-sky-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {editingItem ? 'Edit Master Barang' : 'Tambah Master Barang Baru'}
                </DialogTitle>
                <DialogDescription className="text-sky-100 text-xs">
                  {editingItem ? 'Perbarui informasi data barang persediaan.' : 'Input data barang persediaan baru ke dalam database.'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Kode Barang</Label>
                  <Input 
                    value={formData.kode_barang} 
                    disabled={!!editingItem} 
                    onChange={(e) => setFormData({...formData, kode_barang: e.target.value})}
                    className="bg-slate-50 border-slate-200 h-10 font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Status</Label>
                  <Select 
                    value={formData.status || "AKTIF"} 
                    onValueChange={(v) => setFormData({...formData, status: v})}
                  >
                    <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF">AKTIF</SelectItem>
                      <SelectItem value="NON-AKTIF">NON-AKTIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Nama Barang</Label>
                <Input 
                  value={formData.nama_barang} 
                  required
                  onChange={(e) => setFormData({...formData, nama_barang: e.target.value})}
                  className="bg-white border-slate-200 h-10 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Kategori</Label>
                  <Select 
                    value={formData.kategori || "BMHP"} 
                    onValueChange={(v) => setFormData({...formData, kategori: v})}
                  >
                    <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BMHP">BMHP (Barang Medis Habis Pakai)</SelectItem>
                      <SelectItem value="BHP">BHP (Barang Habis Pakai)</SelectItem>
                      <SelectItem value="ATK">ATK (Alat Tulis Kantor)</SelectItem>
                      <SelectItem value="ALAT">ALAT / ASET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Satuan</Label>
                  <Select 
                    value={formData.satuan || ""} 
                    onValueChange={(v) => setFormData({...formData, satuan: v})}
                  >
                    <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {satuans.map(s => (
                        <SelectItem key={s.kode} value={s.nama_satuan}>{s.nama_satuan.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Merk / Brand</Label>
          <Input 
            value={formData.merk} 
            onChange={(e) => setFormData({...formData, merk: e.target.value})}
            className="bg-white border-slate-200 h-10 text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Lokasi Rak / Gudang</Label>
          <Input 
            value={formData.lokasi_rak} 
            onChange={(e) => setFormData({...formData, lokasi_rak: e.target.value})}
            className="bg-white border-slate-200 h-10 text-xs"
            placeholder="Mis: Rak A-01"
          />
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100 shadow-inner">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Settings size={12} />
          Pengaturan Monitoring Stok
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Monitor Stok?</Label>
            <Select 
              value={formData.monitor_stok || "Tidak"} 
              onValueChange={(v) => setFormData({...formData, monitor_stok: v as 'Ya' | 'Tidak'})}
            >
              <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ya">YA (Aktifkan Alert)</SelectItem>
                <SelectItem value="Tidak">TIDAK (Abaikan)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Stok Minimum</Label>
            <Input 
              type="number"
              value={formData.stok_minimum} 
              onChange={(e) => setFormData({...formData, stok_minimum: Number(e.target.value)})}
              className="bg-white border-slate-200 h-10 text-xs text-red-600 font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Prioritas Alert</Label>
            <Select 
              value={formData.prioritas_alert || "Normal"} 
              onValueChange={(v) => setFormData({...formData, prioritas_alert: v as 'Normal' | 'Penting' | 'Kritis'})}
              disabled={formData.monitor_stok === 'Tidak'}
            >
              <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">NORMAL (Dashboard)</SelectItem>
                <SelectItem value="Penting">PENTING (Dashboard + Notif)</SelectItem>
                <SelectItem value="Kritis">KRITIS (Dashboard + Notif + Email)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Kirim Email Alert?</Label>
            <Select 
              value={formData.kirim_email_alert || "Tidak"} 
              onValueChange={(v) => setFormData({...formData, kirim_email_alert: v as 'Ya' | 'Tidak'})}
              disabled={formData.monitor_stok === 'Tidak'}
            >
              <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ya">YA</SelectItem>
                <SelectItem value="Tidak">TIDAK</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
            </div>

            <DialogFooter className="p-6 bg-slate-50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-10 text-xs font-bold uppercase tracking-widest text-slate-400">
                 Batal
              </Button>
              <Button type="submit" disabled={loading} className="h-10 bg-sky-600 hover:bg-sky-700 px-8 text-xs font-bold uppercase tracking-widest group">
                 <Save size={14} className="mr-2 group-hover:scale-110 transition-transform" />
                 Simpan Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <form onSubmit={handleSaveSupplier}>
            <div className="bg-sky-600 p-6 text-white text-center">
              <DialogHeader>
                <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <Truck size={24} />
                </div>
                <DialogTitle className="text-xl font-bold">
                  {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                </DialogTitle>
                <DialogDescription className="text-sky-100 text-xs">
                  {editingSupplier ? 'Perbarui informasi data supplier.' : 'Daftarkan rekanan/supplier baru untuk pengadaan barang.'}
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">ID Supplier</Label>
                  <Input value={supplierFormData.id_supplier} readOnly className="bg-slate-50 font-mono text-xs border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Status</Label>
                  <Select 
                    value={supplierFormData.status || "AKTIF"} 
                    onValueChange={(v) => setSupplierFormData({...supplierFormData, status: v as 'AKTIF' | 'NON-AKTIF'})}
                  >
                    <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF">AKTIF</SelectItem>
                      <SelectItem value="NON-AKTIF">NON-AKTIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Nama Supplier</Label>
                <Input value={supplierFormData.nama_supplier} required onChange={(e) => setSupplierFormData({...supplierFormData, nama_supplier: e.target.value})} className="h-10 text-sm font-medium border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Kontak / No. Telp</Label>
                <Input value={supplierFormData.kontak} onChange={(e) => setSupplierFormData({...supplierFormData, kontak: e.target.value})} className="h-10 text-xs border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Alamat Lengkap</Label>
                <Input value={supplierFormData.alamat} onChange={(e) => setSupplierFormData({...supplierFormData, alamat: e.target.value})} className="h-10 text-xs border-slate-200" />
              </div>
            </div>
            <DialogFooter className="p-6 bg-slate-50">
              <Button type="button" variant="ghost" onClick={() => setIsSupplierDialogOpen(false)} className="h-10 text-xs font-bold text-slate-400">BATAL</Button>
              <Button type="submit" disabled={loading} className="h-10 bg-sky-600 hover:bg-sky-700 px-8 text-xs font-bold uppercase tracking-widest group">
                <Save size={14} className="mr-2 group-hover:scale-110 transition-transform" />
                Simpan Supplier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Satuan Dialog */}
      <Dialog open={isSatuanDialogOpen} onOpenChange={setIsSatuanDialogOpen}>
        <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <form onSubmit={handleSaveSatuan}>
            <div className="bg-sky-600 p-6 text-white text-center">
              <DialogHeader>
                <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <Ruler size={24} />
                </div>
                <DialogTitle className="text-xl font-bold">
                   {editingSatuan ? 'Edit Satuan' : 'Tambah Satuan Baru'}
                </DialogTitle>
                <DialogDescription className="text-sky-100 text-xs">
                  {editingSatuan ? 'Perbarui informasi satuan barang.' : 'Entri satuan barang (Mis: Dus, Botol, Pcs).'}
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Kode Satuan</Label>
                  <Input value={satuanFormData.kode} readOnly className="bg-slate-50 font-mono text-xs border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Status</Label>
                  <Select 
                    value={satuanFormData.status || "AKTIF"} 
                    onValueChange={(v) => setSatuanFormData({...satuanFormData, status: v as 'AKTIF' | 'NON-AKTIF'})}
                  >
                    <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF">AKTIF</SelectItem>
                      <SelectItem value="NON-AKTIF">NON-AKTIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Nama Satuan</Label>
                <Input value={satuanFormData.nama_satuan} required onChange={(e) => setSatuanFormData({...satuanFormData, nama_satuan: e.target.value})} className="h-10 text-sm font-medium border-slate-200" placeholder="Mis: Botol" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Alias Input (Shortcut)</Label>
                <Input value={satuanFormData.alias_input} onChange={(e) => setSatuanFormData({...satuanFormData, alias_input: e.target.value})} className="h-10 text-xs border-slate-200 font-mono" placeholder="Mis: btl" />
              </div>
            </div>
            <DialogFooter className="p-6 bg-slate-50">
              <Button type="button" variant="ghost" onClick={() => setIsSatuanDialogOpen(false)} className="h-10 text-xs font-bold text-slate-400">BATAL</Button>
              <Button type="submit" disabled={loading} className="h-10 bg-sky-600 hover:bg-sky-700 px-8 text-xs font-bold uppercase tracking-widest group">
                <Save size={14} className="mr-2 group-hover:scale-110 transition-transform" />
                Simpan Satuan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
        <DialogContent className="max-w-md bg-white p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <form onSubmit={handleSaveUnit}>
            <div className="bg-sky-600 p-6 text-white text-center">
              <DialogHeader>
                <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <Home size={24} />
                </div>
                <DialogTitle className="text-xl font-bold">
                   {editingUnit ? 'Edit Unit / Ruangan' : 'Tambah Unit Baru'}
                </DialogTitle>
                <DialogDescription className="text-sky-100 text-xs">
                  {editingUnit ? 'Perbarui informasi unit atau ruangan.' : 'Daftarkan unit atau ruangan kerja baru.'}
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">ID Unit</Label>
                  <Input value={unitFormData.id_unit} readOnly className="bg-slate-50 font-mono text-xs border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Status</Label>
                  <Select 
                    value={unitFormData.status || "AKTIF"} 
                    onValueChange={(v) => setUnitFormData({...unitFormData, status: v as 'AKTIF' | 'NON-AKTIF'})}
                  >
                    <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF">AKTIF</SelectItem>
                      <SelectItem value="NON-AKTIF">NON-AKTIF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Nama Unit / Ruangan</Label>
                <Input value={unitFormData.nama_unit} required onChange={(e) => setUnitFormData({...unitFormData, nama_unit: e.target.value})} className="h-10 text-sm font-medium border-slate-200" placeholder="Mis: Poliklinik Anak" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Bidang / Departemen</Label>
                <Select 
                  value={unitFormData.bidang || ""} 
                  onValueChange={(v) => setUnitFormData({...unitFormData, bidang: v})}
                >
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Pilih Bidang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAGIAN KESEKRETARIATAN">KESEKRETARIATAN</SelectItem>
                    <SelectItem value="BAGIAN PERENCANAAN">PERENCANAAN</SelectItem>
                    <SelectItem value="BAGIAN KEUANGAN">KEUANGAN</SelectItem>
                    <SelectItem value="BIDANG KEPERAWATAN">KEPERAWATAN</SelectItem>
                    <SelectItem value="BIDANG PELAYANAN">PELAYANAN</SelectItem>
                    <SelectItem value="BIDANG PENUNJANG">PENUNJANG</SelectItem>
                    <SelectItem value="BAGIAN PDRM">PDRM</SelectItem>
                    <SelectItem value="BAGIAN SDM">SDM</SelectItem>
                    <SelectItem value="BAGIAN DIKLATLIT">DIKLATLIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="p-6 bg-slate-50">
              <Button type="button" variant="ghost" onClick={() => setIsUnitDialogOpen(false)} className="h-10 text-xs font-bold text-slate-400">BATAL</Button>
              <Button type="submit" disabled={loading} className="h-10 bg-sky-600 hover:bg-sky-700 px-8 text-xs font-bold uppercase tracking-widest group">
                <Save size={14} className="mr-2 group-hover:scale-110 transition-transform" />
                Simpan Unit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
