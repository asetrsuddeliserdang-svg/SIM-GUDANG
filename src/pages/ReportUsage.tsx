import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Download, 
  FileText,
  ArrowDownRight, 
  Calendar,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Package,
  Layers,
  ArrowUpRight,
  ClipboardList
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { gasService } from '../services/gasService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { toast } from 'sonner';
import { safeFormat } from '../lib/utils';
import { SearchSelect } from '@/components/SearchSelect';
import { DataTable, Column } from '../components/DataTable';

export default function ReportUsage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Custom Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tab control to toggle between Detail view and old Summary view
  const [activeTab, setActiveTab] = useState<'detail' | 'rekap'>('detail');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await gasService.getReportsData();
      setData(res);
    } catch (err) {
      toast.error("Gagal memuat data laporan pemakaian");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset helper
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setUnitFilter('ALL');
    setCategoryFilter('ALL');
    setSearchQuery('');
    toast.success("Filter berhasil di-reset ke nilai bawaan");
  };

  // Extract master unit selection list
  const unitOptions = useMemo(() => {
    if (!data?.unit) return [{ value: 'ALL', label: 'SEMUA UNIT' }];
    return [
      { value: 'ALL', label: 'SEMUA UNIT' },
      ...(data.unit.map((u: any) => ({
        value: u.id_unit,
        label: u.nama_unit.toUpperCase(),
        subLabel: u.bidang
      })) || [])
    ];
  }, [data]);

  // Extract master category selection list
  const categoryList = useMemo(() => {
    if (!data?.barang) return ['ALL'];
    const cats = data.barang.map((b: any) => b.kategori).filter(Boolean);
    return ['ALL', ...Array.from(new Set(cats))].sort() as string[];
  }, [data]);

  // Helper to get property regardless of case or underscore/space
  const getVal = (obj: any, keys: string[]): any => {
    if (!obj) return '';
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

  // Transform transactions into full details tracking list
  const detailTransactions = useMemo(() => {
    if (!data) return [];
    
    const headers = data.headerKeluar || [];
    const details = data.detailKeluar || [];
    const barangList = data.barang || [];
    
    // Create a fast map for barang lookups using uppercase keys
    const barangMap = new Map<string, any>(
      barangList.map((b: any) => [String(b.kode_barang || '').trim().toUpperCase(), b])
    );
    const list: any[] = [];
    
    headers.forEach((h: any) => {
      const hId = String(getVal(h, ['id_transaksi']) || '').trim().toUpperCase();
      if (!hId) return;

      const relatedDetails = details.filter((d: any) => {
        const dId = String(getVal(d, ['id_transaksi']) || '').trim().toUpperCase();
        return dId === hId;
      });

      relatedDetails.forEach((d: any, idx: number) => {
        const kode_barang = String(getVal(d, ['kode_barang', 'kode barang', 'kode']) || '').trim();
        const nama_barang = String(getVal(d, ['nama_barang', 'nama barang', 'nama']) || '').trim();
        const qty_keluar = Number(getVal(d, ['qty', 'qty_keluar', 'qty keluar', 'jumlah']) || 0);
        const satuan = String(getVal(d, ['satuan']) || '').trim();

        const itemBarang = barangMap.get(kode_barang.toUpperCase()) as any;
        const kategori = itemBarang?.kategori || getVal(d, ['kategori']) || 'BMHP';
        
        list.push({
          id_detail: `${hId}_${kode_barang || idx}_${idx}`, // unique identifier
          id_transaksi: hId,
          tanggal: h.tanggal,
          kode_barang: kode_barang || itemBarang?.kode_barang || '-',
          nama_barang: nama_barang || itemBarang?.nama_barang || '-',
          kategori: kategori,
          qty_keluar: qty_keluar,
          satuan: satuan || itemBarang?.satuan || 'Pcs',
          unit_id: h.unit_id,
          unit_nama: h.unit_nama || h.unit || '-'
        });
      });
    });
    
    return list;
  }, [data]);

  // Filtered detail list based on custom user filter controls
  const filteredDetailReport = useMemo(() => {
    return detailTransactions.filter((item: any) => {
      // 1. Period Range Filter
      if (startDate) {
        const itemTime = new Date(item.tanggal).getTime();
        const filterStart = new Date(startDate + 'T00:00:00').getTime();
        if (itemTime < filterStart) return false;
      }
      if (endDate) {
        const itemTime = new Date(item.tanggal).getTime();
        const filterEnd = new Date(endDate + 'T23:59:59').getTime();
        if (itemTime > filterEnd) return false;
      }
      
      // 2. Unit ID Filter
      if (unitFilter !== 'ALL' && item.unit_id !== unitFilter) {
        return false;
      }
      
      // 3. Category Filter
      if (categoryFilter !== 'ALL' && item.kategori?.toUpperCase() !== categoryFilter.toUpperCase()) {
        return false;
      }
      
      // 4. Searching Match (Code / Name)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const codeMatch = item.kode_barang?.toLowerCase().includes(q);
        const nameMatch = item.nama_barang?.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch) return false;
      }
      
      return true;
    });
  }, [detailTransactions, startDate, endDate, unitFilter, categoryFilter, searchQuery]);

  // Aggregate summary data grouped by unit and item for backwards compatibility view
  const usageReportSummary = useMemo(() => {
    if (!data) return [];
    
    const grouped: Record<string, Record<string, any>> = {};
    
    filteredDetailReport.forEach((item: any) => {
      const key = `${item.unit_id}_${item.kode_barang}`;
      if (!grouped[key]) {
        grouped[key] = {
          unit_id: item.unit_id,
          unit_nama: item.unit_nama,
          kode_barang: item.kode_barang,
          nama_barang: item.nama_barang,
          satuan: item.satuan,
          kategori: item.kategori,
          total_qty: 0
        };
      }
      grouped[key].total_qty += item.qty_keluar;
    });
    
    return Object.values(grouped);
  }, [filteredDetailReport]);

  // Analytical stats of currently filtered selection
  const stats = useMemo(() => {
    const totalTransactions = filteredDetailReport.length;
    const totalVolume = filteredDetailReport.reduce((sum, item) => sum + item.qty_keluar, 0);
    
    const unitMap: Record<string, number> = {};
    filteredDetailReport.forEach(item => {
      unitMap[item.unit_nama] = (unitMap[item.unit_nama] || 0) + item.qty_keluar;
    });
    
    let topUnit = '-';
    let topUnitVolume = 0;
    Object.entries(unitMap).forEach(([name, vol]) => {
      if (vol > topUnitVolume) {
        topUnitVolume = vol;
        topUnit = name;
      }
    });

    return {
      totalTransactions,
      totalVolume,
      topUnit,
      topUnitVolume
    };
  }, [filteredDetailReport]);

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4') as any;
    
    doc.setFontSize(16);
    doc.text(activeTab === 'detail' ? 'LAPORAN DETAIL PEMAKAIAN BARANG PER UNIT' : 'LAPORAN REKAP PEMAKAIAN BARANG PER UNIT', 14, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(`RSUD DELI SERDANG - UNIT GUDANG PERSENYAAN`, 14, 26);
    
    const periodStr = `Periode: ${startDate ? safeFormat(startDate, 'dd/MM/yyyy') : 'Semua Tanggal'} s.d. ${endDate ? safeFormat(endDate, 'dd/MM/yyyy') : 'Semua Tanggal'}`;
    const unitStr = `Unit: ${unitFilter === 'ALL' ? 'Semua Unit' : (unitOptions.find(o => o.value === unitFilter)?.label || unitFilter)}`;
    const catStr = `Kategori: ${categoryFilter === 'ALL' ? 'Semua Kategori' : categoryFilter.toUpperCase()}`;
    
    doc.text(`${periodStr}  |  ${unitStr}  |  ${catStr}`, 14, 32);
    doc.text(`Tanggal Cetak: ${safeFormat(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 37);

    if (activeTab === 'detail') {
      const tableRows = filteredDetailReport.map((i: any) => [
        safeFormat(i.tanggal, 'dd/MM/yyyy HH:mm'),
        i.kode_barang,
        i.nama_barang,
        i.kategori,
        i.qty_keluar,
        i.satuan,
        i.unit_nama
      ]);

      autoTable(doc, {
        startY: 42,
        head: [['Tanggal', 'Kode Barang', 'Nama Barang', 'Kategori', 'Qty Keluar', 'Satuan', 'Unit/Ruangan Pemakai']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12] }, // orange-600
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 26 },
          2: { cellWidth: 60 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 20 },
          6: { cellWidth: 65 }
        }
      });
      
      doc.save(`Laporan_Detail_Pemakaian_${safeFormat(new Date(), 'yyyyMMdd')}.pdf`);
    } else {
      const tableRows = usageReportSummary.map((i: any) => [
        i.unit_nama,
        i.kode_barang,
        i.nama_barang,
        i.kategori,
        i.total_qty,
        i.satuan
      ]);

      autoTable(doc, {
        startY: 42,
        head: [['Nama Unit', 'Kode Barang', 'Nama Barang', 'Kategori', 'Total Pemakaian', 'Satuan']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11] }, // amber-500
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30 },
          2: { cellWidth: 75 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25, halign: 'center' },
          5: { cellWidth: 20 }
        }
      });

      doc.save(`Laporan_Rekap_Pemakaian_${safeFormat(new Date(), 'yyyyMMdd')}.pdf`);
    }
    
    toast.success("Berhasil mengekspor PDF");
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = '';

    if (activeTab === 'detail') {
      headers = ['Tanggal', 'Kode Barang', 'Nama Barang', 'Kategori', 'Qty Keluar', 'Satuan', 'Unit/Ruangan Pemakai'];
      rows = filteredDetailReport.map((i: any) => [
        safeFormat(i.tanggal, 'yyyy-MM-dd HH:mm:ss'),
        i.kode_barang,
        i.nama_barang,
        i.kategori,
        i.qty_keluar,
        i.satuan,
        i.unit_nama
      ]);
      filename = `Laporan_Detail_Pemakaian_Unit_${safeFormat(new Date(), 'yyyyMMdd')}.csv`;
    } else {
      headers = ['Nama Unit', 'Kode Barang', 'Nama Barang', 'Kategori', 'Total Pemakaian', 'Satuan'];
      rows = usageReportSummary.map((i: any) => [
        i.unit_nama,
        i.kode_barang,
        i.nama_barang,
        i.kategori,
        i.total_qty,
        i.satuan
      ]);
      filename = `Laporan_Rekap_Pemakaian_Unit_${safeFormat(new Date(), 'yyyyMMdd')}.csv`;
    }

    const csvContent = [headers, ...rows].map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    // UTF-8 BOM representation to ensure flawless opens in Microsoft Excel
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Berhasil mengekspor Excel (CSV)");
  };

  // Old columns structure for Aggregated Summary view
  const usageSummaryColumns: Column<any>[] = [
    {
      header: 'Nama Unit',
      accessorKey: 'unit_nama',
      sortable: true,
      sticky: 'left',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.unit_nama}</span>
          <span className="text-[10px] text-slate-400 font-bold font-mono">ID: {item.unit_id}</span>
        </div>
      )
    },
    {
      header: 'Informasi Barang',
      accessorKey: 'nama_barang',
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">{item.nama_barang}</span>
          <span className="text-[10px] text-sky-600 font-bold font-mono tracking-tighter">{item.kode_barang}</span>
        </div>
      )
    },
    {
      header: 'Kategori',
      accessorKey: 'kategori',
      sortable: true,
      cell: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-500 uppercase">
          {item.kategori}
        </span>
      )
    },
    {
      header: 'Satuan',
      accessorKey: 'satuan',
      sortable: true,
      cell: (item) => <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.satuan}</span>
    },
    {
      header: 'Total Pemakaian',
      accessorKey: 'total_qty',
      sortable: true,
      className: 'text-center',
      cell: (item) => (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 italic transition-transform hover:scale-105">
          <ArrowDownRight size={12} className="shrink-0" />
          <span className="text-sm font-black font-mono">{item.total_qty}</span>
        </div>
      )
    }
  ];

  // Requested columns structure for Detailed Transaction entries
  const detailColumns: Column<any>[] = [
    {
      header: 'Tanggal',
      accessorKey: 'tanggal',
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 font-mono">
            {safeFormat(item.tanggal, 'dd/MM/yyyy HH:mm')}
          </span>
        </div>
      )
    },
    {
      header: 'Kode Barang',
      accessorKey: 'kode_barang',
      sortable: true,
      cell: (item) => (
        <span className="text-xs font-mono font-black text-sky-600 tracking-tighter">
          {item.kode_barang}
        </span>
      )
    },
    {
      header: 'Nama Barang',
      accessorKey: 'nama_barang',
      sortable: true,
      cell: (item) => (
        <span className="text-xs font-bold text-slate-800 uppercase leading-snug">
          {item.nama_barang}
        </span>
      )
    },
    {
      header: 'Kategori',
      accessorKey: 'kategori',
      sortable: true,
      cell: (item) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-tight">
          {item.kategori}
        </span>
      )
    },
    {
      header: 'Qty Keluar',
      accessorKey: 'qty_keluar',
      sortable: true,
      className: 'text-center',
      cell: (item) => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-lg border border-red-100 transition-all">
          <ArrowDownRight size={12} className="shrink-0" />
          <span className="text-[13px] font-black font-mono">{item.qty_keluar}</span>
        </div>
      )
    },
    {
      header: 'Satuan',
      accessorKey: 'satuan',
      sortable: true,
      cell: (item) => (
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          {item.satuan}
        </span>
      )
    },
    {
      header: 'Unit/Ruangan Pemakai',
      accessorKey: 'unit_nama',
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col max-w-[240px]">
          <span className="text-xs font-black text-slate-900 uppercase tracking-tight block truncate">
            {item.unit_nama}
          </span>
          <span className="text-[9px] text-slate-400 font-mono">ID: {item.unit_id}</span>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Main Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider">
            <Building2 size={14} />
            Distribusi & Pemakaian
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Pemakaian <span className="text-orange-600">Per Unit</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Sistem rekap dan detail pembukuan barang keluar untuk setiap unit atau ruangan pelayanan.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={fetchData} disabled={loading} className="border-slate-200 text-slate-600 font-bold text-xs h-10 px-4 rounded-xl shadow-sm">
            <Calendar size={16} className="mr-2" />
            Refresh Data
          </Button>
          <Button onClick={handleExportCSV} className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-orange-200/50">
            <Download size={16} className="mr-2" />
            Export Excel
          </Button>
          <Button onClick={handleExportPDF} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-amber-200/50">
            <FileText size={16} className="mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Analytics Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden relative">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Transaksi</span>
              <span className="text-2xl font-black text-slate-900">{stats.totalTransactions} x</span>
              <span className="text-[10px] text-slate-400 block font-medium">Pengeluaran terdaftar</span>
            </div>
            <div className="w-12 h-12 bg-orange-50 text-orange-600 flex items-center justify-center rounded-2xl">
              <ClipboardList size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden relative">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Volume Didistribusikan</span>
              <span className="text-2xl font-black text-orange-600 font-mono">{stats.totalVolume}</span>
              <span className="text-[10px] text-slate-400 block font-medium">Banyak barang disalurkan</span>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 flex items-center justify-center rounded-2xl">
              <Package size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden relative sm:col-span-2 lg:col-span-1">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1 max-w-[70%]">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Konsumsi Terbesar</span>
              <span className="text-sm font-black text-slate-800 uppercase block truncate">{stats.topUnit}</span>
              <span className="text-[10px] text-slate-400 block font-semibold">{stats.topUnitVolume} barang keluar</span>
            </div>
            <div className="w-12 h-12 bg-sky-50 text-sky-600 flex items-center justify-center rounded-2xl">
              <ArrowUpRight size={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Container card with Filters Setup */}
      <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden rounded-[2rem]">
        <CardHeader className="p-6 md:p-8 border-b border-slate-100 space-y-6">
          {/* Header row with Tab Selectors */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Pilihan Laporan</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Ganti mode tampilan rekap atau detail rincian transaksi</p>
            </div>
            
            <div className="inline-flex p-1 bg-slate-100 rounded-xl space-x-1 self-start lg:self-auto">
              <button
                onClick={() => setActiveTab('detail')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'detail' 
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-100' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Detail Pemakaian
              </button>
              <button
                onClick={() => setActiveTab('rekap')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'rekap' 
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-100' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rekap Pemakaian
              </button>
            </div>
          </div>

          {/* Filter Controls Panel Layout */}
          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider mb-1">
              <SlidersHorizontal size={14} className="text-orange-600" />
              Saring & Cari Data
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filter 1: Tanggal Awal */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} />
                  Tanggal Awal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>

              {/* Filter 2: Tanggal Akhir */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} />
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>

              {/* Filter 3: Unit / Ruangan Pemakai */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 size={12} />
                  Unit / Ruangan Pemakai
                </label>
                <SearchSelect 
                  options={unitOptions}
                  selectedValue={unitFilter}
                  onSelect={setUnitFilter}
                  placeholder="Semua Unit..."
                  className="h-10 w-full bg-white border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>

              {/* Filter 4: Kategori Barang */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers size={12} />
                  Kategori Barang
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none cursor-pointer uppercase"
                >
                  {categoryList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'ALL' ? 'SEMUA KATEGORI' : cat.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
              {/* Search Bar matching Code or Name */}
              <div className="relative flex-1 max-w-lg group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={15} />
                <input
                  type="text"
                  placeholder="Cari berdasarkan Kode Barang atau Nama Barang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 w-full h-10 border border-slate-200 bg-white focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl transition-all outline-none font-medium text-xs placeholder:text-slate-400"
                />
              </div>

              {/* Clear button */}
              <Button 
                variant="outline" 
                onClick={handleResetFilters} 
                className="h-10 px-4 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm shrink-0"
              >
                <RotateCcw size={14} />
                Reset Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Table Body listing the resulting entries */}
        <CardContent className="p-0">
          {activeTab === 'detail' ? (
            <div key="detail-table-wrapper">
              <DataTable
                data={filteredDetailReport}
                columns={detailColumns}
                loading={loading}
                showSearch={false} // disabling default full-field search as we configured dedicated custom search
                emptyMessage="Tidak ada rincian detail pemakaian yang ditemukan sesuai dengan kriteria filter."
                className="border-none"
                pageSize={25}
              />
            </div>
          ) : (
            <div key="rekap-table-wrapper">
              <DataTable
                data={usageReportSummary}
                columns={usageSummaryColumns}
                loading={loading}
                showSearch={false}
                emptyMessage="Tidak ada rekap pemakaian yang ditemukan sesuai dengan kriteria filter."
                className="border-none"
                pageSize={25}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
