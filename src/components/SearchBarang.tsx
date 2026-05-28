import React from "react"
import { Check, ChevronsUpDown, Search, Box, X, Tag, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MasterBarang } from '@/types';
import { Badge } from "@/components/ui/badge";

interface SearchBarangProps {
  barangList: MasterBarang[];
  onSelect: (barang: MasterBarang) => void;
  selectedKode?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SearchBarang({ 
  barangList, 
  onSelect, 
  selectedKode, 
  placeholder = "Pilih / Cari Barang...",
  className,
  disabled = false,
  isLoading = false
}: SearchBarangProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const selectedBarang = React.useMemo(() => 
    (barangList || []).find((b) => b.kode_barang === selectedKode),
    [barangList, selectedKode]
  );

  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    (barangList || []).forEach(b => {
      if (b.kategori) cats.add(b.kategori);
    });
    return Array.from(cats).sort();
  }, [barangList]);

  const filteredList = React.useMemo(() => {
    let list = barangList || [];
    
    if (selectedCategory) {
      list = list.filter(b => b.kategori === selectedCategory);
    }

    if (!searchValue) return list.slice(0, 100);
    
    const search = searchValue.toLowerCase();
    const filtered = list.filter((b) => 
      (b.nama_barang || '').toLowerCase().includes(search) || 
      (b.kode_barang || '').toLowerCase().includes(search) || 
      (b.merk || '').toLowerCase().includes(search) ||
      (b.kategori || '').toLowerCase().includes(search)
    );
    
    return filtered.slice(0, 100);
  }, [barangList, searchValue, selectedCategory]);

  const handleSelect = (barang: MasterBarang) => {
    onSelect(barang);
    setOpen(false);
    setSearchValue("");
    setSelectedCategory(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center justify-between h-auto py-3 px-4 text-left bg-white border border-slate-200 rounded-2xl hover:border-sky-300 transition-all shadow-sm group disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          disabled={disabled || isLoading}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-sky-500 group-hover:bg-sky-50 transition-colors">
              <Search size={18} />
            </div>
            <div className="flex flex-col gap-0.5 truncate leading-tight">
              {isLoading ? (
                <span className="text-sm text-slate-400 font-medium">Memuat data...</span>
              ) : selectedBarang ? (
                <>
                  <span className="font-bold text-slate-900 text-sm truncate">
                    {selectedBarang.nama_barang}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <span className="text-sky-600 px-1 bg-sky-50 rounded uppercase font-bold">{selectedBarang.kode_barang}</span>
                    <span className="flex items-center gap-1">
                      <Box size={10} className="text-slate-300" />
                      Stok: {selectedBarang.stok_sekarang} {selectedBarang.satuan}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-sm font-medium text-slate-500">{placeholder}</span>
              )}
            </div>
          </div>
          <ChevronsUpDown size={16} className="text-slate-300" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="p-0 sm:max-w-[600px] gap-0 overflow-hidden bg-white border-none shadow-2xl rounded-t-[32px] sm:rounded-[32px] max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Search className="text-sky-600" size={20} />
            Cari Barang
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full h-12 pl-11 pr-11 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-sky-500/20 font-medium placeholder:text-slate-400"
                placeholder="Cari nama, kode, atau merk..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                autoFocus
              />
              {searchValue && (
                <button 
                  onClick={() => setSearchValue("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-slate-200 text-slate-500 rounded-full hover:bg-slate-300 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto no-scrollbar">
              <Badge 
                variant={selectedCategory === null ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                  selectedCategory === null ? "bg-sky-600 hover:bg-sky-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                )}
                onClick={() => setSelectedCategory(null)}
              >
                Semua
              </Badge>
              {categories.map(cat => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap",
                    selectedCategory === cat ? "bg-sky-600 hover:bg-sky-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 scroll-smooth">
            {filteredList.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                  <Search size={32} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">Barang Tidak Ditemukan</p>
                  <p className="text-xs text-slate-500">Coba gunakan kata kunci lain atau pilih kategori berbeda.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 p-2">
                {filteredList.map((barang) => (
                  <button
                    key={barang.kode_barang}
                    onClick={() => handleSelect(barang)}
                    className={cn(
                      "group flex flex-col items-start gap-2 p-4 text-left rounded-2xl transition-all border border-transparent hover:border-sky-100",
                      selectedKode === barang.kode_barang ? "bg-sky-50 shadow-sm border-sky-200" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex justify-between w-full items-start gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-xs text-sky-600 uppercase tracking-widest leading-none mb-1">
                          {barang.kode_barang}
                        </span>
                        <span className="font-bold text-sm lg:text-base text-slate-900 leading-tight">
                          {barang.nama_barang}
                        </span>
                      </div>
                      {selectedKode === barang.kode_barang && (
                        <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-white shrink-0">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-slate-100">
                        <Box size={10} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-700">
                          Stok: {barang.stok_sekarang} {barang.satuan}
                        </span>
                      </div>
                      {barang.kategori && (
                        <div className="flex items-center gap-1.5 bg-slate-100/50 px-2 py-0.5 rounded">
                          <Tag size={10} className="text-slate-400" />
                          <span className="text-[10px] font-medium text-slate-500 uppercase">
                            {barang.kategori}
                          </span>
                        </div>
                      )}
                      {barang.merk && (
                        <span className="text-[10px] text-slate-400 italic">
                          Merk: {barang.merk}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
