import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Filter,
  MoreHorizontal,
  Download,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  sticky?: 'left' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  pageSize?: number;
  showSearch?: boolean;
  emptyMessage?: string;
  rowKey?: keyof T | string;
  renderExpandedRow?: (item: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Cari data...",
  onRowClick,
  loading = false,
  pageSize = 10,
  showSearch = true,
  emptyMessage = "Tidak ada data ditemukan.",
  rowKey = 'id',
  renderExpandedRow,
  className
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [pageSizeInternal, setPageSizeInternal] = useState(pageSize);

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Sorting logic
  const sortedData = useMemo(() => {
    let items = [...data];
    if (search) {
      items = items.filter(item => 
        Object.values(item as any).some(val => 
          String(val).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    if (sortConfig) {
      items.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [data, search, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / pageSizeInternal);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSizeInternal;
    return sortedData.slice(start, start + pageSizeInternal);
  }, [sortedData, currentPage, pageSizeInternal]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown size={12} className="ml-2 text-slate-300 group-hover:text-slate-400" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} className="ml-2 text-sky-500" /> 
      : <ArrowDown size={12} className="ml-2 text-sky-500" />;
  };

  if (loading) {
    return (
      <div className="w-full space-y-4">
        {showSearch && <div className="h-10 w-64 bg-slate-100 animate-pulse rounded-lg" />}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="h-12 bg-slate-50 border-b border-slate-100" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white border-b border-slate-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showSearch && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={16} />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-10 border-slate-200 bg-white ring-offset-white focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:border-sky-500 rounded-xl transition-all shadow-sm text-xs"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 shrink-0">
              <label htmlFor="pageSize" className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Rows:</label>
              <select 
                id="pageSize"
                value={pageSizeInternal}
                onChange={(e) => {
                  setPageSizeInternal(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                {[10, 25, 50, 100].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <Button variant="outline" size="sm" className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs shrink-0">
               <Download size={14} className="mr-2" />
               EXPORT
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/20 overflow-hidden relative group/table">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] 2xl:max-h-[850px] 3xl:max-h-[1200px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <TableHeader className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-md shadow-sm">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                {columns.map((col, idx) => (
                  <TableHead 
                    key={idx} 
                    className={cn(
                      "sticky top-0 px-3 md:px-5 py-3 md:py-4 text-[9px] md:text-[10px] font-black font-sans uppercase tracking-[0.1em] text-slate-500 border-b border-slate-200 transition-all z-40 bg-slate-50/95",
                      col.sortable && "cursor-pointer select-none hover:text-slate-900 group",
                      col.sticky === 'left' && "z-50 left-0",
                      col.sticky === 'right' && "z-50 right-0",
                      col.className
                    )}
                    style={{ 
                      width: col.width,
                      ...(col.sticky === 'left' ? { position: 'sticky', left: 0 } : {}),
                      ...(col.sticky === 'right' ? { position: 'sticky', right: 0 } : {}),
                      top: 0
                    }}
                    onClick={() => col.sortable && col.accessorKey && handleSort(col.accessorKey as string)}
                  >
                    <div className="flex items-center">
                      {col.header}
                      {col.sortable && col.accessorKey && getSortIcon(col.accessorKey as string)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedData.flatMap((item, rowIdx) => {
                  const id = String((item as any)[rowKey] || rowIdx);
                  const isExpanded = expandedRows.has(id);
 
                  const mainRow = (
                    <tr
                      key={id}
                      className={cn(
                        "group/row border-b border-slate-50 hover:bg-sky-50/30 transition-all cursor-pointer relative",
                        rowIdx % 2 === 1 && "bg-slate-50/30",
                        isExpanded && "bg-sky-50/50"
                      )}
                      onClick={() => {
                        if (renderExpandedRow) {
                          toggleRow(id, {} as any);
                        } else if (onRowClick) {
                          onRowClick(item);
                        }
                      }}
                    >
                      {columns.map((col, colIdx) => (
                        <TableCell 
                          key={colIdx} 
                          className={cn(
                            "px-3 md:px-5 py-2.5 md:py-3 text-[10px] md:text-xs text-slate-600 transition-all font-medium",
                            col.sticky === 'left' && "sticky left-0 bg-white group-hover/row:bg-sky-50/30 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]",
                            col.sticky === 'right' && "sticky right-0 bg-white group-hover/row:bg-sky-50/30 z-10 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]",
                            col.className
                          )}
                          style={{
                            ...(col.sticky === 'left' ? { position: 'sticky', left: 0 } : {}),
                            ...(col.sticky === 'right' ? { position: 'sticky', right: 0 } : {})
                          }}
                        >
                          {col.cell ? col.cell(item) : (item as any)[col.accessorKey as string]}
                        </TableCell>
                      ))}
                    </tr>
                  );
                  
                  if (isExpanded && renderExpandedRow) {
                    return [
                      mainRow,
                      <TableRow key={`${id}-expanded`} className="bg-sky-50/20 hover:bg-sky-50/20 border-b border-sky-100">
                        <TableCell colSpan={columns.length} className="p-0 border-none">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 bg-gradient-to-b from-sky-50/50 to-white border-x border-sky-100 mx-4 my-2 rounded-2xl shadow-inner">
                              {renderExpandedRow(item)}
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    ];
                  }
                  
                  return [mainRow];
                })}
              
              {sortedData.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <AlertCircle size={32} className="text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-bold italic">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="hidden sm:block">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-200 text-slate-600"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-200 text-slate-600"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} />
            </Button>
            
            <div className="flex items-center gap-1 mx-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum = currentPage;
                if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                
                if (pageNum <= 0 || pageNum > totalPages) return null;

                return (
                  <Button
                    key={i}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs font-black",
                      currentPage === pageNum ? "bg-sky-600 shadow-md shadow-sky-100" : "border-slate-200 text-slate-600"
                    )}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-200 text-slate-600"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={14} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-200 text-slate-600"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StockIndicator({ current, min }: { current: number; min: number }) {
  const percentage = Math.min(100, (current / (min * 3)) * 100);
  const isCrtitical = current <= min;
  const isWarning = current <= min * 2 && current > min;

  return (
    <div className="w-24 space-y-1">
      <div className="flex justify-between items-center text-[9px] font-bold uppercase">
        <span className={cn(isCrtitical ? "text-red-500" : isWarning ? "text-amber-500" : "text-emerald-500")}>
          {isCrtitical ? 'Critical' : isWarning ? 'Warning' : 'Good'}
        </span>
        <span className="text-slate-400">{current}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn(
            "h-full rounded-full transition-colors",
            isCrtitical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
          )}
        />
      </div>
    </div>
  );
}
