import React from "react"
import { Check, ChevronsUpDown, Search, Package, Box, MapPin, Tag, Loader2 } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MasterBarang } from '@/types';

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

  const selectedBarang = React.useMemo(() => 
    (barangList || []).find((b) => b.kode_barang === selectedKode),
    [barangList, selectedKode]
  );

  const filteredList = React.useMemo(() => {
    if (!searchValue) return (barangList || []).slice(0, 50);
    
    const search = searchValue.toLowerCase();
    const filtered = (barangList || []).filter((b) => 
      (b.nama_barang || '').toLowerCase().includes(search) || 
      (b.kode_barang || '').toLowerCase().includes(search) || 
      (b.merk || '').toLowerCase().includes(search)
    );
    
    return filtered.slice(0, 50);
  }, [barangList, searchValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline", className: "w-full justify-between h-auto py-2 px-3 text-left font-normal border-slate-200 hover:bg-slate-50 transition-all" }),
          !selectedKode && "text-slate-500",
          className
        )}
      >
        <div className="flex flex-col gap-0.5 truncate flex-1 leading-normal">
          {isLoading ? (
             <div className="flex items-center gap-2 text-slate-400">
               <Loader2 size={14} className="animate-spin" />
               <span className="text-sm">Memuat data barang...</span>
             </div>
          ) : selectedBarang ? (
            <>
              <span className="font-bold text-slate-900 text-[13px] truncate">
                {selectedBarang.nama_barang}
              </span>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <span className="bg-sky-50 text-sky-700 px-1 rounded font-bold">{selectedBarang.kode_barang}</span>
                <span className="flex items-center gap-1">
                  <Box size={10} className="text-slate-400" />
                  Stok: {selectedBarang.stok_sekarang} {selectedBarang.satuan}
                </span>
              </div>
            </>
          ) : (
            <span className="text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[var(--radix-popover-trigger-width)]" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Ketik Nama, Kode, atau Merk..." 
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-10 text-sm"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-slate-500">
              <div className="flex flex-col items-center gap-2">
                <Search size={20} className="text-slate-200" />
                <p className="text-xs">Barang tidak ditemukan</p>
              </div>
            </CommandEmpty>
            <CommandGroup heading="Barang Tersedia">
              {filteredList.map((barang) => (
                <CommandItem
                  key={barang.kode_barang}
                  value={barang.kode_barang}
                  onSelect={() => {
                    onSelect(barang);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="flex flex-col items-start gap-1 py-3 px-4 cursor-pointer data-[selected=true]:bg-sky-50"
                >
                  <div className="flex justify-between w-full items-start">
                    <span className="font-bold text-[13px] text-slate-900 leading-tight">
                      {barang.kode_barang} | {barang.nama_barang}
                    </span>
                    {selectedKode === barang.kode_barang && (
                      <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-1">
                    <Box size={10} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-sky-700">
                      Stok: {barang.stok_sekarang} {barang.satuan}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {(barangList || []).length > 50 && !searchValue && (
              <div className="px-4 py-2 border-t bg-slate-50/50 text-center">
                <p className="text-[10px] text-slate-400 italic">Ketik untuk mencari lebih lanjut...</p>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
