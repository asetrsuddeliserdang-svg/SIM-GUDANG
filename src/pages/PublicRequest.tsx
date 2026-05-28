import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Plus, 
  Minus,
  Trash2, 
  CheckCircle2, 
  Building2, 
  ClipboardList,
  User,
  ArrowRight,
  Package,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { gasService } from '../services/gasService';
import { MasterBarang, Unit } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { SearchBarang } from '../components/SearchBarang';
import { SearchSelect } from '../components/SearchSelect';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function PublicRequest() {
  const [loading, setLoading] = useState(false);
  const [masterLoading, setMasterLoading] = useState(true);
  const [barangList, setBarangList] = useState<MasterBarang[]>([]);
  const [unitList, setUnitList] = useState<Unit[]>([]);

  // Form State
  const [header, setHeader] = useState({
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    unit_id: '',
    unit_nama: '',
    peminta: '',
    keterangan: '',
  });

  const [items, setItems] = useState([
    { kode_barang: '', nama_barang: '', satuan: '', qty: 1 }
  ]);

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const data = await gasService.getMasters();
        setBarangList(Array.isArray(data.barang) ? data.barang : []);
        setUnitList(Array.isArray(data.unit) ? data.unit : []);
      } catch (err) {
        toast.error("Gagal memuat data unit & barang");
      } finally {
        setMasterLoading(false);
      }
    };
    fetchMaster();
  }, []);

  const addItem = () => {
    setItems([...items, { kode_barang: '', nama_barang: '', satuan: '', qty: 1 }]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!header.unit_id || !header.peminta) {
      return toast.error("Unit dan Nama Peminta wajib diisi!");
    }
    if (items.some(i => !i.kode_barang || i.qty <= 0)) {
      return toast.error("Semua item barang dan jumlah harus valid!");
    }

    const toastId = toast.loading("Mengirim permintaan barang...");
    setLoading(true);

    try {
      const payload = {
        id_permintaan: `REQ-${Date.now()}`,
        ...header,
        items
      };

      await gasService.savePermintaan(payload);
      toast.success("Permintaan Berhasil Dikirim!", { id: toastId });
      
      // Reset
      setHeader({
        tanggal: format(new Date(), 'yyyy-MM-dd'),
        unit_id: '',
        unit_nama: '',
        peminta: '',
        keterangan: '',
      });
      setItems([{ kode_barang: '', nama_barang: '', satuan: '', qty: 1 }]);
    } catch (err) {
      toast.error("Gagal mengirim permintaan", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="p-4 bg-sky-600 text-white rounded-[24px] shadow-2xl shadow-sky-200"
          >
            <ClipboardList size={32} strokeWidth={1.5} />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-4xl font-heading font-black text-slate-900 tracking-tight lowercase">
              FORMULIR <span className="text-sky-600">PERMINTAAN BARANG</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm">Sistem pengelolaan persediaan & distribusi unit RSUD Amri Tambunan</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-3xl">
          <div className="bg-sky-600 px-8 py-4 flex items-center justify-between">
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Digital Order Form v1.0</span>
            <div className="flex items-center gap-2 text-white">
              <Calendar size={14} />
              <span className="text-xs font-bold">{format(new Date(), 'dd MMMM yyyy')}</span>
            </div>
          </div>

          <CardContent className="p-8 space-y-8">
            {/* Section 1: Identitas */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                  <Building2 size={16} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase">Identitas Peminta</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Unit / Ruangan</label>
                  <SearchSelect 
                    options={unitList.map(u => ({
                      value: u.id_unit,
                      label: u.nama_unit,
                      subLabel: u.bidang,
                      original: u
                    }))}
                    selectedValue={header.unit_id}
                    placeholder="Pilih Unit Asal..."
                    isLoading={masterLoading}
                    onSelect={(val, orig) => setHeader({ ...header, unit_id: val, unit_nama: orig?.nama_unit || '' })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Nama Peminta (Petugas)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      placeholder="Masukkan nama lengkap..." 
                      className="pl-10 h-10 bg-slate-50 border-slate-200 focus:ring-sky-500/20"
                      value={header.peminta}
                      onChange={e => setHeader({ ...header, peminta: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Catatan / Alasan Permintaan</label>
                <Textarea 
                  placeholder="Contoh: Untuk kebutuhan stok mingguan di IGD..." 
                  className="bg-slate-50 border-slate-200 focus:ring-sky-500/20 min-h-[80px]"
                  value={header.keterangan}
                  onChange={e => setHeader({ ...header, keterangan: e.target.value })}
                />
              </div>
            </section>

            {/* Section 2: Items */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Daftar Barang</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{items.filter(i => i.kode_barang).length} Item Terpilih</p>
                  </div>
                </div>
                <Button onClick={addItem} variant="outline" size="sm" className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-sky-100 text-sky-600 hover:bg-sky-50">
                  <Plus size={14} className="mr-2" /> Tambah Baris
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col p-5 bg-white border border-slate-100 rounded-3xl relative group transition-all hover:shadow-xl hover:shadow-sky-100/50 hover:border-sky-200">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                      <div className="flex-1 w-full">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Cari Barang</label>
                        <SearchBarang 
                          barangList={barangList}
                          selectedKode={item.kode_barang}
                          onSelect={(sel) => {
                            const newItems = [...items];
                            newItems[idx] = {
                              ...newItems[idx],
                              kode_barang: sel.kode_barang,
                              nama_barang: sel.nama_barang,
                              satuan: sel.satuan
                            };
                            setItems(newItems);
                          }}
                        />
                      </div>
                      
                      <div className="w-full lg:w-48 flex flex-row items-end gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Jumlah ({item.satuan || 'Pilih Barang'})</label>
                          <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-9 w-9 rounded-xl hover:bg-white hover:text-sky-600 transition-colors shrink-0"
                              onClick={() => updateItem(idx, 'qty', Math.max(1, Number(item.qty) - 1))}
                            >
                              <Minus size={16} />
                            </Button>
                            <input 
                              type="number"
                              className="w-full bg-transparent text-center font-bold text-slate-900 border-none focus:ring-0 text-sm"
                              value={item.qty}
                              onChange={e => updateItem(idx, 'qty', e.target.value)}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-9 w-9 rounded-xl hover:bg-white hover:text-sky-600 transition-colors shrink-0"
                              onClick={() => updateItem(idx, 'qty', Number(item.qty) + 1)}
                            >
                              <Plus size={16} />
                            </Button>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          onClick={() => removeItem(idx)}
                          className={cn(
                            "h-11 w-11 p-0 rounded-2xl shrink-0 transition-colors",
                            items.length > 1 ? "text-red-400 hover:text-red-600 hover:bg-red-50" : "text-slate-200 cursor-not-allowed"
                          )}
                          disabled={items.length <= 1}
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="pt-6 border-t border-slate-100">
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-sky-200"
              >
                {loading ? "Mengirim..." : "Kirim Permintaan"}
                <Send size={18} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-slate-400 font-medium">
          Dukungan Teknis: IT Support RSUD Deli Serdang &copy; 2024
        </p>
      </div>
    </div>
  );
}
