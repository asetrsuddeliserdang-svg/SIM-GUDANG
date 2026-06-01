import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { gasService } from '../services/gasService';
import { toast } from 'sonner';
import { Bell, AlertCircle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'request' | 'system' | 'stock';
  isRead: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  checkNewRequests: () => Promise<void>;
  checkStockAlerts: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Use a ref to access current notifications state from within stable useCallbacks
  const notificationsRef = useRef<Notification[]>(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const checkNewRequests = useCallback(async () => {
    try {
      const pending: any[] = await gasService.getPermintaanPending();
      const currentNotifications = notificationsRef.current;
      
      // Filter out requests we already have notifications for
      const newRequests = pending.filter(p => !currentNotifications.some(n => n.id === p.id_permintaan));
      
      if (newRequests.length > 0) {
        const newNotifications: Notification[] = newRequests.map(p => ({
          id: p.id_permintaan,
          title: 'Permintaan Barang Baru',
          message: `Dari Unit ${p.unit_nama} (${p.item_count} item)`,
          time: new Date().toISOString(),
          type: 'request',
          isRead: false,
          link: '/requests'
        }));

        setNotifications(prev => {
          const combined = [...newNotifications, ...prev];
          // Ensure unique IDs
          const uniqueIds = new Set();
          return combined.filter(n => {
            if (uniqueIds.has(n.id)) return false;
            uniqueIds.add(n.id);
            return true;
          });
        });

        // Show toast for the latest one
        if (newRequests.length === 1) {
          toast(`Permintaan Baru: ${newRequests[0].unit_nama}`, {
            description: `${newRequests[0].item_count} item perlu direview.`,
            icon: <Bell size={16} className="text-sky-500" />,
            action: {
              label: 'Review',
              onClick: () => window.location.href = '/requests'
            }
          });
        } else {
          toast(`${newRequests.length} Permintaan Baru`, {
            description: `Beberapa unit telah mengajukan permintaan barang.`,
            icon: <Bell size={16} className="text-sky-500" />,
            action: {
              label: 'Lihat Semua',
              onClick: () => window.location.href = '/requests'
            }
          });
        }
      }
    } catch (error: any) {
      if (error.message?.includes('terhubung') || error.message?.includes('simultan') || error.message?.includes('Google Sheets')) {
        console.warn('Request list poll skipped: Backend is concurrent-busy or unreachable.');
      } else {
        console.error('Failed to poll notifications:', error);
      }
    }
  }, []);

  const checkStockAlerts = useCallback(async () => {
    try {
      const data = await gasService.getMasters();
      const barang: any[] = data.barang || [];
      
      const lowStockItems = barang.filter(b => 
        b.monitor_stok === 'Ya' && 
        Number(b.stok_sekarang) <= Number(b.stok_minimum) &&
        (b.prioritas_alert === 'Penting' || b.prioritas_alert === 'Kritis')
      );

      const currentNotifications = notificationsRef.current;
      // Unique ID for stock notifications to avoid duplicates on every poll
      const newAlerts = lowStockItems.filter(item => 
        !currentNotifications.some(n => n.id === `stock-${item.kode_barang}-${item.stok_sekarang}`)
      );

      if (newAlerts.length > 0) {
        const stockNotifications: Notification[] = newAlerts.map(item => ({
          id: `stock-${item.kode_barang}-${item.stok_sekarang}`,
          title: `Stok ${item.prioritas_alert === 'Kritis' ? 'KRITIS' : 'Menipis'}`,
          message: `${item.nama_barang} sisa ${item.stok_sekarang} ${item.satuan} (Min: ${item.stok_minimum})`,
          time: new Date().toISOString(),
          type: 'stock',
          isRead: false,
          link: '/master'
        }));

        setNotifications(prev => {
          const combined = [...stockNotifications, ...prev];
          // Ensure unique IDs
          const uniqueIds = new Set();
          return combined.filter(n => {
            if (uniqueIds.has(n.id)) return false;
            uniqueIds.add(n.id);
            return true;
          });
        });

        const seenToasts = new Set();
        newAlerts.forEach(item => {
          const toastId = `stock-${item.kode_barang}`;
          if (seenToasts.has(toastId)) return;
          seenToasts.add(toastId);

          toast(`Stok ${item.prioritas_alert === 'Kritis' ? 'KRITIS' : 'MENIPIS'}: ${item.nama_barang}`, {
            description: `Sisa ${item.stok_sekarang} ${item.satuan}. Segera lakukan pemesanan!`,
            icon: <AlertCircle size={16} className={item.prioritas_alert === 'Kritis' ? "text-red-500" : "text-orange-500"} />,
            duration: item.prioritas_alert === 'Kritis' ? 8000 : 5000,
          });
        });
      }
    } catch (error: any) {
      if (error.message?.includes('terhubung') || error.message?.includes('simultan') || error.message?.includes('Google Sheets')) {
        console.warn('Stock alert poll skipped: Backend is concurrent-busy or unreachable.');
      } else {
        console.error('Failed to poll stock alerts:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkNewRequests();
    checkStockAlerts();
    
    // Poll every 180 seconds (3 minutes) to avoid rate limits
    const interval = setInterval(() => {
      checkNewRequests();
      checkStockAlerts();
    }, 180000);
    return () => clearInterval(interval);
  }, [checkNewRequests, checkStockAlerts]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll, checkNewRequests, checkStockAlerts }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
