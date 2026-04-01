import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function safeSpread<T extends object>(obj: T | null | undefined): T {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Cannot spread non-object');
  }
  return obj as T;
}