import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Meeting Attendance module. Distinct from `useMeetings.ts` (the unrelated
 * 1:1 Feed / `one_to_one_meetings` table) — no shared tables, routes, or
 * query keys between the two.
 */

export type MeetingStatus = "upcoming" | "live" | "completed";

/** How the person attended THIS meeting — a historical snapshot, never
 * re-derived from their current membership_type. */
export type AttendanceType = "valuable_member" | "visitor";

export interface AttendanceMeeting {
  id: string;
  title: string;
  meeting_date: string;
  meeting_time: string;
  venue: string | null;
  description: string | null;
  status: MeetingStatus;
  created_at: string;
  total_present: number;
}

export interface MeetingAttendanceRow {
  attendance_id: string;
  member_id: string;
  member_name: string;
  business_name: string | null;
  phone: string | null;
  check_in_time: string;
  method: "qr" | "manual";
  attendance_type: AttendanceType;
}

/** A person as shown in the "Attendance As: Visitor" search — the superset
 * of all registered people (current Visitors AND current Valuable Members),
 * since someone who is a Valuable Member today may have attended an older
 * meeting as a Visitor. Also used as the "Referred By" dropdown source. */
export interface AttendanceSearchMember {
  member_id: string;
  full_name: string;
  business_name: string | null;
  phone: string | null;
  profile_picture: string | null;
  membership_type: string | null;
}

export interface MemberAttendanceHistoryRow {
  meeting_id: string;
  title: string;
  meeting_date: string;
  present: boolean;
  check_in_time: string | null;
}

export interface MarkAttendanceResult {
  duplicate: boolean;
  member_id: string;
  member_name: string;
  check_in_time: string;
}

const MEETINGS_KEY = ["attendance-meetings"];
const LIVE_MEETING_KEY = ["attendance-live-meeting"];

export function useAttendanceMeetings(enabled = true) {
  return useQuery({
    queryKey: MEETINGS_KEY,
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("list_meetings_for_admin");
      if (error) throw error;
      return (data || []) as AttendanceMeeting[];
    },
    staleTime: 15_000,
  });
}

export function useLiveMeeting(enabled = true) {
  return useQuery({
    queryKey: LIVE_MEETING_KEY,
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_live_meeting");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row || null) as AttendanceMeeting | null;
    },
    staleTime: 5_000,
  });
}

export function useMeetingAttendance(meetingId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["attendance-meeting-rows", meetingId],
    enabled: enabled && !!meetingId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_meeting_attendance", { _meeting_id: meetingId });
      if (error) throw error;
      return (data || []) as MeetingAttendanceRow[];
    },
    staleTime: 5_000,
  });
}

export function useMemberAttendanceHistory(memberId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["member-attendance-history", memberId],
    enabled: enabled && !!memberId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_member_attendance_history", { _member_id: memberId });
      if (error) throw error;
      return (data || []) as MemberAttendanceHistoryRow[];
    },
    staleTime: 15_000,
  });
}

/** All registered people (Visitors + Valuable Members) — used when "Attendance As: Visitor". */
export function useAllMembersForAttendanceSearch(enabled = true) {
  return useQuery({
    queryKey: ["attendance-all-members-search"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("list_all_members_for_attendance_search");
      if (error) throw error;
      return (data || []) as AttendanceSearchMember[];
    },
    staleTime: 15_000,
  });
}

export interface MeetingFormInput {
  title: string;
  meeting_date: string;
  meeting_time: string;
  venue?: string | null;
  description?: string | null;
}

export function useCreateAttendanceMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MeetingFormInput) => {
      const { data, error } = await (supabase as any).rpc("create_meeting", {
        _title: input.title,
        _meeting_date: input.meeting_date,
        _meeting_time: input.meeting_time,
        _venue: input.venue ?? null,
        _description: input.description ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MEETINGS_KEY }),
  });
}

