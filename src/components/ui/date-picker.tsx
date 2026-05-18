import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { id } from "date-fns/locale"

import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button" // No longer needed as we'll use buttonVariants or manual styles
import { buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ date, setDate, placeholder, className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start text-left font-normal h-10 bg-slate-50 border-slate-200 hover:bg-slate-100",
          !date && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
        {date ? format(date, "PPP", { locale: id }) : <span>{placeholder || "Pilih tanggal"}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          locale={id}
        />
      </PopoverContent>
    </Popover>
  )
}
