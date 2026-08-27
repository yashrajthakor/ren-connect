import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

/** Sentinel for "no filter" — Radix forbids an empty-string item value. */
export const ALL_MEMBERS = "all";

export interface MemberFilterOption {
  user_id: string;
  name: string;
  business: string | null;
  /** How many records (leads/logs) this person has in the current scope — shown as "Name (N)". */
  count: number;
}

/**
 * Searchable member picker used by the admin list filters (Leads & Business,
 * 1:1 Feed). Options are the full Valuable Members roster, each annotated
 * with their record count in the current scope (0 if they have none) — so
 * every Valuable Member is always selectable, not just those with activity.
 */
export default function MemberFilterCombobox({
  label,
  value,
  onChange,
  options,
  className = "w-full sm:w-[190px]",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: MemberFilterOption[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((o) => o.user_id === value);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options
      .filter((o) => o.name.toLowerCase().includes(q) || (o.business || "").toLowerCase().includes(q))
      .slice(0, 50);
  }, [options, search]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={`inline-flex h-9 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted transition-colors ${className}`}
        >
          <span className={value === ALL_MEMBERS ? "text-muted-foreground truncate" : "truncate"}>
            {value === ALL_MEMBERS ? label : selected ? `${selected.name} (${selected.count})` : label}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search by name or business..." value={search} onValueChange={setSearch} />
          <CommandList className="max-h-56">
            <CommandEmpty>No members found</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={ALL_MEMBERS}
                onSelect={() => pick(ALL_MEMBERS)}
                className="flex items-center gap-2 py-2"
              >
                <span className="flex-1 text-sm">{label} (All)</span>
                {value === ALL_MEMBERS && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </CommandItem>
              {filtered.map((o) => (
                <CommandItem
                  key={o.user_id}
                  value={o.user_id}
                  onSelect={() => pick(o.user_id)}
                  className="flex items-center gap-2 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">
                      {o.name} <span className="text-muted-foreground">({o.count})</span>
                    </p>
                    {o.business && <p className="text-xs text-muted-foreground truncate">{o.business}</p>}
                  </div>
                  {value === o.user_id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