export function useUpdateAttendanceMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: MeetingFormInput & { id: string }) => {
      const { data, error } = await (supabase as any).rpc("update_meeting", {
        _meeting_id: id,
        _title: input.title,
        _meeting_date: input.meeting_date,
        _meeting_time: input.meeting_time,
        _venue: input.venue ?? null,
        _description: input.description ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MEETINGS_KEY }),
  });
}

export function useDeleteAttendanceMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).rpc("delete_meeting", { _meeting_id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MEETINGS_KEY }),
  });
}

export function useStartMeetingAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).rpc("start_meeting_attendance", { _meeting_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEETINGS_KEY });
      qc.invalidateQueries({ queryKey: LIVE_MEETING_KEY });
    },
  });
}

export function useCloseMeetingAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).rpc("close_meeting_attendance", { _meeting_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MEETINGS_KEY });
      qc.invalidateQueries({ queryKey: LIVE_MEETING_KEY });
    },
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      meetingId,
      memberId,
      method,
      attendanceType = "valuable_member",
    }: {
      meetingId: string;
      memberId: string;
      method: "qr" | "manual";
      attendanceType?: AttendanceType;
    }) => {
      const { data, error } = await (supabase as any).rpc("mark_attendance", {
        _meeting_id: meetingId,
        _member_id: memberId,
        _method: method,
        _attendance_type: attendanceType,
      });
      if (error) throw error;
      return data as MarkAttendanceResult;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: MEETINGS_KEY });
      qc.invalidateQueries({ queryKey: ["attendance-meeting-rows", variables.meetingId] });
    },
  });
}

/**
 * Admin correction path: add a missed check-in regardless of meeting status
 * (upcoming/live/completed) — also how Backdated Attendance is recorded.
 * `checkInTime` (ISO string) lets the admin override the default of "now".
 */
export function useAdminAddAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      meetingId,
      memberId,
      checkInTime,
      attendanceType = "valuable_member",
    }: {
      meetingId: string;
      memberId: string;
      checkInTime?: string | null;
      attendanceType?: AttendanceType;
    }) => {
      const { data, error } = await (supabase as any).rpc("admin_add_attendance", {
        _meeting_id: meetingId,
        _member_id: memberId,
        _check_in_time: checkInTime ?? null,
        _attendance_type: attendanceType,
      });
      if (error) throw error;
      return data as MarkAttendanceResult;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: MEETINGS_KEY });
      qc.invalidateQueries({ queryKey: ["attendance-meeting-rows", variables.meetingId] });
    },
  });
}

/**
 * Add New Visitor, directly from the attendance screen: creates the member
 * (+ optional business profile) and marks them present for `meetingId` in
 * one atomic RPC call — the admin never has to leave the attendance page.
 */
export function useCreateVisitorAndCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      meetingId,
      fullName,
      phone,
      businessName,
      city,
      referredByMemberId,
      checkInTime,
    }: {
      meetingId: string;
      fullName: string;
      phone?: string | null;
      businessName?: string | null;
      city?: string | null;
      referredByMemberId: string;
      checkInTime?: string | null;
    }) => {
      const { data, error } = await (supabase as any).rpc("create_visitor_and_check_in", {
        _meeting_id: meetingId,
        _full_name: fullName,
        _phone: phone ?? null,
        _business_name: businessName ?? null,
        _city: city ?? null,
        _referred_by_member_id: referredByMemberId,
        _check_in_time: checkInTime ?? null,
      });
      if (error) throw error;
      return data as MarkAttendanceResult;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: MEETINGS_KEY });
      qc.invalidateQueries({ queryKey: ["attendance-meeting-rows", variables.meetingId] });
      qc.invalidateQueries({ queryKey: ["attendance-all-members-search"] });
    },
  });
}

/** Admin correction path: remove a mistaken attendance record regardless of meeting status. */
export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attendanceId }: { attendanceId: string; meetingId: string }) => {
      const { error } = await (supabase as any).rpc("remove_attendance", { _attendance_id: attendanceId });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: MEETINGS_KEY });
      qc.invalidateQueries({ queryKey: ["attendance-meeting-rows", variables.meetingId] });
    },
  });
}
