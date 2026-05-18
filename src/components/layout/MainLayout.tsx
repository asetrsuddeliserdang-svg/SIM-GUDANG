import React, { useState, useEffect } from 'react';
import { 
  NavLink, 
  Outlet, 
  useNavigate,
  useLocation
} from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  BarChart3,
  Building2,
  Truck,
  Users, 
  Settings, 
  LogOut, 
  Hospital,
  Menu,
  ClipboardList,
  ChevronRight,
  FileText,
  History,
  X,
  Share2,
  Home,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';
import { gasService } from '../../services/gasService';
import { useAuth } from '../../context/AuthContext';

import { NotificationBell } from './NotificationBell';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin, isGudang, isUnit, isDirektur } = useAuth();
  const userName = user?.name || "User";
  const userRole = user?.role || "GUEST";
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check connection periodically
    const checkConnection = async () => {
      const ok = await gasService.testConnection();
      setIsOnline(ok);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Sistem';
    if (path.startsWith('/master')) return 'Master Data & Supplier';
    if (path === '/incoming') return 'Barang Masuk';
    if (path === '/outgoing') return 'Barang Keluar';
    if (path === '/requests') return 'Persetujuan Order';
    if (path === '/mutation') return 'Mutasi Stok';
    if (path === '/stock-card') return 'Kartu Stok';
    if (path === '/reports') return 'Laporan Stok';
    if (path === '/report-usage') return 'Laporan Pemakaian';
    if (path === '/report-supplier') return 'Laporan Supplier';
    return 'Halaman';
  };

  const handleLogout = async () => {
    logout();
    navigate('/auth');
  };

  const menuSections = [
    {
      title: 'Utama',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, visible: true },
      ]
    },
    {
      title: 'Master Data',
      visible: isAdmin,
      items: [
        { name: 'Data Barang', path: '/master', icon: Package, visible: isAdmin },
        { name: 'Supplier', path: '/master?tab=supplier', icon: Truck, visible: isAdmin },
      ]
    },
    {
      title: 'Transaksi',
      items: [
        { name: 'Saldo Awal', path: '/opening-balance', icon: History, visible: isGudang },
        { name: 'Barang Masuk', path: '/incoming', icon: Truck, visible: isGudang },
        { name: 'Barang Keluar', path: '/outgoing', icon: Home, visible: isGudang },
        { name: 'Persetujuan Order', path: '/requests', icon: ClipboardList, visible: isGudang || isUnit },
        { name: 'Mutasi Stok', path: '/mutation', icon: ArrowLeftRight, visible: isGudang },
        { name: 'Kartu Stok', path: '/stock-card', icon: FileText, visible: isGudang },
      ]
    },
    {
      title: 'Laporan',
      visible: isGudang || isDirektur,
      items: [
        { name: 'Stok Persediaan', path: '/reports', icon: BarChart3, visible: isGudang || isDirektur },
        { name: 'Pemakaian Per Unit', path: '/report-usage', icon: Building2, visible: isGudang || isDirektur },
        { name: 'Rekap Supplier', path: '/report-supplier', icon: Truck, visible: isGudang || isDirektur },
      ]
    }
  ];

  const filteredMenuSections = menuSections.filter(s => s.visible !== false).map(s => ({
    ...s,
    items: s.items.filter(i => i.visible !== false)
  })).filter(s => s.items.length > 0);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-[#111827] text-white flex flex-col transition-all duration-300 z-50",
        "fixed inset-y-0 left-0 md:relative md:translate-x-0 outline-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className={cn(
          "p-6 border-b border-slate-800 flex items-center justify-between transition-all",
          isSidebarCollapsed && "p-4 justify-center"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg shrink-0">
              <Hospital size={24} />
            </div>
            {!isSidebarCollapsed && (
              <div className="animate-in fade-in duration-500">
                <h1 className="text-sm font-bold leading-tight">SIM-GUDANG</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">RSUD Professional</p>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="md:hidden text-slate-400" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </Button>
        </div>
        
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {filteredMenuSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-2 pb-2 text-[10px] uppercase font-bold text-slate-500 tracking-widest animate-in fade-in duration-500">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                    isSidebarCollapsed && "justify-center px-0",
                    isActive 
                      ? "bg-sky-600 text-white shadow-md shadow-sky-900/20" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  <item.icon size={18} className={cn("transition-colors shrink-0", "group-hover:text-white")} />
                  {!isSidebarCollapsed && (
                    <span className="truncate animate-in fade-in slide-in-from-left-1 duration-300">
                      {item.name}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={cn(
          "p-4 border-t border-slate-800 bg-[#0a0f1a] transition-all",
          isSidebarCollapsed && "p-4 flex flex-col items-center"
        )}>
          <div className={cn("flex items-center gap-3 px-1 py-1 w-full", isSidebarCollapsed && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 text-white font-bold text-xs shrink-0">
              {userName.charAt(0)}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden animate-in fade-in duration-500">
                <p className="text-xs font-semibold text-slate-200 truncate">{userName}</p>
                <p className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border inline-block mt-1",
                  userRole === 'ADMIN' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                  userRole === 'GUDANG' ? "bg-sky-500/10 text-sky-500 border-sky-500/20" :
                  userRole === 'DIREKTUR' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                  "bg-slate-500/10 text-slate-400 border-slate-500/20"
                )}>
                  {userRole}
                </p>
              </div>
            )}
            {!isSidebarCollapsed && (
              <Button 
                variant="ghost" 
                size="icon"
                className="text-slate-500 hover:text-red-400 hover:bg-transparent h-8 w-8 animate-in fade-in duration-500"
                onClick={handleLogout}
              >
                <LogOut size={16} />
              </Button>
            )}
          </div>
          {isSidebarCollapsed && (
            <Button 
              variant="ghost" 
              size="icon"
              className="text-slate-500 hover:text-red-400 hover:bg-transparent h-8 w-8 mt-4"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Offline Banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-600 text-white overflow-hidden shrink-0 z-50 shadow-lg"
            >
              <div className="px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <WifiOff size={16} className="animate-pulse shrink-0" />
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Koneksi Backend Terputus</p>
                    <p className="text-[9px] font-medium text-red-100 italic opacity-80 mt-1">Gagal terhubung ke Google Apps Script.</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="h-7 text-[9px] font-black uppercase text-white hover:bg-white/10 border border-white/20 px-3 w-full sm:w-auto"
                >
                  Refresh Halaman
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="h-16 md:h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-6 shrink-0 shadow-sm z-10 transition-all">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={20} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors shrink-0"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <Menu size={20} />
            </Button>
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400 font-medium truncate">
              <span className="hover:text-sky-600 cursor-pointer transition-colors hidden xs:inline" onClick={() => navigate('/')}>Utama</span>
              <ChevronRight size={12} className="hidden xs:inline shrink-0" />
              <span className="text-slate-800 font-black uppercase tracking-tight truncate">{getBreadcrumb()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
             <div className="hidden sm:flex flex-col items-end mr-1 md:mr-2">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Backend Online</span>
                    </div>
                  ) : (
                    <div className="hidden lg:flex items-center gap-1.5 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-[8px] font-black text-red-600 uppercase tracking-tighter">Backend Offline</span>
                    </div>
                  )}
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 font-bold uppercase text-[8px] md:text-[9px] tracking-widest hidden xs:inline">Waktu Server</span>
                    <span className="text-slate-800 tracking-tight font-black text-[9px] md:text-[10px]">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                  </div>
                </div>
             </div>
             
             <NotificationBell />

             <Separator orientation="vertical" className="h-6 mx-0.5 md:mx-1 bg-slate-200 hidden xs:block" />
             
             <div className="flex h-8 w-8 md:h-9 md:w-9 rounded-xl bg-sky-600 items-center justify-center text-white font-black text-xs md:text-sm shadow-lg shadow-sky-100 shrink-0">
               {userName.charAt(0)}
             </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto bg-[#f8fafc] p-3 sm:p-5 md:p-6 lg:p-8 xl:p-10 2xl:p-12 3xl:p-16 4xl:p-20 custom-scrollbar">
          <div className="w-full max-w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
