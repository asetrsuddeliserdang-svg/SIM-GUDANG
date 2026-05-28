import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { 
  FileText, 
  Search, 
  Printer, 
  Download, 
  Package, 
  MapPin, 
  Box,
  ArrowDownRight,
  History,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gasService } from '../services/gasService';
import { MasterBarang, MutasiStok } from '../types';
import { useMasterData } from '../context/MasterDataContext';
import { SearchBarang } from '../components/SearchBarang';
import { format } from 'date-fns';
import { Button } from '../components/ui/button';
import { cn, safeFormat } from '../lib/utils';
import { toast } from 'sonner';
import { DataTable, Column } from '../components/DataTable';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function StockCard() {
  const { barangList, loading: masterLoading } = useMasterData();
  const [selectedBarang, setSelectedBarang] = useState<MasterBarang | null>(null);
  const [mutations, setMutations] = useState<MutasiStok[]>([]);
  const [headersMasuk, setHeadersMasuk] = useState<Record<string, string>>({});
  const [headersKeluar, setHeadersKeluar] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleExportPDF = () => {
    if (!selectedBarang) return;

    const doc = new jsPDF() as any;
    
    // Add title
    doc.setFontSize(18);
    doc.text('KARTU STOK BARANG', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`RSUD DELI SERDANG - UNIT LOGISTIK`, 14, 30);
    
    // Add header info
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Nama Barang: ${selectedBarang.nama_barang}`, 14, 40);
    doc.text(`Kode Barang: ${selectedBarang.kode_barang}`, 14, 45);
    doc.text(`Kategori: ${selectedBarang.kategori}`, 14, 50);
    doc.text(`Satuan: ${selectedBarang.satuan}`, 14, 55);
    doc.text(`Stok Sekarang: ${selectedBarang.stok_sekarang}`, 14, 60);
    doc.text(`Tanggal Cetak: ${safeFormat(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 65);

    const tableRows = mutations.map(m => {
      let keterangan = '-';
      if (m.jenis.includes('MASUK')) {
        keterangan = headersMasuk[m.referensi] || '-';
      } else if (m.jenis.includes('KELUAR')) {
        keterangan = headersKeluar[m.referensi] || '-';
      } else if (m.jenis === 'SALDO AWAL') {
        keterangan = 'Saldo Awal';
      }

      return [
        safeFormat(m.tanggal, 'dd/MM/yy HH:mm'),
        m.jenis,
        keterangan,
        m.masuk || '-',
        m.keluar || '-',
        m.saldo
      ];
    });

    autoTable(doc, {
      startY: 75,
      head: [['Tanggal', 'Jenis', 'Keterangan', 'Masuk', 'Keluar', 'Saldo']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233] }, // Sky 600 color
      styles: { fontSize: 8 }
    });

    doc.save(`KartuStok_${selectedBarang.kode_barang}_${safeFormat(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    // Master data managed by context
  }, []);

  const handleSelectBarang = async (barang: MasterBarang) => {
    setSelectedBarang(barang);
    setLoading(true);
    try {
      const data = await gasService.getReportsData();
      if (data && Array.isArray(data.mutasi)) {
        const filtered = data.mutasi
          .filter((m: MutasiStok) => m.kode_barang === barang.kode_barang)
          .sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        setMutations(filtered);

        // Build lookup maps
        const mMap: Record<string, string> = {};
        data.headerMasuk?.forEach((h: any) => {
          mMap[h.id_transaksi] = h.supplier || h.supplier_nama || '-';
        });
        setHeadersMasuk(mMap);

        const kMap: Record<string, string> = {};
        data.headerKeluar?.forEach((h: any) => {
          kMap[h.id_transaksi] = h.unit_nama || h.unit || '-';
        });
        setHeadersKeluar(kMap);

      } else if (data && typeof data === 'object' && 'error' in data) {
        throw new Error((data as any).error);
      } else {
        setMutations([]);
      }
    } catch (err) {
      toast.error("Gagal memuat riwayat stok");
    } finally {
      setLoading(false);
    }
  };

  const mutationColumns: Column<MutasiStok>[] = [
    {
      header: 'Tgl & Jam',
      accessorKey: 'tanggal',
      sortable: true,
      cell: (m) => (
        <div className="flex flex-col">
          <p className="text-xs font-black text-slate-900">{safeFormat(m.tanggal, 'dd/MM/yy')}</p>
          <p className="text-[10px] font-bold text-slate-400 font-mono italic">{safeFormat(m.tanggal, 'HH:mm')}</p>
        </div>
      )
    },
    {
      header: 'Jenis',
      accessorKey: 'jenis',
      sortable: true,
      cell: (m) => (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={cn(
            "text-[9px] font-black px-2 py-0 border tracking-widest uppercase",
            m.jenis.includes('MASUK') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
            m.jenis.includes('KELUAR') ? 'bg-red-50 text-red-700 border-red-100' : 
            m.jenis === 'SALDO AWAL' ? 'bg-sky-50 text-sky-700 border-sky-100' :
            'bg-slate-50 text-slate-500 border-slate-100'
          )}>
            {m.jenis}
          </Badge>
          <p className="text-[9px] text-slate-400 font-black font-mono truncate max-w-[120px] uppercase opacity-60 font-italic">{m.referensi}</p>
        </div>
      )
    },
    {
      header: 'Keterangan',
      accessorKey: 'referensi',
      cell: (m) => {
        let label = '-';
        const isMasuk = m.jenis.includes('MASUK');
        const isKeluar = m.jenis.includes('KELUAR');

        if (isMasuk) {
          label = headersMasuk[m.referensi] || '-';
        } else if (isKeluar) {
          label = headersKeluar[m.referensi] || '-';
        } else if (m.jenis === 'SALDO AWAL') {
          label = 'Input Saldo Awal';
        }

        return (
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight leading-tight max-w-[150px]">{label}</p>
        );
      }
    },
    {
      header: 'In',
      accessorKey: 'masuk',
      sortable: true,
      className: 'text-right',
      cell: (m) => (
        <span className={cn(
          "font-mono text-[11px] font-black",
          m.masuk > 0 ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md" : "text-slate-300"
        )}>
          {m.masuk > 0 ? `+${m.masuk}` : '-'}
        </span>
      )
    },
    {
      header: 'Out',
      accessorKey: 'keluar',
      sortable: true,
      className: 'text-right',
      cell: (m) => (
        <span className={cn(
          "font-mono text-[11px] font-black",
          m.keluar > 0 ? "text-red-500 bg-red-50 px-2 py-0.5 rounded-md" : "text-slate-300"
        )}>
          {m.keluar > 0 ? `-${m.keluar}` : '-'}
        </span>
      )
    },
    {
      header: 'Balance',
      accessorKey: 'saldo',
      sortable: true,
      className: 'text-right sticky right-0 bg-white group-hover:bg-sky-50 transition-colors',
      cell: (m) => (
        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
          {m.saldo}
        </span>
      )
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-6 pb-20"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0ea5e9] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-100">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Kartu Stok Barang</h2>
            <p className="text-slate-500 italic text-xs font-medium uppercase tracking-tight">Monitor Ledger & History Per-Item Barang</p>
          </div>
        </div>
        
        <div className="flex gap-2">
           <Button 
             variant="outline" 
             size="sm" 
             onClick={handlePrint}
             className="h-10 text-[10px] font-bold uppercase tracking-wider border-slate-200"
           >
             <Printer size={14} className="mr-2" /> Cetak
           </Button>
           <Button 
             variant="outline" 
             size="sm" 
             onClick={handleExportPDF}
             className="h-10 text-[10px] font-bold uppercase tracking-wider border-slate-200"
           >
             <Download size={14} className="mr-2" /> PDF
           </Button>
        </div>
      </div>

      <Card className={cn(
        "border-none shadow-sm overflow-hidden bg-white relative transition-opacity duration-300",
        loading && !selectedBarang && "opacity-50"
      )}>
        {loading && !selectedBarang && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/10 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cari & Pilih Barang Terlebih Dahulu</label>
            <SearchBarang 
              barangList={barangList}
              onSelect={handleSelectBarang}
              selectedKode={selectedBarang?.kode_barang}
              isLoading={loading}
              className="h-14 shadow-sm border-slate-200"
            />
          </div>
        </CardContent>
      </Card>

      {selectedBarang && (
        <div className="grid md:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <Card className="md:col-span-1 border-none shadow-sm bg-white overflow-hidden">
             <div className="bg-slate-900 p-5 text-white">
                <div className="bg-sky-500/20 text-sky-300 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                   <Package size={20} />
                </div>
                <h3 className="font-bold text-lg leading-tight mb-1">{selectedBarang.nama_barang}</h3>
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">{selectedBarang.kode_barang}</p>
             </div>
             <CardContent className="p-5 space-y-4">
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-50">
                      <span className="text-slate-400 font-bold uppercase tracking-tighter">Kategori</span>
                      <span className="text-slate-900 font-bold">{selectedBarang.kategori}</span>
                   </div>
                   <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-50">
                      <span className="text-slate-400 font-bold uppercase tracking-tighter">Sub-Kategori</span>
                      <span className="text-slate-900 font-bold">{selectedBarang.sub_kategori || '-'}</span>
                   </div>
                   <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-50">
                      <span className="text-slate-400 font-bold uppercase tracking-tighter">Merk / Brand</span>
                      <span className="text-slate-900 font-bold italic">{selectedBarang.merk || 'No Merk'}</span>
                   </div>
                   <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-50">
                      <span className="text-slate-400 font-bold uppercase tracking-tighter">Lokasi Rak</span>
                      <span className="text-slate-900 font-bold flex items-center gap-1">
                        <MapPin size={10} className="text-sky-500" /> {selectedBarang.lokasi_rak || '-'}
                      </span>
                   </div>
                </div>

                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex flex-col items-center gap-1">
                   <p className="text-[10px] font-bold text-sky-700 uppercase tracking-widest">Stok Saat Ini (Real-Time)</p>
                   <p className="text-4xl font-black text-sky-900 tracking-tighter">
                     {selectedBarang.stok_sekarang}
                     <span className="text-sm ml-1.5 font-bold uppercase text-sky-600">{selectedBarang.satuan}</span>
                   </p>
                </div>

                {Number(selectedBarang.stok_sekarang) <= Number(selectedBarang.stok_minimum) && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex gap-3 items-center">
                    <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                       <ArrowDownRight size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-red-800 uppercase tracking-tight">Kritis / Dibawah Min</p>
                      <p className="text-[10px] text-red-600 font-medium leading-none">Min: {selectedBarang.stok_minimum} {selectedBarang.satuan}</p>
                    </div>
                  </div>
                )}
             </CardContent>
          </Card>

          <Card className="md:col-span-2 border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden flex flex-col rounded-[2rem]">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/30">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-100">
                    <History size={20} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Journal History</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Audit trail pergerakan stok barang</p>
                 </div>
               </div>
               {loading && (
                 <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-sky-600" />
                    <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Syncing Cloud...</span>
                 </div>
               )}
            </div>
            <div className="flex-1 overflow-visible">
              <DataTable
                data={mutations}
                columns={mutationColumns}
                loading={loading}
                showSearch={false}
                pageSize={15}
                emptyMessage="Tidak ada historyledger untuk barang ini."
                className="border-none"
              />
            </div>
          </Card>
        </div>
      )}

      {!selectedBarang && !loading && (
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50 p-20 flex flex-col items-center justify-center gap-4">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 shadow-sm border border-slate-100">
              <Search size={32} />
           </div>
           <div className="text-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Silakan Cari Barang</h3>
              <p className="text-xs text-slate-400 mt-1">Masukkan kode, nama, atau merk pada kolom pencarian diatas.</p>
           </div>
        </Card>
      )}
    </motion.div>
  );
}
