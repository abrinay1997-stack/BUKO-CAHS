
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.0';

// Note: These would typically come from environment variables
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * DATABASE SCHEMA SETUP (SQL to run in Supabase SQL Editor):
 * 
 * create table profiles (
 *   id uuid references auth.users on delete cascade primary key,
 *   email text,
 *   full_name text,
 *   avatar_url text,
 *   updated_at timestamp with time zone
 * );
 * 
 * create table transactions (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users not null,
 *   amount numeric not null,
 *   description text,
 *   date timestamp with time zone not null,
 *   category_id text,
 *   wallet_id text not null,
 *   transfer_to_wallet_id text,
 *   type text check (type in ('income', 'expense', 'transfer')),
 *   is_business boolean default false,
 *   is_recurring boolean default false,
 *   created_at timestamp with time zone default now()
 * );
 * 
 * -- Repeat for wallets, categories, and recurring_rules...
 */
