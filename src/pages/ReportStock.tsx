import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Search, 
  Download, 
  FileText,
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Calendar, 
  Box
} from 'lucide-react';
import { motion } from 'motion/react';
import { gasService } from '../services/gasService';
import { MasterBarang, MutasiStok } from '../types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { toast } from 'sonner';
import { cn, safeFormat } from '../lib/utils';
import { format } from 'date-fns';
import { DataTable, Column, StockIndicator } from '../components/DataTable';

interface StockSummary extends MasterBarang {
  total_masuk: number;
  total_keluar: number;
}

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportStock() {
  const [loading, setLoading] = useState(true);
  const [barang, setBarang] = useState<MasterBarang[]>([]);
  const [mutasi, setMutasi] = useState<MutasiStok[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await gasService.getDashboard();
      setBarang(Array.isArray(data.barang) ? data.barang : []);
      setMutasi(Array.isArray(data.mutasi) ? data.mutasi : []);
    } catch (err) {
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4') as any;
    
    doc.setFontSize(18);
    doc.text('LAPORAN STOK PERSEDIAAN', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`RSUD DELI SERDANG - UNIT LOGISTIK`, 14, 30);
    doc.text(`Kategori: ${categoryFilter === 'ALL' ? 'SEMUA' : categoryFilter}`, 14, 35);
    doc.text(`Tanggal Cetak: ${safeFormat(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 40);

    const tableRows = filteredReport.map(item => [
      item.kode_barang,
      item.nama_barang,
      item.kategori,
      item.satuan,
      item.total_masuk,
      item.total_keluar,
      item.stok_sekarang,
      item.stok_sekarang <= 0 ? 'KOSONG' : (item.stok_sekarang <= item.stok_minimum ? 'RENDAH' : 'AMAN')
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Kode', 'Nama Barang', 'Kategori', 'Satuan', 'In', 'Out', 'Sisa', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199] }, // sky-600
      styles: { fontSize: 8 }
    });

    doc.save(`LaporanStok_${safeFormat(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success("Berhasil mengekspor PDF");
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(barang.map(b => b.kategori));
    return ['ALL', ...Array.from(cats)].sort();
  }, [barang]);

  const stockReport = useMemo(() => {
    return barang.map(b => {
      const itemMutasi = mutasi.filter(m => m.kode_barang === b.kode_barang);
      const total_masuk = itemMutasi.reduce((acc, curr) => acc + (Number(curr.masuk) || 0), 0);
      const total_keluar = itemMutasi.reduce((acc, curr) => acc + (Number(curr.keluar) || 0), 0);
      
      return {
        ...b,
        total_masuk,
        total_keluar,
        stok_sekarang: Number(b.stok_sekarang) || 0,
        stok_minimum: Number(b.stok_minimum) || 0
      } as StockSummary;
    });
  }, [barang, mutasi]);

  const filteredReport = useMemo(() => {
    return stockReport.filter(item => {
      const matchSearch = item.nama_barang.toLowerCase().includes(search.toLowerCase()) || 
                          item.kode_barang.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || item.kategori === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'LOW' && item.stok_sekarang <= item.stok_minimum) ||
                          (statusFilter === 'SAFE' && item.stok_sekarang > item.stok_minimum) ||
                          (statusFilter === 'EMPTY' && item.stok_sekarang <= 0);
      
      return matchSearch && matchCategory && matchStatus;
    });
  }, [stockReport, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const lowStock = stockReport.filter(i => i.stok_sekarang <= i.stok_minimum && i.stok_sekarang > 0).length;
    const outOfStock = stockReport.filter(i => i.stok_sekarang <= 0).length;
    const safeStock = stockReport.filter(i => i.stok_sekarang > i.stok_minimum).length;
    
    return { lowStock, outOfStock, safeStock };
  }, [stockReport]);

  const reportColumns: Column<StockSummary>[] = [
    {
      header: 'Informasi Barang',
      accessorKey: 'nama_barang',
      sticky: 'left',
      sortable: true,
      width: '250px',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-sky-600 mb-0.5 font-mono">{item.kode_barang}</span>
          <span className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">{item.nama_barang}</span>
        </div>
      )
    },
    {
      header: 'Kategori',
      accessorKey: 'kategori',
      sortable: true,
      cell: (item) => <Badge variant="outline" className="bg-slate-50 text-[9px] font-black tracking-tight border-slate-200 text-slate-500 uppercase">{item.kategori}</Badge>
    },
    {
      header: 'Satuan',
      accessorKey: 'satuan',
      sortable: true,
      cell: (item) => <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.satuan}</span>
    },
    {
      header: 'Total Masuk',
      accessorKey: 'total_masuk',
      sortable: true,
      className: "text-right",
      cell: (item) => <span className="text-xs font-black text-sky-600 font-mono">{item.total_masuk.toLocaleString()}</span>
    },
    {
      header: 'Total Keluar',
      accessorKey: 'total_keluar',
      sortable: true,
      className: "text-right",
      cell: (item) => <span className="text-xs font-black text-orange-600 font-mono">{item.total_keluar.toLocaleString()}</span>
    },
    {
      header: 'Status & Stok Akhir',
      accessorKey: 'stok_sekarang',
      sortable: true,
      cell: (item) => <StockIndicator current={Number(item.stok_sekarang)} min={Number(item.stok_minimum)} />
    },
    {
      header: 'Stok Akhir',
      accessorKey: 'stok_sekarang',
      sortable: true,
      className: "text-right bg-slate-50/50",
      cell: (item) => (
        <span className={cn(
          "font-black font-mono text-sm tracking-tighter",
          item.stok_sekarang <= 0 ? "text-red-600" : (item.stok_sekarang <= item.stok_minimum ? "text-amber-600" : "text-slate-900")
        )}>
          {item.stok_sekarang.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Min',
      accessorKey: 'stok_minimum',
      sortable: true,
      className: "text-right",
      cell: (item) => <span className="font-mono text-[10px] font-bold text-slate-400">{item.stok_minimum.toLocaleString()}</span>
    },
    {
      header: 'Status',
      accessorKey: 'stok_sekarang',
      sortable: true,
      sticky: 'right',
      cell: (item) => {
        const isOut = item.stok_sekarang <= 0;
        const isLow = item.stok_sekarang <= item.stok_minimum;
        return (
          <Badge className={cn(
            "text-[9px] font-black border uppercase tracking-widest rounded-md px-2",
            isOut ? "bg-red-50 text-red-700 border-red-100" : (isLow ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100")
          )}>
            {isOut ? 'KOSONG' : (isLow ? 'RENDAH' : 'AMAN')}
          </Badge>
        );
      }
    }
  ];

  const handleExportCSV = () => {
    const headers = ['Kode', 'Nama Barang', 'Kategori', 'Satuan', 'Stok Masuk', 'Stok Keluar', 'Stok Akhir', 'Stok Min', 'Status'];
    const rows = filteredReport.map(i => [
      i.kode_barang,
      i.nama_barang,
      i.kategori,
      i.satuan,
      i.total_masuk,
      i.total_keluar,
      i.stok_sekarang,
      i.stok_minimum,
      i.stok_sekarang <= 0 ? 'KOSONG' : (i.stok_sekarang <= i.stok_minimum ? 'RENDAH' : 'AMAN')
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Stok_${safeFormat(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider">
            <BarChart3 size={14} />
            Laporan & Analisis
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Laporan Stok <span className="text-sky-600">Persediaan</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Monitoring ketersediaan barang dan pergerakan stok real-time.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs h-10 px-4 rounded-xl shadow-sm"
          >
            <Calendar size={16} className="mr-2" />
            Refresh Data
          </Button>
          <Button 
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-emerald-200/50"
          >
            <Download size={16} className="mr-2" />
            CSV
          </Button>
          <Button 
            onClick={handleExportPDF}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-sky-200/50"
          >
            <FileText size={16} className="mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
          <CardContent className="p-5">
             <div className="flex justify-between items-start">
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Item</p>
                 <h3 className="text-2xl font-black text-slate-900">{barang.length}</h3>
               </div>
               <div className="p-2 bg-sky-50 text-sky-600 rounded-lg group-hover:scale-110 transition-transform">
                 <Package size={20} />
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-5">
             <div className="flex justify-between items-start">
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stok Aman</p>
                 <h3 className="text-2xl font-black text-emerald-600">{stats.safeStock}</h3>
               </div>
               <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                 <CheckCircle2 size={20} />
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardContent className="p-5">
             <div className="flex justify-between items-start">
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stok Rendah</p>
                 <h3 className="text-2xl font-black text-amber-600">{stats.lowStock}</h3>
               </div>
               <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                 <AlertTriangle size={20} />
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <CardContent className="p-5">
             <div className="flex justify-between items-start">
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stok Kosong</p>
                 <h3 className="text-2xl font-black text-red-600">{stats.outOfStock}</h3>
               </div>
               <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:scale-110 transition-transform">
                 <Box size={20} />
               </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden rounded-[2rem]">
        <CardHeader className="p-8 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white shadow-lg">
                    <Filter size={18} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Advanced Filters</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Saring data stok berdasarkan kategori dan status</p>
                 </div>
               </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-slate-50 p-1 rounded-xl border border-slate-100 flex items-center gap-1">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 w-[160px] bg-transparent border-none font-black text-[10px] uppercase tracking-widest">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-[10px] font-bold">
                        {cat === 'ALL' ? 'SEMUA KATEGORI' : cat.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="w-px h-4 bg-slate-200" />

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[140px] bg-transparent border-none font-black text-[10px] uppercase tracking-widest">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="ALL" className="text-[10px] font-bold text-slate-600">SEMUA STATUS</SelectItem>
                    <SelectItem value="SAFE" className="text-[10px] font-bold text-emerald-600">STOK AMAN</SelectItem>
                    <SelectItem value="LOW" className="text-[10px] font-bold text-amber-600">STOK RENDAH</SelectItem>
                    <SelectItem value="EMPTY" className="text-[10px] font-bold text-red-600">STOK KOSONG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <DataTable
            data={filteredReport}
            columns={reportColumns}
            loading={loading}
            searchPlaceholder="Cari berdasarkan kode atau nama barang..."
            className="border-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}
