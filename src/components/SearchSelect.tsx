import React from "react"
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react';
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
    if (!searchValue) return options.slice(0, 50);
    
    const search = searchValue.toLowerCase();
    return options.filter((opt) => 
      opt.label.toLowerCase().includes(search) || 
      (opt.subLabel || '').toLowerCase().includes(search) ||
      opt.value.toLowerCase().includes(search)
    ).slice(0, 50);
  }, [options, searchValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between h-10 border-slate-200 hover:bg-slate-50 transition-all font-normal",
          !selectedValue && "text-slate-500",
          className
        )}
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
          <span className="text-sm">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[var(--radix-popover-trigger-width)] shadow-xl border-slate-200" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-10 text-sm"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-slate-500">
              <div className="flex flex-col items-center gap-2">
                <Search size={20} className="text-slate-200" />
                <p className="text-xs">{emptyMessage}</p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => {
                    onSelect(opt.value, opt.original);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="flex items-center gap-3 py-3 px-4 cursor-pointer data-[selected=true]:bg-sky-50"
                >
                  <div className="flex flex-col flex-1 leading-tight">
                    <span className="font-bold text-[13px] text-slate-900">
                      {opt.label}
                    </span>
                    {opt.subLabel && (
                      <span className="text-[10px] text-slate-500 uppercase tracking-tight">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>
                  {selectedValue === opt.value && (
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {options.length > 50 && !searchValue && (
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
