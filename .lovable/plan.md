## REN Lead Sharing & Business Tracking System

Build a member-to-member referral system inside the existing dashboard, with full CRUD for leads, status workflow, and admin analytics.

---

### 1. Database (new migration)

**`leads` table**
- `id uuid pk`
- `giver_id uuid` → auth.users (logged-in sharer)
- `receiver_id uuid` → auth.users (assigned member)
- `lead_name text`, `contact_number text`, `description text`
- `priority text` (low / medium / high)
- `status text` (pending / in_process / business_closed / rejected) default 'pending'
- `rejection_reason text null`
- `closure_amount numeric null`, `closure_date timestamptz null`
- `created_at`, `updated_at`

**`lead_status_history` table**
- `id`, `lead_id`, `changed_by`, `from_status`, `to_status`, `note`, `created_at`
- Auto-populated by trigger on `leads` insert/update

**`business_closures` table**
- `id`, `lead_id`, `giver_id`, `receiver_id`, `amount`, `closure_date`, `created_at`
- Auto-populated by trigger when status → business_closed

**RLS policies**
- Members: SELECT/UPDATE rows where `giver_id = auth.uid()` OR `receiver_id = auth.uid()`. INSERT where `giver_id = auth.uid()`.
- Receiver can update status / closure / rejection fields.
- Giver can edit own pending leads.
- Admins/super_admins (via existing `has_role`): SELECT all on all 3 tables.
- History/closures: insert only via trigger; SELECT for participants + admins.

---

### 2. Routes (in `src/App.tsx`, under `/dashboard`)

- `/dashboard/leads` — Lead Dashboard (tabs: Received | Given) — becomes primary post-login landing
- `/dashboard/leads/:id` — Lead detail with status timeline
- `/admin/leads` — Admin overview with analytics

Update Login redirect target → `/dashboard/leads`.

---

### 3. Components

- `src/pages/dashboard/Leads.tsx` — tabs (Received/Given), status filter chips, card grid, floating "+" button
- `src/components/leads/LeadCard.tsx` — name, contact, priority + status badge, giver/receiver avatar, quick actions
- `src/components/leads/CreateLeadDialog.tsx` — member picker (search verified directory), lead form with zod validation
- `src/components/leads/LeadDetailDialog.tsx` — full info + status history timeline + action buttons
- `src/components/leads/UpdateStatusDialog.tsx` — flows for "Mark In Process", "Mark Business Closed" (amount + date), "Reject" (reason)
- `src/components/leads/FloatingAddButton.tsx`
- `src/pages/admin/Leads.tsx` — KPI cards (total leads, conversion rate, total business volume), table with all leads, top givers/receivers

Update `DashboardSidebar.tsx`: add "Leads" (LayoutDashboard-style icon) as top item; "Leads Received" and "Leads Given" sub-links optional.
Update `AdminSidebar.tsx`: add "Leads Analytics" link.

---

### 4. Member picker

Query `members` table (existing) where status = verified/active, exclude self. Searchable command/combobox UI.

---

### 5. Status workflow UI

```text
[Pending] ──► [In Process] ──► [Business Closed]
     │                    └──► [Rejected]
     └──► [Rejected]
```
Receiver-only actions. Giver sees read-only progression + timeline.

Status badges colored: pending=secondary, in_process=blue, business_closed=green (primary), rejected=destructive.

---

### 6. Validation (zod)
- lead_name: 2-100 chars
- contact_number: 7-15 digits, regex
- description: ≤500 chars
- closure_amount: positive number, ≤ 10^9
- rejection_reason: 5-300 chars

---

### 7. Admin analytics
- Cards: Total Leads, In Process, Closed, Rejected, Total Business Volume (₹), Conversion %
- Table: all leads with giver/receiver names, status, amount
- Optional: top 5 givers / receivers by closures

---

### Tech notes
- React Query for fetching `leads`, `lead_status_history`, `business_closures`.
- Realtime: enable Supabase realtime on `leads` so receiver sees new leads instantly.
- All UI uses existing semantic tokens, shadcn primitives, mobile-first card grid.
- Floating "+" button: fixed bottom-right, primary gradient, hidden on detail dialog open.

---

### Files to create
- `supabase/migrations/20260507120000_leads_system.sql`
- `src/pages/dashboard/Leads.tsx`
- `src/pages/admin/Leads.tsx`
- `src/components/leads/*` (5 files above)
- `src/hooks/useLeads.ts` (data hooks)

### Files to edit
- `src/App.tsx` (routes)
- `src/components/dashboard/DashboardSidebar.tsx` (Leads nav)
- `src/components/admin/AdminSidebar.tsx` (Leads analytics nav)
- `src/pages/Login.tsx` (redirect → `/dashboard/leads`)
- `src/pages/Dashboard.tsx` (add Leads quick card + summary)
