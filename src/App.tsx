import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import Auth from './pages/Auth';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import MasterData from './pages/MasterData';
import BarangMasuk from './pages/BarangMasuk';
import BarangKeluar from './pages/BarangKeluar';
import SaldoAwal from './pages/SaldoAwal';
import Mutation from './pages/Mutation';
import StockCard from './pages/StockCard';
import ReportStock from './pages/ReportStock';
import ReportUsage from './pages/ReportUsage';
import ReportSupplier from './pages/ReportSupplier';
import PublicRequest from './pages/PublicRequest';
import RequestManagement from './pages/RequestManagement';
import { Toaster } from './components/ui/sonner';
import { MasterDataProvider } from './context/MasterDataContext';
import { NotificationProvider } from './context/NotificationContext';

import { ThemeProvider } from 'next-themes';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Memuat SIMPERGUD...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <MasterDataProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/request" element={<PublicRequest />} />
            <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />

            {/* Protected Routes */}
            {user ? (
              <Route element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="master" element={<MasterData />} />
                <Route path="incoming" element={<BarangMasuk />} />
                <Route path="outgoing" element={<BarangKeluar />} />
                <Route path="requests" element={<RequestManagement />} />
                <Route path="opening-balance" element={<SaldoAwal />} />
                <Route path="mutation" element={<Mutation />} />
                <Route path="stock-card" element={<StockCard />} />
                <Route path="reports" element={<ReportStock />} />
                <Route path="report-usage" element={<ReportUsage />} />
                <Route path="report-supplier" element={<ReportSupplier />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            ) : (
              <Route path="*" element={<Navigate to="/auth" replace />} />
            )}
          </Routes>
          <Toaster />
        </NotificationProvider>
      </MasterDataProvider>
    </BrowserRouter>
  );
}
