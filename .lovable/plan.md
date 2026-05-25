# Multi-Category Support for RBN Profiles

Allow each member's business profile to carry multiple business categories instead of a single one, end-to-end across signup, profile edit, directory, leads/WhatsApp, and admin.

## 1. Database (new migration)

Create a join table preserving the existing single `category_id` for backward compatibility.

```sql
create table public.business_profile_categories (
  business_profile_id uuid references public.business_profiles(id) on delete cascade,
  category_id uuid references public.business_categories(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (business_profile_id, category_id)
);
alter table public.business_profile_categories enable row level security;
```

- RLS: owner of business_profile can insert/delete; authenticated can select (directory is public to members).
- Backfill: insert one row per existing `business_profiles.category_id`.
- Keep `business_profiles.category_id` populated as the "primary" category (first selected) so old code/queries don't break.

RPC updates:
- `get_my_profile` → also return `category_ids uuid[]` and `category_names text[]`.
- `get_members_by_user_ids` → return `categories text[]` (names) in addition to existing `category`.
- New RPC `set_my_business_categories(_ids uuid[])` → replaces join rows atomically and updates `business_profiles.category_id` to `_ids[1]`.
- Directory list RPC (or its view): include aggregated category names + ids; filter accepts `_category_ids uuid[]` matching ANY.
- New `get_category_usage()` for admin (id, name, member_count).

## 2. Reusable UI component

`src/components/categories/MultiCategorySelect.tsx`
- Searchable combobox (shadcn `Command` + `Popover`) with selected items shown as removable chips.
- Props: `value: string[]`, `onChange`, `categories`, `max?`, prevents duplicates.

## 3. Signup & Profile Edit

- `src/pages/Signup.tsx`: replace single category Select with `MultiCategorySelect`; submit array via RPC.
- `src/pages/MyProfile.tsx`: state becomes `categoryIds: string[]`; on save call `set_my_business_categories`.

## 4. Profile card / Public profile / Member listing

- `src/components/public/MemberCard.tsx`, `ShareableProfileCard.tsx`, `src/pages/Member.tsx`, `DashboardDirectory.tsx`, `Directory.tsx`: render `categories[]` as badge chips, wrap, show "+N more" if >3 on cards.

## 5. Directory filters

- Replace single-select category filter with multi-select chip filter.
- Match ANY: row passes if `row.category_ids ∩ selected ≠ ∅`.
- Show active filters as removable chips above results.

## 6. Leads / WhatsApp share

- `src/hooks/useLeads.ts`: `MemberLite.categories: string[] | null` (keep `category` for fallback).
- `src/components/leads/LeadCard.tsx`: WhatsApp template prints `Categories: cat1, cat2, cat3`.

## 7. Admin

- `src/pages/admin/` add `Categories.tsx`: CRUD on `business_categories` + usage count column.
- `src/pages/admin/Members.tsx`: allow editing member categories via the same MultiCategorySelect.
- Add route + sidebar entry in `AdminSidebar.tsx`.

## 8. Migration & backward compatibility

- Trigger on `business_profile_categories` to keep `business_profiles.category_id` = any one (first) remaining row; null if empty.
- Existing reads of `category_id` keep working; new reads use `categories[]`.

## 9. Testing checklist

Signup → multi-select saves and shows on profile. Profile edit → add/remove syncs to directory immediately. Directory → multi-filter returns ANY match. Lead WhatsApp message lists all categories. Admin can CRUD categories and reassign for a member. Existing users (one category) still render correctly.

## Out of scope

Renaming `category_id`, weighting/primary-category UI beyond "first selected = primary", category hierarchy.
