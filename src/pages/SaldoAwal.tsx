import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  Plus, 
  Trash2, 
  Save, 
  Package, 
  History,
  Info,
  Tag,
  Box,
  MapPin,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gasService } from '../services/gasService';
import { MasterBarang } from '../types';
import { useMasterData } from '../context/MasterDataContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { SearchBarang } from '@/components/SearchBarang';

interface SaldoItem {
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  qty: number;
}

export default function SaldoAwal() {
  const { barangList, loading: masterLoading } = useMasterData();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SaldoItem[]>([
    { kode_barang: '', nama_barang: '', satuan: '', qty: 0 }
  ]);
  const [tanggal, setTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [keterangan, setKeterangan] = useState('SALDO AWAL PERSEDIAAN TAHUN ' + new Date().getFullYear());

  useEffect(() => {
    // Master data managed by context
  }, []);

  const fetchBarang = async () => {
    // Using context now
  };

  const addItemRow = () => {
    setItems([...items, { kode_barang: '', nama_barang: '', satuan: '', qty: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof SaldoItem, value: any) => {
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

  const handleSave = async () => {
    if (items.some(i => !i.kode_barang || i.qty < 0)) {
       toast.error("Daftar barang saldo awal belum valid.");
       return;
    }

    const toastId = toast.loading("Menyimpan saldo awal...");
    setLoading(true);

    try {
      const payload = {
        tanggal: tanggal,
        keterangan: keterangan,
        items: items.filter(i => i.qty > 0 || i.kode_barang !== ''), // Hanya simpan yang berisi
        user_input: auth.currentUser?.email || 'Anonymous'
      };

      if (payload.items.length === 0) {
        toast.error("Tidak ada item untuk disimpan", { id: toastId });
        setLoading(false);
        return;
      }

      await gasService.saveSaldoAwal(payload);
      toast.success("Saldo awal berhasil dicatat!", { id: toastId });
      
      // Reset form
      setItems([{ kode_barang: '', nama_barang: '', satuan: '', qty: 0 }]);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan saldo awal", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-6 pb-20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-1">
            <History size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Saldo Awal Persediaan</h2>
            <p className="text-slate-500 italic text-xs">Pencatatan stok awal barang untuk audit log & history</p>
          </div>
        </div>
      </div>

      <Card className={cn(
        "border-none shadow-sm overflow-hidden bg-white relative transition-opacity duration-300",
        loading && "opacity-50 pointer-events-none"
      )}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/10 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        )}
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Tanggal Saldo Awal</label>
              <Input 
                type="date" 
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Keterangan / Referensi</label>
              <Input 
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Stok Opname Awal Tahun 2024"
                className="bg-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="w-16 px-6 py-4 text-[10px] font-bold uppercase text-slate-400">No</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Item Barang</TableHead>
                <TableHead className="w-32 px-6 py-4 text-center text-[10px] font-bold uppercase text-slate-400">Satuan</TableHead>
                <TableHead className="w-40 px-6 py-4 text-center text-[10px] font-bold uppercase text-slate-400">Jumlah Stok</TableHead>
                <TableHead className="w-16 px-6 py-4 text-center text-[10px] font-bold uppercase text-slate-400">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={`row-${idx}`} className="group hover:bg-slate-50 transition-colors">
                  <TableCell className="px-6 py-4 font-mono text-xs text-slate-400">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                  <TableCell className="px-6 py-4">
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
                             satuan: selected.satuan
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
                  <TableCell className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">{item.satuan || '-'}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Input 
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                      className="h-9 text-center font-bold text-sky-700 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length === 1}
                      className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="p-6 flex justify-between items-center bg-slate-50/50">
            <Button 
              variant="outline" 
              onClick={addItemRow} 
              className="border-dashed border-2 border-slate-300 hover:border-sky-500 hover:text-sky-600 hover:bg-sky-50 transition-all font-bold text-xs uppercase"
            >
              <Plus size={16} className="mr-2" />
              Tambah Baris Barang
            </Button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Kontrol Qty</p>
                <p className="text-xl font-bold font-mono text-slate-900">{items.reduce((sum, i) => sum + i.qty, 0)} Pcs</p>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-[#111827] text-white px-8 h-12 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 font-bold text-xs uppercase tracking-wider"
              >
                <Save size={18} className="mr-2" />
                Simpan Saldo Awal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-4 items-start">
        <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
          <Info size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900 tracking-tight">Catatan Penting</h4>
          <p className="text-xs text-amber-700 leading-relaxed mt-1">
            Pengisian saldo awal akan **menambah** stok saat ini di Master Barang dan dicatat dalam riwayat mutasi dengan jenis **SALDO AWAL**. 
            Pastikan data yang Anda masukkan adalah akumulasi stok sisa per hari ini atau per awal tahun audit.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
