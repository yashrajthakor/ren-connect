import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Loader2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSelfCheckIn } from "@/hooks/useAttendanceMeetings";
import { formatDateOrNA } from "@/lib/membershipStatus";
import { formatCheckInTime } from "@/lib/attendanceFormat";
import renLogo from "@/assets/ren-logo.png";

export default function MeetingCheckIn() {
  const { token = "" } = useParams();
  const checkIn = useSelfCheckIn();
  const attemptedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!token || attemptedFor.current === token) return;
    attemptedFor.current = token;
    checkIn.mutate(token);
  }, [token]);

  const result = checkIn.data;

  return (
    <div className="min-h-screen bg-gradient-royal flex items-center justify-center px-4 py-10">
      <Helmet>
        <title>Meeting Check-in — RBN</title>
      </Helmet>
      <Card className="w-full max-w-sm p-8 text-center">
        <img src={renLogo} alt="RBN" className="mx-auto mb-5 h-14 w-14 rounded-full object-contain" />

        {checkIn.isError ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">Couldn't mark attendance</h1>
            <p className="mt-2 text-sm text-muted-foreground">{(checkIn.error as Error)?.message}</p>
            <Button variant="outline" className="mt-6 w-full" onClick={() => checkIn.mutate(token)}>
              Try again
            </Button>
          </>
        ) : result ? (
          <>
            <div
              className={
                result.duplicate
                  ? "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15"
                  : "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15"
              }
            >
              <CheckCircle2
                className={result.duplicate ? "h-7 w-7 text-amber-600" : "h-7 w-7 text-emerald-600"}
              />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {result.duplicate ? "Already checked in" : "You're checked in!"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.duplicate
                ? `${result.member_name}, your attendance was already marked.`
                : `Welcome, ${result.member_name}.`}
            </p>

            <div className="mt-5 space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-left text-sm">
              <p className="font-semibold text-foreground">{result.meeting_title}</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" /> {formatDateOrNA(result.meeting_date)}
              </p>
              {result.meeting_venue && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> {result.meeting_venue}
                </p>
              )}
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" /> Checked in at {formatCheckInTime(result.check_in_time)}
              </p>
            </div>
          </>
        ) : (
          <div className="py-6">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Marking your attendance…</p>
          </div>
        )}

        <Button asChild variant="royal" className="mt-4 w-full">
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      </Card>
    </div>
  );
}
