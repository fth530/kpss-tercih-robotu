import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";

export type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  maxBadges?: number;
  emptyMessage?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seçiniz...",
  className,
  maxBadges = 2,
  emptyMessage = "Sonuç bulunamadı.",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  // Smart search and sort function
  const getFilteredAndSortedOptions = () => {
    if (!searchQuery) return options;

    const query = searchQuery.toLowerCase().trim();
    
    return options
      .map(option => {
        const label = option.label.toLowerCase();
        const value = option.value.toLowerCase();
        const words = label.split(/[\s,.-]+/); // Split by spaces, commas, dots, dashes
        
        // Calculate relevance score
        let score = 0;
        
        // Check value (code) first - highest priority
        if (value === query) score = 10000;
        else if (value.startsWith(query)) score = 9000;
        else if (value.includes(query)) score = 8000;
        
        // Check label
        // Exact word match (very high priority)
        if (words.some(word => word === query)) score = Math.max(score, 7000);
        // Word starts with query
        else if (words.some(word => word.startsWith(query))) score = Math.max(score, 6000);
        // Label starts with query
        else if (label.startsWith(query)) score = Math.max(score, 5000);
        // First word contains query
        else if (words[0]?.includes(query)) score = Math.max(score, 4000);
        // Any word contains query
        else if (words.some(word => word.includes(query))) score = Math.max(score, 3000);
        // Contains query anywhere
        else if (label.includes(query)) score = Math.max(score, 2000);
        // No match
        else return null;
        
        // Bonus for position (earlier = better)
        const position = label.indexOf(query);
        if (position >= 0) {
          score += Math.max(0, 500 - position * 10);
        }
        
        // Bonus for shorter matches (more specific)
        score += Math.max(0, 200 - label.length / 2);
        
        // Penalty for very long descriptions
        if (label.length > 100) score -= 100;
        
        return { ...option, score };
      })
      .filter((item): item is Option & { score: number } => item !== null)
      .sort((a, b) => b.score - a.score);
  };

  const filteredOptions = getFilteredAndSortedOptions();

  // Ensure "All" logic is handled by parent, but here we can check if "All" is selected
  // If "Tümü" or "All" is selected, usually it's the only one.
  // But purely for UI, we just render what is passed in `selected`.

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-card hover:bg-accent/10 border-input h-auto min-h-[3rem] py-2",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
            {selected.length === 0 && (
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            )}
            {selected.length > 0 && selected.length <= maxBadges ? (
              selected.map((item) => {
                const label = options.find((option) => option.value === item)?.label || item;
                const displayLabel = label.length > 30 ? label.substring(0, 30) + "..." : label;
                
                return (
                  <Badge
                    variant="secondary"
                    key={item}
                    className="mr-1 mb-1 font-normal bg-primary/20 text-primary-foreground hover:bg-primary/30 border-primary/20 max-w-[200px] truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(item);
                    }}
                  >
                    <span className="truncate">{displayLabel}</span>
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shrink-0"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUnselect(item);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnselect(item);
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                );
              })
            ) : selected.length > maxBadges ? (
               <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/20">
                {selected.length} seçildi
               </Badge>
            ) : null}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover border-border" align="start">
        <Command className="bg-popover text-popover-foreground" shouldFilter={false}>
          <CommandInput 
            placeholder="Ara..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto custom-scrollbar">
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => {
                  if (option.value === "Tümü" || option.value === "All") {
                      if (selected.includes(option.value)) {
                          onChange([]);
                      } else {
                          onChange([option.value]);
                      }
                  } else {
                      const newSelected = selected.filter(s => s !== "Tümü" && s !== "All");
                      
                      if (selected.includes(option.value)) {
                        onChange(newSelected.filter((item) => item !== option.value));
                      } else {
                        onChange([...newSelected, option.value]);
                      }
                  }
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 text-primary",
                    selected.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className={cn(selected.includes(option.value) && "font-medium text-primary")}>
                    {option.label}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
