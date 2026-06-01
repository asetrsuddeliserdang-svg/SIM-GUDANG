import React from "react"
import { Check, ChevronsUpDown, Search, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";

interface Option {
  value: string;
  label: string;
  subLabel?: string;
  original?: any;
}

interface SearchSelectProps {
  options: Option[];
  onSelect: (value: string, original?: any) => void;
  selectedValue?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SearchSelect({ 
  options = [], 
  onSelect, 
  selectedValue, 
  placeholder = "Memilih...",
  searchPlaceholder = "Cari...",
  emptyMessage = "Data tidak ditemukan",
  className,
  disabled = false,
  isLoading = false
}: SearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const selectedOption = React.useMemo(() => 
    options.find((opt) => opt.value === selectedValue),
    [options, selectedValue]
  );

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options.slice(0, 100);
    
    const search = searchValue.toLowerCase();
    return options.filter((opt) => 
      opt.label.toLowerCase().includes(search) || 
      (opt.subLabel || '').toLowerCase().includes(search) ||
      opt.value.toLowerCase().includes(search)
    ).slice(0, 100);
  }, [options, searchValue]);

  const handleSelect = (opt: Option) => {
    onSelect(opt.value, opt.original);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            disabled={disabled || isLoading}
            className={cn(
              "w-full flex items-center justify-between h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-sky-300 transition-all font-normal text-left cursor-pointer",
              !selectedValue && "text-slate-500",
              className
            )}
          />
        }
      >
        {isLoading ? (
           <div className="flex items-center gap-2 text-slate-400">
             <Loader2 size={14} className="animate-spin" />
             <span className="text-xs">Memuat data...</span>
           </div>
        ) : selectedOption ? (
          <div className="flex flex-col items-start truncate leading-tight">
             <span className="text-sm font-bold text-slate-900 truncate">
              {selectedOption.label}
            </span>
            {selectedOption.subLabel && (
              <span className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-tighter">
                {selectedOption.subLabel}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm font-medium">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
      </DialogTrigger>
      
      <DialogContent className="p-0 sm:max-w-[500px] gap-0 overflow-hidden bg-white border-none shadow-2xl rounded-t-[32px] sm:rounded-[32px] max-h-[85vh] flex flex-col">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Search className="text-sky-600" size={20} />
            {placeholder}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full h-12 pl-11 pr-11 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-sky-500/20 font-medium placeholder:text-slate-400"
                placeholder={searchPlaceholder}
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
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {filteredOptions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p className="text-sm font-medium">{emptyMessage}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "flex items-center gap-3 p-4 text-left rounded-2xl transition-all border border-transparent",
                      selectedValue === opt.value ? "bg-sky-50 border-sky-100" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex-1 flex flex-col leading-tight">
                      <span className="font-bold text-sm text-slate-900">
                        {opt.label}
                      </span>
                      {opt.subLabel && (
                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter font-medium mt-0.5">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {selectedValue === opt.value && (
                      <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-white shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
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
