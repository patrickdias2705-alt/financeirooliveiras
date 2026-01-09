"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

export type DateFilterType = "day" | "week" | "month" | "year" | "all";

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateFilterProps {
  onFilterChange: (range: DateRange | null, type: DateFilterType) => void;
  defaultType?: DateFilterType;
}

export function DateFilter({ onFilterChange, defaultType = "all" }: DateFilterProps) {
  const [filterType, setFilterType] = useState<DateFilterType>(defaultType);

  const getDateRange = (type: DateFilterType): DateRange | null => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (type) {
      case "day":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case "week":
        const dayOfWeek = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      case "all":
        return null;
      default:
        return null;
    }

    return { start, end };
  };

  const handleFilterChange = (type: DateFilterType) => {
    setFilterType(type);
    const range = getDateRange(type);
    onFilterChange(range, type);
  };

  const getFilterLabel = (type: DateFilterType): string => {
    switch (type) {
      case "day":
        return "Hoje";
      case "week":
        return "Esta Semana";
      case "month":
        return "Este Mês";
      case "year":
        return "Este Ano";
      case "all":
        return "Todos";
      default:
        return "Todos";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <Select value={filterType} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Períodos</SelectItem>
          <SelectItem value="day">Hoje</SelectItem>
          <SelectItem value="week">Esta Semana</SelectItem>
          <SelectItem value="month">Este Mês</SelectItem>
          <SelectItem value="year">Este Ano</SelectItem>
        </SelectContent>
      </Select>
      {filterType !== "all" && (
        <span className="text-sm text-muted-foreground">
          {getFilterLabel(filterType)}
        </span>
      )}
    </div>
  );
}

