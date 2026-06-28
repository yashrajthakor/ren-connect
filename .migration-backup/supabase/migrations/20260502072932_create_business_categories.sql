/*
  # Create business_categories table

  1. New Tables
    - `business_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null) - category name
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `business_categories` table
    - Add SELECT policy for authenticated and unauthenticated users (needed during signup)
    - No INSERT/UPDATE/DELETE policies (admin-managed data)

  3. Seed Data
    - Inserts common business categories for the REN network

  4. Important Notes
    - This table is read-only for all users; only admins should modify categories
    - Categories are ordered alphabetically by name
*/

CREATE TABLE IF NOT EXISTS business_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated signup flow) to read categories
CREATE POLICY "Anyone can view business categories"
  ON business_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Seed common business categories
INSERT INTO business_categories (name) VALUES
  ('Agriculture & Farming'),
  ('Apparel & Textiles'),
  ('Architecture & Interior Design'),
  ('Automobile & Auto Parts'),
  ('Banking & Finance'),
  ('Beauty & Wellness'),
  ('Chemicals & Pharmaceuticals'),
  ('Construction & Real Estate'),
  ('Consulting & Advisory'),
  ('Education & Training'),
  ('Electronics & Consumer Goods'),
  ('Energy & Renewables'),
  ('Event Management'),
  ('Food & Beverage'),
  ('Freight & Logistics'),
  ('Healthcare & Medical'),
  ('Hospitality & Tourism'),
  ('IT & Software'),
  ('Insurance'),
  ('Jewelry & Precious Metals'),
  ('Legal Services'),
  ('Manufacturing'),
  ('Marketing & Advertising'),
  ('Media & Entertainment'),
  ('Mining & Minerals'),
  ('NGO & Social Enterprise'),
  ('Petroleum & Gas'),
  ('Photography & Videography'),
  ('Printing & Publishing'),
  ('Retail & E-commerce'),
  ('Security & Surveillance'),
  ('Sports & Fitness'),
  ('Telecommunications'),
  ('Transportation'),
  ('Other')
ON CONFLICT (name) DO NOTHING;
