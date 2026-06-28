-- Add profile_type to business_profiles for Business vs Job segmentation
do $$ begin
  create type public.profile_type as enum ('business', 'job');
exception when duplicate_object then null; end $$;

alter table public.business_profiles
  add column if not exists profile_type public.profile_type not null default 'business';
