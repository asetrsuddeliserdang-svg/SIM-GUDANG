import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Download, FileText, ArrowLeftRight, AlertCircle, Loader2 } from 'lucide-react';
import { gasService } from '../services/gasService';
import { MutasiStok } from '../types';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { cn, safeFormat, safeCompareDates } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DataTable, Column } from '../components/DataTable';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Mutation() {
  const [mutations, setMutations] = useState<MutasiStok[]>([]);
  const [headersMasuk, setHeadersMasuk] = useState<Record<string, string>>({});
  const [headersKeluar, setHeadersKeluar] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Kode Barang', 'Nama Barang', 'Jenis', 'Referensi', 'Pihak Terkait', 'Masuk', 'Keluar', 'Saldo'];
    const rows = mutations.map(m => {
      let pihak = '-';
      if (m.jenis.includes('MASUK')) {
        pihak = headersMasuk[m.referensi] || '-';
      } else if (m.jenis.includes('KELUAR')) {
        pihak = headersKeluar[m.referensi] || '-';
      }

      return [
        safeFormat(m.tanggal, 'yyyy-MM-dd HH:mm:ss'),
        m.kode_barang,
        m.nama_barang,
        m.jenis,
        m.referensi,
        pihak,
        m.masuk,
        m.keluar,
        m.saldo
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Mutasi_Gudang_${safeFormat(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Berhasil mengekspor CSV");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4') as any;
    
    doc.setFontSize(18);
    doc.text('LAPORAN AUDIT MUTASI BARANG', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`RSUD DELI SERDANG - UNIT LOGISTIK`, 14, 30);
    doc.text(`Tanggal Cetak: ${safeFormat(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 35);

    const tableRows = mutations.map(m => {
      let pihak = '-';
      if (m.jenis.includes('MASUK')) {
        pihak = headersMasuk[m.referensi] || '-';
      } else if (m.jenis.includes('KELUAR')) {
        pihak = headersKeluar[m.referensi] || '-';
      }

      return [
        safeFormat(m.tanggal, 'dd/MM/yy HH:mm'),
        m.nama_barang,
        m.jenis,
        pihak,
        m.masuk || '-',
        m.keluar || '-',
        m.saldo
      ];
    });

    autoTable(doc, {
      startY: 45,
      head: [['Tanggal', 'Nama Barang', 'Jenis', 'Pihak Terkait', 'Masuk', 'Keluar', 'Saldo']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }, // slate-900
      styles: { fontSize: 7 }
    });

    doc.save(`AuditMutasi_${safeFormat(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success("Berhasil mengekspor PDF");
  };

  useEffect(() => {
    fetchMutations();
  }, []);

  const fetchMutations = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await gasService.getReportsData();
      if (data && Array.isArray(data.mutasi)) {
        // Sort by date descending using safe helper
        const sortedData = [...data.mutasi].sort((a: any, b: any) => 
          safeCompareDates(a.tanggal, b.tanggal, 'desc')
        );
        setMutations(sortedData);

        // Build lookup maps with explicit string keys
        const mMap: Record<string, string> = {};
        data.headerMasuk?.forEach((h: any) => {
          if (h.id_transaksi) {
            mMap[String(h.id_transaksi)] = h.supplier || h.supplier_nama || h.supplier_id || '-';
          }
        });
        setHeadersMasuk(mMap);

        const kMap: Record<string, string> = {};
        data.headerKeluar?.forEach((h: any) => {
          if (h.id_transaksi) {
            kMap[String(h.id_transaksi)] = h.unit_nama || h.unit || h.unit_id || '-';
          }
        });
        setHeadersKeluar(kMap);

      } else if (data && typeof data === 'object' && 'error' in data) {
        throw new Error((data as any).error);
      } else {
        setMutations([]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
      toast.error("Gagal memuat data riwayat mutasi");
    } finally {
      setLoading(false);
    }
  };

  const mutationColumns: Column<MutasiStok>[] = [
    {
      header: 'Timestamp',
      accessorKey: 'tanggal',
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col">
          <p className="text-xs font-bold text-slate-900">
            {safeFormat(item.tanggal, 'dd MMMM yyyy')}
          </p>
          <p className="text-[10px] font-medium text-slate-400 font-mono">
            {safeFormat(item.tanggal, 'HH:mm:ss')}
          </p>
        </div>
      )
    },
    {
      header: 'Informasi Barang',
      accessorKey: 'nama_barang',
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col">
          <p className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{item.nama_barang}</p>
          <p className="text-[10px] text-sky-600 font-black font-mono tracking-tighter">{item.kode_barang}</p>
        </div>
      )
    },
    {
      header: 'Aksi',
      accessorKey: 'jenis',
      sortable: true,
      cell: (item) => (
        <Badge variant="outline" className={cn(
          "text-[9px] font-black tracking-widest uppercase border-0 px-2 py-0.5 rounded-md",
          item.jenis.includes('MASUK') ? 'bg-emerald-50 text-emerald-700' : 
          item.jenis.includes('KELUAR') ? 'bg-red-50 text-red-700' : 
          item.jenis === 'SALDO AWAL' ? 'bg-sky-50 text-sky-700' :
          'bg-slate-100 text-slate-600'
        )}>
          {item.jenis}
        </Badge>
      )
    },
    {
      header: 'Keterangan',
      accessorKey: 'referensi',
      cell: (item) => {
        let label = '-';
        const isMasuk = item.jenis.includes('MASUK');
        const isKeluar = item.jenis.includes('KELUAR');

        const ref = item.referensi ? String(item.referensi) : '';

        if (isMasuk) {
          label = headersMasuk[ref] || '-';
        } else if (isKeluar) {
          label = headersKeluar[ref] || '-';
        } else if (item.jenis === 'SALDO AWAL') {
          label = 'Input Saldo Awal';
        }

        return (
          <div className="flex flex-col">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{label}</p>
            <p className="text-[9px] text-slate-400 font-mono italic">{item.referensi}</p>
          </div>
        );
      }
    },
    {
      header: 'Masuk',
      accessorKey: 'masuk',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <span className={cn(
          "font-mono font-black text-xs",
          item.masuk > 0 ? "text-emerald-600" : "text-slate-300"
        )}>
          {item.masuk > 0 ? `+${new Intl.NumberFormat('id-ID').format(item.masuk)}` : '-'}
        </span>
      )
    },
    {
      header: 'Keluar',
      accessorKey: 'keluar',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <span className={cn(
          "font-mono font-black text-xs",
          item.keluar > 0 ? "text-red-500" : "text-slate-300"
        )}>
          {item.keluar > 0 ? `-${new Intl.NumberFormat('id-ID').format(item.keluar)}` : '-'}
        </span>
      )
    },
    {
      header: 'Saldo Akhir',
      accessorKey: 'saldo',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <span className="font-mono font-black text-sm text-sky-900 bg-sky-50 px-2 py-1 rounded-lg">
          {new Intl.NumberFormat('id-ID').format(item.saldo)}
        </span>
      )
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-20"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-200">
            <ArrowLeftRight size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Audit Mutasi</h2>
            <p className="text-slate-500 italic text-[10px] font-bold uppercase tracking-widest leading-none">Journal pergerakan logistik persediaan RSUD</p>
          </div>
        </div>
        
        <div className="flex gap-2">
           <Button 
             variant="outline" 
             size="sm" 
             onClick={handleExportCSV}
             className="h-10 text-[10px] font-black uppercase tracking-widest border-slate-200 bg-white rounded-xl shadow-sm"
           >
             <Download size={14} className="mr-2" /> Export CSV
           </Button>
           <Button 
             variant="outline" 
             size="sm" 
             onClick={handleExportPDF}
             className="h-10 text-[10px] font-black uppercase tracking-widest border-slate-200 bg-white rounded-xl shadow-sm"
           >
             <FileText size={14} className="mr-2" /> PDF
           </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {errorMsg ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-red-100 bg-red-50 p-12 border-2 border-dashed flex flex-col items-center gap-4 rounded-[2rem]">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                <AlertCircle size={32} />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-red-900 uppercase tracking-widest">Gagal Memuat Sinkronisasi</p>
                <p className="text-[11px] text-red-600 max-w-md mx-auto mt-1 leading-relaxed font-bold uppercase">{errorMsg}</p>
              </div>
              <Button variant="outline" onClick={fetchMutations} className="mt-4 border-red-200 text-red-700 bg-white hover:bg-red-50 font-black uppercase text-[10px] px-8 h-10 rounded-xl">
                Coba Sinkron Ulang
              </Button>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-[2rem]">
              <CardContent className="p-0">
                <DataTable
                  data={mutations}
                  columns={mutationColumns}
                  loading={loading}
                  pageSize={50}
                  searchPlaceholder="Cari berdasarkan kode, nama barang, atau referensi..."
                  emptyMessage="Tidak ada riwayat mutasi stok ditemukan."
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
