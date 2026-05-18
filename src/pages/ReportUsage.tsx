import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Download, 
  FileText,
  ArrowDownRight, 
  Calendar 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { gasService } from '../services/gasService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SearchSelect } from '@/components/SearchSelect';
import { DataTable, Column } from '../components/DataTable';

export default function ReportUsage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [unitFilter, setUnitFilter] = useState('ALL');

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

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4') as any;
    
    doc.setFontSize(18);
    doc.text('LAPORAN PEMAKAIAN PER UNIT', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`RSUD DELI SERDANG - UNIT LOGISTIK`, 14, 30);
    doc.text(`Unit: ${unitFilter === 'ALL' ? 'SEMUA UNIT' : unitFilter}`, 14, 35);
    doc.text(`Tanggal Cetak: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 40);

    const tableRows = filteredReport.map((item: any) => [
      item.unit_nama,
      item.nama_barang,
      item.satuan,
      item.total_qty
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Nama Unit', 'Nama Barang', 'Satuan', 'Pemakaian']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] }, // orange-600
      styles: { fontSize: 8 }
    });

    doc.save(`LaporanPemakaian_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success("Berhasil mengekspor PDF");
  };

  useEffect(() => {
    fetchData();
  }, []);

  const unitList = useMemo(() => {
    if (!data?.unit) return ['ALL'];
    const units = data.unit.map((u: any) => u.id_unit);
    return ['ALL', ...Array.from(new Set(units))].sort();
  }, [data]);

  const usageReport = useMemo(() => {
    if (!data) return [];
    
    const report: any[] = [];
    const headers = data.headerKeluar || [];
    const details = data.detailKeluar || [];
    
    // Group by Unit and Item
    const grouped: Record<string, Record<string, any>> = {};
    
    headers.forEach((h: any) => {
      details.filter((d: any) => d.id_transaksi === h.id_transaksi).forEach((d: any) => {
        const unitId = h.unit_id;
        const kodeBarang = d.kode_barang;
        const key = `${unitId}_${kodeBarang}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            unit_id: h.unit_id,
            unit_nama: h.unit_nama,
            kode_barang: d.kode_barang,
            nama_barang: d.nama_barang,
            satuan: d.satuan,
            total_qty: 0
          };
        }
        grouped[key].total_qty += Number(d.qty) || 0;
      });
    });
    
    return Object.values(grouped);
  }, [data]);

  const filteredReport = useMemo(() => {
    return usageReport.filter((item: any) => {
      const matchUnit = unitFilter === 'ALL' || item.unit_id === unitFilter;
      return matchUnit;
    });
  }, [usageReport, unitFilter]);

  const usageColumns: Column<any>[] = [
    {
      header: 'Nama Unit',
      accessorKey: 'unit_nama',
      sortable: true,
      sticky: 'left',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.unit_nama}</span>
          <span className="text-[10px] text-slate-400 font-black font-mono">ID: {item.unit_id}</span>
        </div>
      )
    },
    {
      header: 'Informasi Barang',
      accessorKey: 'nama_barang',
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{item.nama_barang}</span>
          <span className="text-[10px] text-sky-600 font-black font-mono tracking-tighter">{item.kode_barang}</span>
        </div>
      )
    },
    {
      header: 'Satuan',
      accessorKey: 'satuan',
      sortable: true,
      cell: (item) => <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.satuan}</span>
    },
    {
      header: 'Total Pemakaian',
      accessorKey: 'total_qty',
      sortable: true,
      className: 'text-center',
      cell: (item) => (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-lg border border-orange-100 italic transition-transform hover:scale-105">
          <ArrowDownRight size={12} className="shrink-0" />
          <span className="text-sm font-black font-mono">{item.total_qty}</span>
        </div>
      )
    }
  ];

  const handleExportCSV = () => {
    const headers = ['Unit ID', 'Nama Unit', 'Kode Barang', 'Nama Barang', 'Satuan', 'Total Pemakaian'];
    const rows = filteredReport.map((i: any) => [
      i.unit_id,
      i.unit_nama,
      i.kode_barang,
      i.nama_barang,
      i.satuan,
      i.total_qty
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Pemakaian_Unit_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
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
            Rekap distribusi barang ke unit-unit pelayanan.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading} className="border-slate-200 text-slate-600 font-bold text-xs h-10 px-4 rounded-xl shadow-sm">
            <Calendar size={16} className="mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-orange-200/50">
            <Download size={16} className="mr-2" />
            CSV
          </Button>
          <Button onClick={handleExportPDF} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-lg shadow-amber-200/50">
            <FileText size={16} className="mr-2" />
            PDF
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden rounded-[2rem]">
        <CardHeader className="p-8 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-100">
                    <Building2 size={20} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Filter Unit</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Saring data distribusi berdasarkan unit pelayanan</p>
                 </div>
               </div>
            </div>
            
            <SearchSelect 
              options={[
                { value: 'ALL', label: 'SEMUA UNIT' },
                ...(data?.unit?.map((u: any) => ({
                  value: u.id_unit,
                  label: u.nama_unit.toUpperCase(),
                  subLabel: u.bidang
                })) || [])
              ]}
              selectedValue={unitFilter}
              onSelect={setUnitFilter}
              placeholder="Pilih Unit..."
              className="h-10 w-[280px] bg-slate-50 border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <DataTable
            data={filteredReport}
            columns={usageColumns}
            loading={loading}
            searchPlaceholder="Cari berdasarkan unit atau nama barang..."
            emptyMessage="Belum ada data distribusi ke unit yang ditemukan."
            className="border-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}
