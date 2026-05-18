import React from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { Button, buttonVariants } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger 
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all rounded-xl"
        )}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden border-slate-200 shadow-2xl rounded-2xl" align="end">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-800">Notifikasi</h3>
            {unreadCount > 0 && (
              <span className="bg-sky-100 text-sky-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {unreadCount} Baru
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-slate-400 hover:text-sky-600 rounded-lg"
              title="Tandai semua dibaca"
              onClick={markAllAsRead}
            >
              <Check size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-slate-400 hover:text-red-500 rounded-lg"
              title="Hapus semua"
              onClick={clearAll}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
        
        <div className="max-h-[350px] overflow-y-auto overflow-x-hidden custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                <Bell size={24} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Belum ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={cn(
                    "p-4 transition-all hover:bg-slate-50 relative group cursor-pointer",
                    !notif.isRead && "bg-sky-50/30"
                  )}
                  onClick={() => markAsRead(notif.id)}
                >
                  {!notif.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500" />
                  )}
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      notif.type === 'request' ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-600"
                    )}>
                      {notif.type === 'request' ? <ExternalLink size={14} /> : <Bell size={14} />}
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate leading-tight">
                          {notif.title}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(notif.time), { addSuffix: true, locale: id })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.link && (
                        <Link 
                          to={notif.link} 
                          className="inline-flex items-center gap-1 text-[10px] font-black text-sky-600 uppercase hover:underline mt-1"
                        >
                          Buka Link
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
             <Link to="/requests" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-sky-600 transition-colors">
               Lihat Semua Transaksi
             </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
