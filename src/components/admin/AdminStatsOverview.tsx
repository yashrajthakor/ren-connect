import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { Handshake, IndianRupee, Star, Users, FileText, Rss, Trophy, CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminDashboardStats } from "@/hooks/useAdminStats";
import { getPresetRange, PRESET_LABELS, type DatePreset } from "@/lib/dateRanges";

/** Cards whose leaderboard entries are a count (e.g. meetings) vs. a currency amount (e.g. top givers). */
type LeaderboardKind = "count" | "amount";

type CardDef = {
  key: string;
  icon: typeof Rss;
  title: string;
  value: string | number;
  href: string;
  leaderboard?: Array<{ user_id: string; name: string; count?: number; amount?: number }>;
  leaderboardKind?: LeaderboardKind;
};

const PRESET_ORDER: DatePreset[] = ["today", "week", "month", "year", "custom"];

export default function AdminStatsOverview() {
  const navigate = useNavigate();
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customRange, setCustomRange] = useState<DayPickerRange | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { start, end } = useMemo(() => {
    if (preset === "custom" && customRange?.from && customRange?.to) {
      return getPresetRange("custom", { from: customRange.from, to: customRange.to });
    }
    // Custom selected but not fully picked yet — show this month meanwhile.
    return getPresetRange(preset === "custom" ? "month" : preset);
  }, [preset, customRange]);

  const { data: stats, isLoading, isError } = useAdminDashboardStats(start, end);

  const rangeParams = `from=${encodeURIComponent(start.toISOString())}&to=${encodeURIComponent(end.toISOString())}`;

  const cards: CardDef[] = [
    {
      key: "meetings",
      icon: Rss,
      title: "1:1 Meetings",
      value: stats?.meetings_total ?? 0,
      href: `/admin/meetings?${rangeParams}`,
      leaderboard: stats?.meetings_leaderboard,
      leaderboardKind: "count",
    },
    {
      key: "referrals",
      icon: Handshake,
      title: "Referrals",
      value: stats?.referrals_total ?? 0,
      href: `/admin/leads?${rangeParams}`,
      leaderboard: stats?.top_referral_givers,
      leaderboardKind: "count",
    },
    {
      key: "business",
      icon: IndianRupee,
      title: "Business Generated",
      value: `₹${(stats?.business_generated ?? 0).toLocaleString("en-IN")}`,
      href: `/admin/leads?${rangeParams}`,
    },
    {
      key: "top_givers",
      icon: Trophy,
      title: "Highest Business Giver",
      value: stats?.top_givers?.[0]
        ? `₹${stats.top_givers[0].amount.toLocaleString("en-IN")}`
        : "₹0",
      href: `/admin/leads?${rangeParams}`,
      leaderboard: stats?.top_givers,
      leaderboardKind: "amount" as LeaderboardKind,
    },
    {
      key: "new_paid",
      icon: Star,
      title: "New Paid Members",
      value: stats?.new_paid_members ?? 0,
      href: "/admin/members?membership=paid_member",
    },
    {
      key: "total_paid",
      icon: Users,
      title: "Total Paid Members",
      value: stats?.total_paid_members ?? 0,
      href: "/admin/members?membership=paid_member",
    },
    {
      key: "registrations",
      icon: FileText,
      title: "New Registrations",
      value: stats?.new_registrations ?? 0,
      href: `/admin/applications?${rangeParams}`,
    },
  ];

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-foreground">Statistics Overview</h2>
        <div className="flex items-center gap-2">
          <Select
            value={preset}
            onValueChange={(v) => {
              setPreset(v as DatePreset);
              setPickerOpen(v === "custom");
            }}
          >
            <SelectTrigger className="h-9 w-[150px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_ORDER.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRESET_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {preset === "custom" && (
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted transition-colors"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {customRange?.from && customRange?.to
                    ? `${customRange.from.toLocaleDateString()} – ${customRange.to.toLocaleDateString()}`
                    : "Pick dates"}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={customRange}
                  onSelect={setCustomRange}
                  numberOfMonths={2}
                  defaultMonth={customRange?.from}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {isError && (
        <Card className="p-4 mb-4 text-sm text-destructive">
          Couldn't load statistics. Please refresh the page.
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => navigate(c.href)}
            className="text-left bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{c.title}</p>
                <p className="text-xl font-display font-bold text-foreground truncate">
                  {isLoading ? "…" : c.value}
                </p>
              </div>
            </div>
            {!isLoading && (c.leaderboard?.length ?? 0) > 0 && (
              <ol className="mt-3 space-y-1 border-t border-border pt-2.5">
                {c.leaderboard!.slice(0, 5).map((entry, i) => (
                  <li key={entry.user_id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-muted-foreground">
                      {i + 1}. {entry.name}
                    </span>
                    <span className="shrink-0 font-semibold text-foreground">
                      {c.leaderboardKind === "amount"
                        ? `₹${(entry.amount ?? 0).toLocaleString("en-IN")}`
                        : entry.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
