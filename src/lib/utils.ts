import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeFormat(date: any, formatStr: string, options?: any) {
  if (!date) return '';
  const d = new Date(date);
  if (!isValid(d)) return String(date || '');
  return format(d, formatStr, { locale: id, ...options });
}

export function safeCompareDates(a: any, b: any, order: 'asc' | 'desc' = 'desc') {
  const dateA = a ? new Date(a) : new Date(0);
  const dateB = b ? new Date(b) : new Date(0);
  
  const timeA = isValid(dateA) ? dateA.getTime() : 0;
  const timeB = isValid(dateB) ? dateB.getTime() : 0;
  
  return order === 'desc' ? timeB - timeA : timeA - timeB;
}
