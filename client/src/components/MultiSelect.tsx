import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type Option = {
  label: string;
  value: string;
  badge?: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  // Handle "All" selection logic specially if present in options
  const handleSelect = (currentValue: string) => {
    if (currentValue === "Tümü" || currentValue === "All") {
      if (selected.includes("Tümü") || selected.includes("All")) {
        onChange([]);
      } else {
        onChange(["Tümü"]); // Exclusive selection for "All"
      }
      return;
    }

    // If "All" was selected, remove it when selecting specific items
    let newSelected = selected.filter(s => s !== "Tümü" && s !== "All");

    if (newSelected.includes(currentValue)) {
      newSelected = newSelected.filter((item) => item !== currentValue);
    } else {
      newSelected = [...newSelected, currentValue];
    }
    
    onChange(newSelected);
  };

  const isAllSelected = selected.includes("Tümü") || selected.includes("All");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-[3rem] py-2 px-3 text-left font-normal bg-background hover:bg-background/80",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1.5">
            {selected.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            
            {isAllSelected && (
              <Badge variant="secondary" className="rounded-md px-2 py-0.5 font-medium border-primary/20 bg-primary/5 text-primary">
                Tümü
              </Badge>
            )}

            {!isAllSelected && selected.map((item) => {
              const option = options.find((o) => o.value === item);
              return (
                <Badge
                  key={item}
                  variant="secondary"
                  className="rounded-md px-2 py-0.5 font-medium border-primary/20 bg-primary/5 text-primary group"
                >
                  {option ? (option.badge || option.label) : item}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 opacity-50 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => handleUnselect(item)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {option?.label}</span>
                  </button>
                </Badge>
              );
            })}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 min-w-[var(--radix-popover-trigger-width)]" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto custom-scrollbar">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label} // Search by label
                onSelect={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 text-primary",
                    selected.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className={cn("font-medium", option.value === option.label ? "" : "text-sm")}>{option.label}</span>
                  {option.value !== option.label && <span className="text-xs text-muted-foreground font-mono">{option.value}</span>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
