import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Building2,
  User,
  Package,
  Calendar,
  ChevronRight,
  AlertCircle,
  Truck,
  FileText,
  Send,
  Trash2,
  Plus,
  Save,
  Info,
  History,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gasService } from '../services/gasService';
import { Button, buttonVariants } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Badge } from '../components/ui/badge';
import { cn, safeCompareDates } from '../lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { MasterBarang } from '../types';
import { useNotifications } from '../context/NotificationContext';

import { DataTable, Column } from '../components/DataTable';

export default function RequestManagement() {
  const { user } = useAuth();
  const { checkNewRequests } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [historyRequests, setHistoryRequests] = useState<any[]>([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'pending' | 'history'>('pending');
  const [barangList, setBarangList] = useState<MasterBarang[]>([]);
  const [search, setSearch] = useState('');
  
  // Detail State
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [reviewedItems, setReviewedItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Add Item Dialog State
  const [searchBarang, setSearchBarang] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const itemColumns: Column<any>[] = [
    {
      header: 'Material Details',
      accessorKey: 'nama_barang',
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-sky-600 tracking-widest uppercase">{item.kode_barang}</span>
            {item.is_new && <Badge className="bg-emerald-500 text-[8px] h-4 text-white uppercase font-black border-none px-1.5">NEW ADDT</Badge>}
          </div>
          <span className="text-sm font-black text-slate-800 tracking-tight leading-tight uppercase max-w-[200px]">{item.nama_barang}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase italic">{item.satuan}</span>
        </div>
      )
    },
    {
      header: 'Requested',
      accessorKey: 'qty_diminta',
      sortable: true,
      className: 'text-right',
      cell: (item) => <span className="text-lg font-black text-slate-400 tracking-tighter">{item.qty_diminta}</span>
    },
    {
      header: 'Approved Qty',
      accessorKey: 'qty_disetujui',
      sortable: true,
      className: 'text-center',
      cell: (item) => (
        <div className="flex flex-col items-center gap-1">
          {selectedReq?.status === 'PENDING' ? (
            <Input 
              type="number"
              value={item.qty_disetujui ?? 0}
              onChange={(e) => handleUpdateItem(item.kode_barang, 'qty_disetujui', parseInt(e.target.value) || 0)}
              className={cn(
                "w-20 h-10 text-center text-lg font-black rounded-xl border-2 transition-all",
                item.qty_disetujui < item.qty_diminta ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-slate-950 border-slate-950 text-white"
              )}
            />
          ) : (
            <span className="text-lg font-black text-slate-800 tracking-tighter">{item.qty_disetujui}</span>
          )}
        </div>
      )
    },
    {
      header: 'Diff',
      className: 'text-center',
      cell: (item) => {
        const diff = (item.qty_diminta || 0) - (item.qty_disetujui || 0);
        return (
          <span className={cn(
            "text-sm font-black",
            diff > 0 ? "text-amber-600" : diff < 0 ? "text-emerald-600" : "text-slate-300"
          )}>
            {diff > 0 ? `-${diff}` : diff < 0 ? `+${Math.abs(diff)}` : '-'}
          </span>
        );
      }
    },
    {
      header: 'Stock Status',
      className: 'text-center',
      cell: (item) => {
        const currentStock = barangList.find(b => b.kode_barang === item.kode_barang)?.stok_sekarang || 0;
        const isWarning = currentStock < (item.qty_disetujui || 0);
        return (
          <div className="flex flex-col items-center">
            <span className={cn(
              "text-base font-black tracking-tighter",
              isWarning ? "text-red-500" : "text-slate-900"
            )}>{currentStock}</span>
            {isWarning ? (
              <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded-full border border-red-100">LOW STOCK</span>
            ) : (
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">Available</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Review Note',
      accessorKey: 'catatan_review',
      cell: (item) => (
        selectedReq?.status === 'PENDING' ? (
          <Input 
            placeholder="Add review note..."
            value={item.catatan_review ?? ''}
            onChange={(e) => handleUpdateItem(item.kode_barang, 'catatan_review', e.target.value)}
            className="bg-slate-50 border-slate-200 text-[10px] font-black uppercase rounded-xl h-10 w-full min-w-[150px]"
          />
        ) : (
          <span className="text-[10px] font-black text-slate-500 uppercase italic truncate max-w-[150px]">
            {item.catatan_review || '-'}
          </span>
        )
      )
    },
    {
      header: '',
      className: 'text-right pr-6',
      cell: (item) => (
        selectedReq?.status === 'PENDING' && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleRemoveItem(item.kode_barang)}
            className="text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl"
          >
            <Trash2 size={16} />
          </Button>
        )
      )
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqData, allReqData, masterData] = await Promise.all([
        gasService.getPermintaanPending(),
        gasService.getPermintaanAll(),
        gasService.getMasters()
      ]);
      const list = Array.isArray(reqData) ? reqData : [];
      setRequests(list);

      const allList = Array.isArray(allReqData) ? allReqData : [];
      // Filter for non-pending and sort by date desc
      const history = allList
        .filter((r: any) => r.status !== 'PENDING')
        .sort((a: any, b: any) => safeCompareDates(a.tanggal, b.tanggal, 'desc'));
      setHistoryRequests(history);

      setBarangList(Array.isArray(masterData.barang) ? masterData.barang : []);
      
      // Sync notifications
      checkNewRequests();
      
      // Auto-select first if available and none selected (and still on pending)
      if (list.length > 0 && !selectedReq && activeSidebarTab === 'pending') {
        handleShowDetail(list[0]);
      }
    } catch (err) {
      toast.error("Gagal memuat daftar permintaan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalRequested = reviewedItems.reduce((acc, item) => acc + (item.qty_diminta || 0), 0);
  const totalApproved = reviewedItems.reduce((acc, item) => acc + (item.qty_disetujui || 0), 0);
  const totalSku = reviewedItems.length;

  const handleShowDetail = async (req: any) => {
    setSelectedReq(req);
    setDetailsLoading(true);
    try {
      const details = await gasService.getPermintaanDetail(req.id_permintaan);
      const list = Array.isArray(details) ? details : [];
      
      // Map to review structure
      setReviewedItems(list.map((item: any) => ({
        ...item,
        qty_diminta: item.qty_diminta ?? item.qty ?? 0,
        qty_disetujui: item.qty_disetujui ?? item.qty ?? 0,
        catatan_review: item.catatan_review || ''
      })));
    } catch (err) {
      toast.error("Gagal memuat detail permintaan");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateItem = (kode: string, field: string, value: any) => {
    setReviewedItems(prev => prev.map(item => 
      item.kode_barang === kode ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (kode: string) => {
    setReviewedItems(prev => prev.filter(item => item.kode_barang !== kode));
  };

  const handleAddItem = (barang: MasterBarang) => {
    if (reviewedItems.some(i => i.kode_barang === barang.kode_barang)) {
      toast.error("Barang sudah ada di daftar");
      return;
    }
    
    setReviewedItems(prev => [
      ...prev,
      {
        kode_barang: barang.kode_barang,
        nama_barang: barang.nama_barang,
        satuan: barang.satuan,
        qty_diminta: 0,
        qty_disetujui: 1,
        catatan_review: 'Barang Tambahan',
        is_new: true
      }
    ]);
    setIsAddItemOpen(false);
    setSearchBarang('');
  };

  const handleSaveReview = async () => {
    if (!selectedReq) return;
    
    setIsProcessing(true);
    const toastId = toast.loading("Menyimpan draft review...");
    
    try {
      await gasService.saveReviewPermintaan({
        id_permintaan: selectedReq.id_permintaan,
        items: reviewedItems.map(item => ({
          kode_barang: item.kode_barang,
          nama_barang: item.nama_barang,
          satuan: item.satuan,
          qty_diminta: item.qty_diminta,
          qty_disetujui: item.qty_disetujui,
          catatan_review: item.catatan_review,
          is_new: item.is_new || false
        })),
        user_reviewer: user?.email || 'Admin'
      });
      toast.success("Review disimpan", { id: toastId });
    } catch (err) {
      toast.error("Gagal menyimpan review", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    if (reviewedItems.length === 0) {
      toast.error("Tidak ada barang untuk disetujui");
      return;
    }
    
    const confirm = window.confirm(`Finalisasi review?\n\nTotal SKU: ${totalSku}\nTotal Disetujui: ${totalApproved}\n\nSTOK GUDANG AKAN DIKURANGI BERDASARKAN JUMLAH DISETUJUI.`);
    if (!confirm) return;

    setIsProcessing(true);
    const toastId = toast.loading("Memproses persetujuan final...");
    
    try {
      await gasService.approvePermintaan({
        id_permintaan: selectedReq.id_permintaan,
        user_approver: user?.email || 'Admin',
        item_updates: reviewedItems.map(item => ({
          kode_barang: item.kode_barang,
          nama_barang: item.nama_barang,
          satuan: item.satuan,
          qty_diminta: item.qty_diminta,
          qty_disetujui: item.qty_disetujui,
          catatan_review: item.catatan_review,
          is_new: item.is_new || false
        }))
      });
      toast.success("Persetujuan Berhasil! Stok telah diperbarui berdasarkan jumlah review.", { id: toastId });
      setSelectedReq(null);
      fetchData();
    } catch (err: any) {
      let errorMsg = "Gagal menyetujui permintaan";
      try {
        if (err.message && err.message.startsWith('{')) {
          errorMsg = JSON.parse(err.message).error;
        } else {
          errorMsg = err.message || errorMsg;
        }
      } catch (e) {
        errorMsg = err.message || errorMsg;
      }
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    
    const confirm = window.confirm("Tolak permintaan ini?");
    if (!confirm) return;

    setIsProcessing(true);
    const toastId = toast.loading("Menolak permintaan...");
    
    try {
      await gasService.rejectPermintaan({ id_permintaan: selectedReq.id_permintaan });
      toast.success("Permintaan Ditolak", { id: toastId });
      setSelectedReq(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal memproses penolakan", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = requests.filter(r => 
    r.unit_nama.toLowerCase().includes(search.toLowerCase()) ||
    r.peminta.toLowerCase().includes(search.toLowerCase()) ||
    r.id_permintaan.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHistory = historyRequests.filter(r => 
    r.unit_nama.toLowerCase().includes(search.toLowerCase()) ||
    r.peminta.toLowerCase().includes(search.toLowerCase()) ||
    r.id_permintaan.toLowerCase().includes(search.toLowerCase())
  );

  const currentList = activeSidebarTab === 'pending' ? filteredRequests : filteredHistory;

  return (
    <div className="flex bg-slate-50 overflow-hidden rounded-3xl border border-slate-200 h-[calc(100vh-140px)]">
      {/* LEFT SIDEBAR: REQUEST LIST */}
      <div className="w-[350px] lg:w-[400px] flex flex-col bg-white border-r border-slate-200 shrink-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Antrian <span className="text-sky-600">Order</span>
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{requests.length} Requests Pending</p>
            </div>
            <Button variant="ghost" onClick={fetchData} className="w-9 h-9 p-0 rounded-full hover:bg-slate-100 text-slate-400">
              <RotateCcw size={16} />
            </Button>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl">
             <button 
               onClick={() => setActiveSidebarTab('pending')}
               className={cn(
                 "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
                 activeSidebarTab === 'pending' ? "bg-white text-sky-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
               )}
             >
               <Clock size={12} />
               Antrian ({requests.length})
             </button>
             <button 
               onClick={() => setActiveSidebarTab('history')}
               className={cn(
                 "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
                 activeSidebarTab === 'history' ? "bg-white text-sky-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
               )}
             >
               <History size={12} />
               Riwayat ({historyRequests.length})
             </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input 
              placeholder="Search request..." 
              value={search ?? ''}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs bg-slate-50/50 border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-white">
          {loading && currentList.length === 0 ? (
            <div className="p-8 text-center space-y-2 opacity-50">
               <div className="animate-spin flex justify-center"><ClipboardList size={24} /></div>
               <p className="text-xs font-bold uppercase">Refreshing queue...</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="p-8 text-center space-y-4 opacity-30 mt-10">
               <div className="flex justify-center"><ClipboardList size={48} /></div>
               <div>
                  <p className="text-sm font-black uppercase">No Data Found</p>
                  <p className="text-[10px] font-bold">Tidak ada data di tab ini</p>
               </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {currentList.map((req) => (
                <motion.div
                  key={req.id_permintaan}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "p-4 rounded-2xl cursor-pointer transition-all group border-2 relative select-none",
                    selectedReq?.id_permintaan === req.id_permintaan 
                      ? "bg-slate-950 border-slate-950 shadow-xl shadow-slate-200" 
                      : "bg-white border-transparent hover:bg-slate-50"
                  )}
                  onClick={() => handleShowDetail(req)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[9px] font-black tracking-[0.1em] uppercase px-2 py-0.6 rounded-md",
                        selectedReq?.id_permintaan === req.id_permintaan ? "bg-sky-500 text-white" : "bg-sky-50 text-sky-600"
                      )}>
                        {req.id_permintaan}
                      </span>
                      {activeSidebarTab === 'history' && (
                        <Badge variant="outline" className={cn(
                          "text-[8px] h-4 font-black uppercase",
                          req.status === 'APPROVED' ? "border-emerald-200 bg-emerald-50 text-emerald-600" :
                          req.status === 'REJECTED' ? "border-red-200 bg-red-50 text-red-600" :
                          "border-amber-200 bg-amber-50 text-amber-600"
                        )}>
                          {req.status}
                        </Badge>
                      )}
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-tighter",
                      selectedReq?.id_permintaan === req.id_permintaan ? "text-slate-500" : "text-slate-400"
                    )}>{req.tanggal}</span>
                  </div>
                  
                  <h3 className={cn(
                    "text-sm font-black leading-tight mb-1 truncate uppercase",
                    selectedReq?.id_permintaan === req.id_permintaan ? "text-white" : "text-slate-900"
                  )}>
                    {req.unit_nama}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <User size={10} className={selectedReq?.id_permintaan === req.id_permintaan ? "text-slate-500" : "text-slate-300"} />
                    <span className={cn(
                      "text-[10px] font-bold truncate tracking-tight",
                      selectedReq?.id_permintaan === req.id_permintaan ? "text-slate-400" : "text-slate-500"
                    )}>{req.peminta}</span>
                  </div>

                  {selectedReq?.id_permintaan === req.id_permintaan && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-400">
                      <ChevronRight size={20} />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: DETAIL VIEW */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {selectedReq ? (
          <div className="flex flex-col h-full bg-white">
            {/* Detail Header Area */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner group-hover:text-sky-600 transition-colors">
                  <Building2 size={28} />
                </div>
                <div className="space-y-1.5">
                   <div className="flex items-center gap-3">
                     <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
                       {selectedReq.unit_nama}
                     </h2>
                     <div className="px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Urgent Workflow</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest border-r pr-4 border-slate-200">
                        <User size={12} className="text-sky-500" />
                        {selectedReq.peminta}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={12} className="text-sky-500" />
                        {selectedReq.tanggal}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-black text-sky-600 uppercase tracking-widest ml-2">
                        <div className="w-2 h-2 bg-sky-500 rounded-full" />
                        PO: {selectedReq.id_permintaan}
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/20">
               {selectedReq.keterangan && (
                 <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                       <AlertCircle size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Unit Justification</p>
                      <p className="text-sm font-medium text-amber-900/70 italic leading-relaxed">"{selectedReq.keterangan}"</p>
                    </div>
                 </div>
               )}

               <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                        <Package size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.1em]">Review Approval Catalog</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Input qty disetujui & catatan review</p>
                      </div>
                    </div>
                     <div className="flex items-center gap-4">
                      {selectedReq.status === 'PENDING' && (
                        <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                          <DialogTrigger
                            className={cn(
                              buttonVariants({ variant: "outline" }),
                              "h-10 rounded-xl px-4 font-black border-sky-200 text-sky-600 hover:bg-sky-50"
                            )}
                          >
                            <Plus size={16} className="mr-2" />
                            Tambah Barang
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-[2rem] p-0 overflow-hidden">
                            <DialogHeader className="p-8 bg-slate-950 text-white">
                              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Add Material</DialogTitle>
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Pilih barang master untuk ditambahkan ke review</p>
                            </DialogHeader>
                            <div className="p-8 space-y-6">
                              <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input 
                                  placeholder="Search master catalog..."
                                  value={searchBarang ?? ''}
                                  onChange={e => setSearchBarang(e.target.value)}
                                  className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl text-base font-bold"
                                />
                              </div>
                              <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                {barangList
                                  .filter(b => 
                                    b.nama_barang.toLowerCase().includes(searchBarang.toLowerCase()) || 
                                    b.kode_barang.toLowerCase().includes(searchBarang.toLowerCase())
                                  )
                                  .slice(0, 50)
                                  .map(barang => (
                                    <div 
                                      key={barang.kode_barang}
                                      onClick={() => handleAddItem(barang)}
                                      className="p-4 rounded-2xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50 transition-all cursor-pointer group flex items-center justify-between"
                                    >
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{barang.kode_barang}</span>
                                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-sky-600">{barang.nama_barang}</span>
                                      </div>
                                      <div className="text-right">
                                        <Badge variant="outline" className="text-[10px] bg-white border-slate-200">{barang.satuan}</Badge>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">Stock: {barang.stok_sekarang}</p>
                                      </div>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <div className="text-right">
                         <p className="text-[20px] font-black text-slate-900 leading-none">{reviewedItems.length}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items Count</p>
                      </div>
                    </div>
                  </div>

                   <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                      <DataTable
                        data={reviewedItems}
                        columns={itemColumns}
                        loading={detailsLoading}
                        showSearch={false}
                        emptyMessage="No items currently being reviewed."
                        rowKey="kode_barang"
                      />
                   </div>
               </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 p-8 bg-slate-950 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                     <div className="absolute right-0 bottom-0 opacity-10 scale-125 rotate-12">
                        <Truck size={160} />
                     </div>
                     <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                        <div className="flex items-center justify-between">
                           <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-sky-400 border border-white/10">
                              <Truck size={24} />
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Inventory Transaction</p>
                              <p className="text-xs font-bold text-slate-400">Persetujuan Review Gudang</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Permintaan</p>
                              <p className="text-4xl font-black tracking-tighter">{totalRequested}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase italic">Items Requested</p>
                           </div>
                           <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Final Approval</p>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              </div>
                              <p className="text-4xl font-black tracking-tighter text-sky-400">{totalApproved}</p>
                              <p className="text-[10px] font-bold text-sky-500 uppercase italic">Stock Reduction Volume</p>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] space-y-6 shadow-sm">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                           <FileText size={24} />
                        </div>
                        <div>
                           <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Stock Policy</h4>
                           <p className="text-[10px] font-bold text-slate-400">Verifikasi sebelum pengeluaran</p>
                        </div>
                     </div>
                     <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                           <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                           Potong stok sesuai Qty Disetujui
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                           <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                           Update status permintaan otomatis
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                           <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                           Catat histori review gudang
                        </div>
                     </div>
                  </div>
               </div>
            </div>

             {/* BOTTOM STICKY ACTIONS */}
             {selectedReq.status === 'PENDING' && (
               <div className="absolute bottom-0 inset-x-0 p-8 px-10 border-t border-slate-100 bg-white/90 backdrop-blur-md grid grid-cols-3 gap-6 shrink-0 z-20">
                  <Button 
                   variant="outline" 
                   onClick={handleReject}
                   disabled={isProcessing}
                   className="h-16 rounded-[1.2rem] border-slate-200 text-slate-400 font-extrabold uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm bg-white"
                  >
                    <XCircle size={18} className="mr-3" />
                    Tolak
                  </Button>
                  <Button 
                   variant="outline" 
                   onClick={handleSaveReview}
                   disabled={isProcessing}
                   className="h-16 rounded-[1.2rem] border-slate-200 text-slate-400 font-extrabold uppercase tracking-[0.2em] hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100 transition-all shadow-sm bg-white"
                  >
                    <Save size={18} className="mr-3" />
                    Simpan Review
                  </Button>
                  <Button 
                   onClick={handleApprove}
                   disabled={isProcessing}
                   className="h-16 rounded-[1.2rem] bg-slate-950 hover:bg-black text-white font-extrabold uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-4"
                  >
                    Setujui
                    <CheckCircle2 size={20} />
                  </Button>
               </div>
             )}

             {selectedReq.status !== 'PENDING' && (
                <div className="absolute bottom-0 inset-x-0 p-8 px-10 border-t border-slate-100 bg-white/90 backdrop-blur-md flex justify-center shrink-0 z-20">
                    <div className={cn(
                      "px-10 py-4 rounded-2xl border flex items-center gap-4 shadow-sm",
                      selectedReq.status === 'APPROVED' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                      selectedReq.status === 'REJECTED' ? "bg-red-50 border-red-100 text-red-700" :
                      "bg-amber-50 border-amber-100 text-amber-700"
                    )}>
                      {selectedReq.status === 'APPROVED' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      <span className="text-sm font-black uppercase tracking-widest">Transaksi ini sudah selesai dengan status: {selectedReq.status}</span>
                    </div>
                </div>
             )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-20 space-y-12">
            <div className="relative">
              <div className="absolute inset-0 bg-sky-100 blur-[100px] rounded-full opacity-50 scale-150" />
              <div className="relative w-48 h-48 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl flex items-center justify-center text-slate-100 overflow-hidden">
                <ClipboardList size={100} className="opacity-10" />
              </div>
            </div>
            <div className="text-center space-y-3 max-w-sm">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Admin Console</h3>
              <p className="text-slate-400 font-bold text-xs leading-relaxed uppercase tracking-widest px-8">
                Pilih antrian di sebelah kiri untuk memproses persetujuan stok.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
