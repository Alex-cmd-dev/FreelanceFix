-- Enable UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
-- Because we are using Supabase, it is highly recommended to reference their 
-- internal auth.users table for core authentication. We create a public wrapper
-- profile table that links 1:1 to auth.users.
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. FREELANCER (Linked 1:1 to USERS)
CREATE TABLE public.freelancers (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  portfolio_url TEXT,
  hourly_rate NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CLIENT (Linked 1:1 to USERS)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT,
  spending_history NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CATEGORY
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. SUBCATEGORY
CREATE TABLE public.subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (category_id, name)
);

-- 6. GIG
CREATE TABLE public.gigs (
  id SERIAL PRIMARY KEY,
  freelancer_id UUID REFERENCES public.freelancers(id) ON DELETE CASCADE,
  subcategory_id INTEGER REFERENCES public.subcategories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. GIG_PACKAGE
-- Enforce only Basic, Standard, and Premium tiers.
CREATE TYPE package_tier AS ENUM ('Basic', 'Standard', 'Premium');

CREATE TABLE public.gig_packages (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER REFERENCES public.gigs(id) ON DELETE CASCADE,
  tier package_tier NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  delivery_days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (gig_id, tier)
);

-- 8. ORDER
CREATE TYPE order_status AS ENUM ('Pending', 'In_Progress', 'Completed', 'Cancelled');

CREATE TABLE public.orders (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  gig_package_id INTEGER REFERENCES public.gig_packages(id) ON DELETE RESTRICT,
  status order_status DEFAULT 'Pending',
  total_amount NUMERIC(10, 2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. PAYMENT
CREATE TYPE payment_status AS ENUM ('Pending', 'Escrow', 'Released', 'Refunded');

CREATE TABLE public.payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status payment_status DEFAULT 'Pending',
  payment_method TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. REVIEW
CREATE TABLE public.reviews (
  id SERIAL PRIMARY KEY,
  order_id INTEGER UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. MESSAGE
CREATE TABLE public.messages (
  id SERIAL PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. PROJECT_BRIEF
CREATE TABLE public.project_briefs (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_min NUMERIC(10, 2),
  budget_max NUMERIC(10, 2),
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. BRIEF_OFFER
CREATE TABLE public.brief_offers (
  id SERIAL PRIMARY KEY,
  project_brief_id INTEGER REFERENCES public.project_briefs(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES public.freelancers(id) ON DELETE CASCADE,
  offer_amount NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Enablement Basics
-- NOTE: We enable RLS on all tables so Supabase can enforce security through JWT.
-- You can define specific access policies for these tables later.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_offers ENABLE ROW LEVEL SECURITY;
