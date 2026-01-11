"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string // YYYY-MM-DD format
  onChange: (date: string) => void
  placeholder?: string
  disabled?: boolean
  min?: string // YYYY-MM-DD format
  max?: string // YYYY-MM-DD format
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  min,
  max,
  className,
}: DatePickerProps) {
  const formatDateForDisplay = (dateStr: string | undefined) => {
    if (!dateStr) return ""
    const [year, month, day] = dateStr.split("-")
    return `${day}/${month}/${year}`
  }

  return (
    <div className={cn("relative", className)}>
      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        className={cn(
          "pl-10",
          !value && "text-muted-foreground"
        )}
      />
    </div>
  )
}
