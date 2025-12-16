import { useState } from "react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateRange = {
  from: Date;
  to: Date;
};

export type FilterPreset = "today" | "yesterday" | "week" | "month" | "custom";

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  preset: FilterPreset;
  onPresetChange: (preset: FilterPreset) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange, preset, onPresetChange }: DateRangeFilterProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handlePresetClick = (newPreset: FilterPreset) => {
    const today = new Date();
    let from: Date;
    let to: Date;

    switch (newPreset) {
      case "today":
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case "yesterday":
        from = startOfDay(subDays(today, 1));
        to = endOfDay(subDays(today, 1));
        break;
      case "week":
        from = startOfWeek(today, { weekStartsOn: 1 });
        to = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "month":
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      default:
        return;
    }

    onPresetChange(newPreset);
    onDateRangeChange({ from, to });
  };

  const handleCustomDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onPresetChange("custom");
      onDateRangeChange({ from: startOfDay(range.from), to: endOfDay(range.to) });
      setCalendarOpen(false);
    }
  };

  const presets = [
    { key: "today" as FilterPreset, label: "Hoje" },
    { key: "yesterday" as FilterPreset, label: "Ontem" },
    { key: "week" as FilterPreset, label: "Esta Semana" },
    { key: "month" as FilterPreset, label: "Este Mês" },
  ];

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {presets.map((p) => (
        <Button
          key={p.key}
          variant={preset === p.key ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(p.key)}
        >
          {p.label}
        </Button>
      ))}
      
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={preset === "custom" ? "default" : "outline"}
            size="sm"
            className={cn("gap-2", preset === "custom" && "bg-primary")}
          >
            <CalendarIcon className="h-4 w-4" />
            {preset === "custom" 
              ? `${format(dateRange.from, "dd/MM", { locale: pt })} - ${format(dateRange.to, "dd/MM", { locale: pt })}`
              : "Personalizado"
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={dateRange.from}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={handleCustomDateSelect}
            numberOfMonths={2}
            locale={pt}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
