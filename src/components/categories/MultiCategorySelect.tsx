import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type CategoryOption = { id: string; name: string };

interface Props {
  options: CategoryOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  disabled?: boolean;
  emptyText?: string;
}

/**
 * Multi-select searchable categories combobox with chip display.
 */
export function MultiCategorySelect({
  options,
  value,
  onChange,
  placeholder = "Select categories",
  max,
  disabled,
  emptyText = "No categories found.",
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => value.includes(o.id));

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (max && value.length >= max) return;
      onChange([...value, id]);
    }
  };

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between h-10 font-normal"
          >
            <span className="text-muted-foreground truncate">
              {selected.length === 0
                ? placeholder
                : `${selected.length} selected${max ? ` / ${max}` : ""}`}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories…" />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((o) => {
                  const checked = value.includes(o.id);
                  const disabledItem = !checked && !!max && value.length >= max;
                  return (
                    <CommandItem
                      key={o.id}
                      value={o.name}
                      onSelect={() => !disabledItem && toggle(o.id)}
                      className={cn(disabledItem && "opacity-50 cursor-not-allowed")}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          checked ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {o.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
            >
              {s.name}
              <button
                type="button"
                onClick={() => remove(s.id)}
                disabled={disabled}
                className="hover:text-primary/70"
                aria-label={`Remove ${s.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiCategorySelect;