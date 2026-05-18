import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  FileText,
  ArrowUpRight,
  Calendar,
  Truck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { gasService } from '../services/gasService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DataTable, Column } from '../components/DataTable';

export default function ReportSupplier() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await gasService.getReportsData();
      setData(res);
    } catch (err) {
      toast.error("Gagal memuat rekap supplier");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const supplierSummary = useMemo(() => {
    if (!data) return [];
    
    const headers = data.headerMasuk || [];
    const suppliers = data.supplier || [];
    
    const summary: Record<string, any> = {};
    
    // Initialize with all suppliers
    suppliers.forEach((s: any) => {
      summary[s.nama_supplier] = {
        nama_supplier: s.nama_supplier,
        id_supplier: s.id_supplier,
        total_transaksi: 0,
        total_pembelian: 0,
        terakhir_pasok: '-'
      };
    });

    // Aggregate from transactions
    headers.forEach((h: any) => {
      const name = h.supplier;
      if (!summary[name]) {
        summary[name] = {
          nama_supplier: name,
          id_supplier: '-',
          total_transaksi: 0,
          total_pembelian: 0,
          terakhir_pasok: h.tanggal
        };
      }
      
      summary[name].total_transaksi += 1;
      summary[name].total_pembelian += Number(h.total) || 0;
      
      // Update latest date
      if (summary[name].terakhir_pasok === '-' || new Date(h.tanggal) > new Date(summary[name].terakhir_pasok)) {
        summary[name].terakhir_pasok = h.tanggal;
      }
    });
    
    return Object.values(summary).sort((a, b) => b.total_pembelian - a.total_pembelian);
  }, [data]);

  const filteredReport = useMemo(() => {
    return supplierSummary.filter((item: any) => 
      item.nama_supplier.toLowerCase().includes(search.toLowerCase()) ||
      item.id_supplier.toLowerCase().includes(search.toLowerCase())
    );
  }, [supplierSummary, search]);

  const supplierColumns: Column<any>[] = [
    {
      header: 'Supplier',
      accessorKey: 'nama_supplier',
      sortable: true,
      sticky: 'left',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{item.nama_supplier}</span>
          <span className="text-[10px] text-slate-400 font-black font-mono tracking-tighter">ID: {item.id_supplier}</span>
        </div>
      )
    },
    {
      header: 'Total Transaksi',
      accessorKey: 'total_transaksi',
      sortable: true,
      className: 'text-center',
      cell: (item) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest italic">
           {item.total_transaksi} Trx
        </span>
      )
    },
    {
      header: 'Total Nilai Pengadaan',
      accessorKey: 'total_pembelian',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-slate-900 bg-sky-50 text-sky-700 px-3 py-1 rounded-lg border border-sky-100 italic">
            {formatCurrency(item.total_pembelian)}
          </span>
          <div className="flex items-center gap-1 text-emerald-600 font-black text-[8px] uppercase tracking-widest mt-1 opacity-70">
            <ArrowUpRight size={10} />
            Verified Value
          </div>
        </div>
      )
    },
    {
      header: 'Terakhir Pasok',
      accessorKey: 'terakhir_pasok',
      sortable: true,
      className: 'text-center',
      cell: (item) => (
        <div className="flex items-center justify-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
           <Calendar size={12} className="text-slate-400" />
           <span className="text-[10px] text-slate-600 font-black font-mono tracking-tight">{item.terakhir_pasok}</span>
        </div>
      )
    }
  ];

  const handleExportCSV = () => {
    const headers = ['ID Supplier', 'Nama Supplier', 'Total Transaksi', 'Total Pembelian', 'Terakhir Pasok'];
    const rows = filteredReport.map((i: any) => [
      i.id_supplier,
      i.nama_supplier,
      i.total_transaksi,
      i.total_pembelian,
      i.terakhir_pasok
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Supplier_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4') as any;
    
    doc.setFontSize(18);
    doc.text('LAPORAN DATA SUPPLIER', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`RSUD DELI SERDANG - UNIT LOGISTIK`, 14, 30);
    doc.text(`Tanggal Cetak: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 35);

    const tableRows = filteredReport.map((item: any) => [
      item.nama_supplier,
      item.id_supplier,
      item.total_transaksi,
      formatCurrency(item.total_pembelian),
      item.terakhir_pasok
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Supplier', 'ID Supplier', 'Total Trx', 'Total Nilai', 'Terakhir Pasok']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
      styles: { fontSize: 8 }
    });

    doc.save(`RekapSupplier_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success("Berhasil mengekspor PDF");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-100 transform -rotate-1">
            <Truck size={28} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Rekap <span className="text-indigo-600 italic">Supplier</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic opacity-70">
              Vendor Scorecard & Procurement Analytics RSUD
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchData} disabled={loading} className="border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest h-11 px-6 rounded-xl shadow-sm bg-white hover:bg-slate-50">
            <Calendar size={16} className="mr-2" />
            Refresh Data
          </Button>
          <Button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-11 px-6 rounded-xl shadow-2xl shadow-emerald-200 transition-all active:scale-95">
            <Download size={16} className="mr-2" />
            CSV
          </Button>
          <Button onClick={handleExportPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest h-11 px-6 rounded-xl shadow-2xl shadow-indigo-200 transition-all active:scale-95">
            <FileText size={16} className="mr-2" />
            PDF
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-[2.5rem]">
        <CardContent className="p-0">
          <DataTable
            data={supplierSummary}
            columns={supplierColumns}
            loading={loading}
            searchPlaceholder="Cari berdasarkan nama supplier atau ID..."
            emptyMessage="Belum ada data supplier yang tercatat dalam master data."
          />
        </CardContent>
      </Card>
    </div>
  );
}
