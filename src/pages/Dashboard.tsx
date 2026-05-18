import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Package, 
  TrendingUp, 
  AlertCircle, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { gasService } from '../services/gasService';
import { MutasiStok, MasterBarang } from '../types';
import { useMasterData } from '../context/MasterDataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

export default function Dashboard() {
  const { barangList: contextBarangList, loading: masterLoading } = useMasterData();
  const [stats, setStats] = useState({
    totalBarang: 0,
    lowStock: 0,
    monthTrxMasuk: 0,
    monthTrxKeluar: 0,
    dailyActivity: [] as { name: string, value: number }[],
    lowStockItems: [] as MasterBarang[]
  });

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Priority: use context data for master stats
    if (contextBarangList.length > 0) {
      const lowStockItems = contextBarangList.filter(b => 
        b.monitor_stok === 'Ya' && 
        Number(b.stok_sekarang) <= Number(b.stok_minimum)
      );
      setStats(prev => ({
        ...prev,
        totalBarang: contextBarangList.length,
        lowStock: lowStockItems.length,
        lowStockItems: lowStockItems.sort((a, b) => {
          // Sort by priority if available
          const priorityMap = { 'Kritis': 3, 'Penting': 2, 'Normal': 1 };
          return (priorityMap[b.prioritas_alert] || 0) - (priorityMap[a.prioritas_alert] || 0);
        }).slice(0, 4)
      }));
    }
  }, [contextBarangList]);

  useEffect(() => {
    const fetchDashboard = async () => {
    setErrorMsg(null);
    if (!import.meta.env.VITE_GAS_WEBAPP_URL) {
      setErrorMsg('VITE_GAS_WEBAPP_URL_MISSING');
      setLoading(false);
      return;
    }
    try {
      const data = await gasService.getDashboard();
        const barangList = (data.barang || []) as MasterBarang[];
        
        const lowStockItems = barangList.filter(b => 
          b.monitor_stok === 'Ya' && 
          Number(b.stok_sekarang) <= Number(b.stok_minimum)
        );

        setStats({
          totalBarang: barangList.length,
          lowStock: lowStockItems.length,
          monthTrxMasuk: (data.headerMasuk || []).length,
          monthTrxKeluar: (data.headerKeluar || []).length,
          dailyActivity: [
            { name: 'Sen', value: 400 },
            { name: 'Sel', value: 300 },
            { name: 'Rab', value: 600 },
            { name: 'Kam', value: 800 },
            { name: 'Jum', value: 500 },
            { name: 'Sab', value: 200 },
            { name: 'Min', value: 100 },
          ],
          lowStockItems: lowStockItems.sort((a, b) => {
            const priorityMap = { 'Kritis': 3, 'Penting': 2, 'Normal': 1 };
            return (priorityMap[b.prioritas_alert] || 0) - (priorityMap[a.prioritas_alert] || 0);
          }).slice(0, 4)
        });
      } catch (err: any) {
        console.error('Failed to fetch dashboard:', err);
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const cards = [
    { title: 'Total Master Barang', value: stats.totalBarang, icon: Package, color: 'text-sky-600', bg: 'bg-sky-50', trend: '+2% dibanding bulan lalu' },
    { title: 'Stok Kritis / Minimum', value: stats.lowStock, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', trend: 'Perlu pengadaan segera' },
    { title: 'Penerimaan (Masuk)', value: stats.monthTrxMasuk, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Faktur Aktif' },
    { title: 'Distribusi (Keluar)', value: stats.monthTrxKeluar, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Unit Terlayani' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      <AnimatePresence>
        {((errorMsg === 'VITE_GAS_WEBAPP_URL_MISSING' || (errorMsg && errorMsg.includes('Konfigurasi')))) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-sky-200 bg-sky-50 shadow-sm overflow-hidden mb-6">
          <div className="bg-sky-600 h-1 w-full"></div>
          <CardContent className="p-6">
            <div className="flex gap-5">
              <div className="w-14 h-14 bg-white text-sky-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-sky-100">
                <Settings size={28} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sky-900 uppercase text-sm tracking-tight">Setup Database Google Sheets</h3>
                  <Badge className="bg-sky-200 text-sky-700 hover:bg-sky-200 text-[9px] font-bold">REQUIRED</Badge>
                </div>
                <p className="text-xs text-sky-800 leading-relaxed max-w-2xl">
                  Sistem ini menggunakan Google Sheets sebagai backend. Anda perlu melakukan <strong>Deploy</strong> pada file <strong>Code.gs</strong> dan memasukkan URL-nya ke pengaturan aplikasi.
                </p>
                <div className="pt-1 flex flex-wrap gap-3">
                   <a 
                    href="https://script.google.com/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[10px] font-bold text-white bg-sky-600 px-4 py-2 rounded-xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-200 uppercase tracking-wider"
                  >
                    1. Buka Apps Script <ExternalLink size={12} />
                  </a>
                  <div className="text-[10px] font-bold text-sky-700 flex items-center bg-white px-4 py-2 rounded-xl border border-sky-200 cursor-default">
                    2. Pasang di Settings &gt; Env Vars
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {errorMsg && errorMsg !== 'VITE_GAS_WEBAPP_URL_MISSING' && !errorMsg.includes('Konfigurasi') && (
        <Card className="border-red-200 bg-red-50 shadow-sm overflow-hidden mb-6">
           <div className="bg-red-500 h-1 w-full"></div>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-white text-red-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-red-100 mt-1">
                  <AlertCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-red-900 uppercase text-xs tracking-tight">Koneksi Backend Bermasalah</h3>
                  <p className="text-xs text-red-800 leading-relaxed max-w-2xl whitespace-pre-line">
                    {errorMsg}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    try {
                      toast.loading('Sedang menginisialisasi database...', { id: 'seed' });
                      await gasService.seedDatabase();
                      toast.success('Database berhasil diinisialisasi!', { id: 'seed' });
                      setTimeout(() => window.location.reload(), 1500);
                    } catch (e: any) {
                      toast.error('Gagal seed database: ' + e.message, { id: 'seed' });
                    }
                  }} 
                  className="bg-white border-red-200 text-red-700 hover:bg-red-100 text-[10px] font-black uppercase rounded-xl h-10 px-6 shadow-sm"
                >
                  Seed Database
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="text-red-700 hover:bg-red-100 text-[10px] font-black uppercase rounded-xl h-10 px-6">
                  Coba Sinkron Ulang
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className={cn(
              "border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative rounded-2xl",
              loading && "opacity-50 pointer-events-none"
            )}>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 z-10">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                </div>
              )}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-[10px] uppercase tracking-widest font-black text-slate-400">{card.title}</CardTitle>
              <div className={`${card.bg} ${card.color} p-2 rounded-xl group-hover:scale-110 transition-transform shrink-0`}>
                <card.icon size={16} />
              </div>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">{card.value}</div>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1 uppercase tracking-tight truncate">
                {card.trend.includes('+') ? <ArrowUpRight size={12} className="text-emerald-500 shrink-0" /> : <AlertCircle size={12} className="text-red-400 shrink-0" />}
                {card.trend}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <motion.div variants={itemVariants} className="lg:col-span-4 translate-z-0 w-full min-w-0">
          <Card className={cn(
            "border border-slate-200 shadow-sm overflow-hidden relative rounded-2xl h-full",
            loading && "opacity-50"
          )}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/10 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
              </div>
            )}
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-700">Volume Penerimaan Barang</CardTitle>
              <CardDescription className="text-[10px] md:text-xs font-medium">Visualisasi aktivitas logistik mingguan</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] md:h-[320px] p-2 md:p-6 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyActivity} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0284c7', fontWeight: 'bold', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-3 h-full">
          <Card className={cn(
            "h-full border border-slate-200 shadow-sm overflow-hidden relative rounded-2xl",
            loading && "opacity-50"
          )}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/10 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
              </div>
            )}
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-700">Peringatan Monitoring Stok</CardTitle>
              <CardDescription className="text-[10px] md:text-xs font-medium">Item dipantau dengan stok dibawah ambang batas</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-6">
            <div className="space-y-3">
              {stats.lowStockItems.length > 0 ? (
                stats.lowStockItems.map((item) => (
                  <div key={item.kode_barang} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all group relative overflow-hidden bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
                    {item.prioritas_alert === 'Kritis' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                    )}
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0",
                      item.prioritas_alert === 'Kritis' ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                    )}>
                      <Package size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 leading-tight truncate uppercase tracking-tight">{item.nama_barang}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-tight font-black mt-1">Stok: <span className="text-slate-900">{item.stok_sekarang}</span> / Min: {item.stok_minimum}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className={cn(
                        "text-[8px] font-black uppercase tracking-tighter border-none px-1.5 py-0.5",
                        item.prioritas_alert === 'Kritis' ? "bg-red-100 text-red-600 shadow-sm shadow-red-50" : 
                        item.prioritas_alert === 'Penting' ? "bg-orange-100 text-orange-600 shadow-sm shadow-orange-50" :
                        "bg-slate-100 text-slate-600 shadow-sm shadow-slate-50"
                      )}>
                        {item.prioritas_alert}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-2">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 shadow-inner">
                    <Package size={24} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semua Stok Aman</p>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-6 h-10 text-[10px] font-black text-sky-600 border-sky-100 hover:bg-sky-50 uppercase tracking-widest rounded-xl transition-all active:scale-95"
              onClick={() => window.location.href = '/reports'}
            >
              Lihat Detail Laporan
            </Button>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Info({ size, className }: { size: number, className?: string }) {
  return <AlertCircle size={size} className={className} />;
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
