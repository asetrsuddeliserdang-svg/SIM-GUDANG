import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { gasService } from '../services/gasService';
import { MasterBarang, Supplier, Satuan, Unit } from '../types';

interface MasterDataContextType {
  barangList: MasterBarang[];
  supplierList: Supplier[];
  satuanList: Satuan[];
  unitList: Unit[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export function MasterDataProvider({ children }: { children: React.ReactNode }) {
  const [barangList, setBarangList] = useState<MasterBarang[]>([]);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [satuanList, setSatuanList] = useState<Satuan[]>([]);
  const [unitList, setUnitList] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(0);

  const fetchData = useCallback(async (force = false) => {
    // Basic cache: only fetch if not fetched in last 30 seconds or forced
    const now = Date.now();
    if (!force && lastFetched > 0 && now - lastFetched < 30000) {
      return;
    }

    if (!import.meta.env.VITE_GAS_WEBAPP_URL) {
      setError('VITE_GAS_WEBAPP_URL_MISSING');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await gasService.getMasters();
      setBarangList(data.barang || []);
      setSupplierList(data.supplier || []);
      setSatuanList(data.satuan || []);
      setUnitList(data.unit || []);
      setLastFetched(Date.now());
    } catch (err: any) {
      console.error('Failed to fetch master data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lastFetched]);

  useEffect(() => {
    fetchData();
  }, []);

  const refreshData = async () => {
    await fetchData(true);
  };

  return (
    <MasterDataContext.Provider value={{
      barangList,
      supplierList,
      satuanList,
      unitList,
      loading,
      error,
      refreshData
    }}>
      {children}
    </MasterDataContext.Provider>
  );
}

export function useMasterData() {
  const context = useContext(MasterDataContext);
  if (context === undefined) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
}
